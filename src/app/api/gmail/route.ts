import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ParsedOrderData } from '@/lib/types';
import { parseOrderFromEmail } from '@/lib/parse-order-from-email';
import {
  parseOrderWithAI,
  createDefaultParsedData
} from '@/lib/parse-order-with-ai';

// Define a type for API errors
interface ApiError {
  message?: string;
  code?: string;
  errors?: Array<{ message: string; domain: string; reason: string }>;
}

// Interface for attachment data
interface Attachment {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
  data?: string; // Base64 encoded data
}

export async function GET(request: NextRequest) {
  try {
    console.log('Starting Gmail API request');

    // Get the auth session directly using the auth() function
    const session = await auth();
    console.log('Session:', session ? 'Found session' : 'No session');

    if (!session || !session.user) {
      console.log('Authentication failed: No valid session or user');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('User authenticated:', session.user.email);

    // Get the Google account from the database for this user
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });

    console.log('Google account:', account ? 'Found' : 'Not found');

    if (!account) {
      console.log('No Google account found for user ID:', session.user.id);
      return NextResponse.json(
        { error: 'No Google account found. Please sign in with Google.' },
        { status: 401 }
      );
    }

    if (!account.access_token) {
      console.log('No access token found for Google account');
      return NextResponse.json(
        { error: 'No valid access token found. Please sign in again.' },
        { status: 401 }
      );
    }

    // Check if we have a refresh token
    if (!account.refresh_token) {
      console.log(
        'No refresh token found. User needs to re-authenticate with proper scopes.'
      );
      return NextResponse.json(
        {
          error:
            'Gmail access requires additional permissions. Please sign out and sign in again to grant these permissions.',
          authError: 'MISSING_REFRESH_TOKEN'
        },
        { status: 403 }
      );
    }

    console.log(
      'Google account has access token',
      account.access_token.substring(0, 5) + '...'
    );
    console.log(
      'Token expires at:',
      account.expires_at
        ? new Date(account.expires_at * 1000).toISOString()
        : 'No expiration'
    );
    console.log('Refresh token available:', !!account.refresh_token);

    // Create OAuth2 client with credentials from environment
    const oauth2Client = new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      process.env.NEXTAUTH_URL
    );

    // Set credentials with both access and refresh tokens
    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined
    });

    // Handle token refresh if needed
    if (account.expires_at && Date.now() > account.expires_at * 1000) {
      console.log('Token expired, attempting refresh');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('Token refreshed successfully');

        // Update the tokens in database using the composite key
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId
            }
          },
          data: {
            access_token: credentials.access_token,
            expires_at: credentials.expiry_date
              ? Math.floor(credentials.expiry_date / 1000)
              : undefined,
            refresh_token: credentials.refresh_token ?? account.refresh_token
          }
        });

        // Update the client credentials with the new access token
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error('Error refreshing access token:', refreshError);
        return NextResponse.json(
          {
            error: 'Failed to refresh access token. Please sign in again.',
            authError: 'REFRESH_FAILED'
          },
          { status: 401 }
        );
      }
    }

    console.log('Initializing Gmail API service');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log('Fetching messages from Gmail');
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject:(order OR shipment OR delivery OR purchase order OR PO OR confirmation) newer_than:30d',
        maxResults: 30
      });

      const messages = response.data.messages ?? [];

      const emails = await Promise.all(
        messages.map(async (msg) => {
          const id = msg.id || '';

          const full = await gmail.users.messages.get({
            userId: 'me',
            id
          });

          const from =
            full.data.payload?.headers?.find((h) => h.name === 'From')?.value ??
            '';
          const date =
            full.data.payload?.headers?.find((h) => h.name === 'Date')?.value ??
            '';
          const snippet = full.data.snippet ?? '';
          const subject =
            full.data.payload?.headers?.find((h) => h.name === 'Subject')
              ?.value ?? '';

          // Check for PDF attachments in the message
          const attachments: Attachment[] = [];

          // Helper function to recursively find parts with attachments
          const findAttachments = (part: any) => {
            // Check if current part has attachment data
            if (
              part.mimeType === 'application/pdf' &&
              part.body?.attachmentId
            ) {
              attachments.push({
                filename: part.filename,
                mimeType: part.mimeType,
                attachmentId: part.body.attachmentId,
                size: part.body.size || 0
              });
            }

            // Recursively check nested parts
            if (part.parts && part.parts.length > 0) {
              part.parts.forEach(findAttachments);
            }
          };

          // Check message payload for attachments
          if (full.data.payload) {
            findAttachments(full.data.payload);
          }

          // Download PDF attachments if any are found
          if (attachments.length > 0) {
            console.log(
              `Found ${attachments.length} PDF attachments in message ${id}`
            );

            // Download each attachment
            for (const attachment of attachments) {
              try {
                const attachmentData =
                  await gmail.users.messages.attachments.get({
                    userId: 'me',
                    messageId: id,
                    id: attachment.attachmentId
                  });

                // Store the base64 encoded data
                if (attachmentData.data && attachmentData.data.data) {
                  attachment.data = attachmentData.data.data;
                }
              } catch (attachmentError) {
                console.error(
                  `Error fetching attachment ${attachment.filename}:`,
                  attachmentError
                );
              }
            }
          }

          return {
            id,
            subject,
            snippet,
            from,
            date,
            attachments: attachments.length > 0 ? attachments : undefined
          };
        })
      );

      // Order the emails by date oldest to newest
      emails.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      console.log(
        'Emails sorted by date:',
        emails.map((e) => e.date)
      );

      console.log(`Processed ${emails.length} emails`);

      // Process emails and update database using ChatGPT
      let processedOrders = 0;
      for (const email of emails) {
        try {
          let parsedData: ParsedOrderData | null = null;

          // Determine if we have a PDF attachment
          const hasPdfAttachment =
            email.attachments &&
            email.attachments.length > 0 &&
            email.attachments[0].data;

          // Process with the unified approach - with or without PDF
          try {
            console.log(
              `Parsing email ${email.id}${hasPdfAttachment ? ' with PDF attachment' : ''}`
            );

            if (hasPdfAttachment) {
              // Convert the base64 string to a buffer for processing
              const pdfBuffer = Buffer.from(
                email.attachments![0].data!,
                'base64'
              );

              // Parse with email content and PDF attachment
              parsedData = await parseOrderWithAI(
                email.from,
                email.date,
                email.subject,
                email.snippet,
                pdfBuffer
              );
            } else {
              // Parse with just email content
              parsedData = await parseOrderWithAI(
                email.from,
                email.date,
                email.subject,
                email.snippet
              );
            }

            console.log('PARSED DATA FROM AI', parsedData);

            if (parsedData && parsedData.orderNumber) {
              console.log(
                `Successfully parsed order ${parsedData.orderNumber} from email ${email.id}`
              );
            } else {
              console.log(
                `AI parsing returned no order number for email ${email.id}, trying fallback`
              );
              throw new Error('No valid order data from AI parsing');
            }
          } catch (error) {
            // If AI parsing fails, fall back to basic parsing
            console.log(`Using basic parser for email ${email.id}`);
            const basicParsed = parseOrderFromEmail(
              email.subject,
              email.snippet
            );

            if (!basicParsed.orderNumber) {
              console.log(
                `No order number found in email ${email.id}, skipping`
              );
              continue;
            }

            // Use our helper function to create a properly formatted object
            parsedData = createDefaultParsedData(email.subject, email.snippet);
          }

          // Skip if we somehow still don't have valid data
          if (!parsedData || !parsedData.orderNumber) {
            console.log(`No valid order data for email ${email.id}`);
            continue;
          }

          // At this point, parsedData is guaranteed to be non-null with an orderNumber
          const orderData = {
            orderNumber: parsedData.orderNumber,
            status: parsedData.status,
            deliveredAt: parsedData.deliveredAt
              ? new Date(parsedData.deliveredAt)
              : null,
            estimatedArrival:
              parsedData.estimatedArrival &&
              typeof parsedData.estimatedArrival === 'string'
                ? new Date(parsedData.estimatedArrival)
                : null,
            supplier: parsedData.supplier || 'Unknown Supplier',
            emailThreadIds: [email.id],
            metadata: {
              productList: parsedData.productList || [],
              totalPrice: parsedData.totalPrice,
              currency: parsedData.currency,
              trackingNumber: parsedData.trackingNumber,
              trackingUrl: parsedData.trackingUrl,
              additionalNotes: parsedData.additionalNotes
            },
            updatedAt: new Date()
          };

          // First check if this order already exists to handle emailThreadIds properly
          const existingOrder = await prisma.order.findUnique({
            where: { orderNumber: orderData.orderNumber },
            select: { emailThreadIds: true }
          });

          // Save to database
          const order = await prisma.order.upsert({
            where: { orderNumber: orderData.orderNumber },
            update: {
              status: orderData.status,
              deliveredAt: orderData.deliveredAt,
              estimatedArrival: orderData.estimatedArrival,
              supplier: orderData.supplier,
              // If the order exists, add this email ID to the existing array if it's not already there
              // If order doesn't exist, this won't be used (create will be used instead)
              emailThreadIds: existingOrder
                ? existingOrder.emailThreadIds.includes(email.id)
                  ? undefined // Don't modify if already contains this email ID
                  : { push: email.id } // Add this email ID if not already in the array
                : undefined,
              metadata: orderData.metadata,
              updatedAt: new Date()
            },
            create: orderData
          });

          processedOrders++;
        } catch (emailError) {
          console.log('EMAIL ERROR', emailError);
          // Continue with next email
        }
      }

      return NextResponse.json({ emails });
    } catch (apiError) {
      console.error('Gmail API error:', apiError);

      // Check for specific Google API errors
      const error = apiError as ApiError;
      if (error.message?.includes('invalid_grant')) {
        // This typically means the refresh token is invalid or has been revoked
        return NextResponse.json(
          {
            error:
              'Your Google account access has been revoked or expired. Please sign in again to reconnect.',
            authError: 'INVALID_GRANT'
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch emails from Gmail' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
