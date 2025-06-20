import OpenAI from 'openai';
import { ParsedOrderData } from '@/lib/types';
import { parseOrderFromEmail } from '@/lib/parse-order-from-email';
import { PdfReader } from 'pdfreader';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.warn(
      'OpenAI API key is not set. Order parsing with AI will not work.'
    );
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

/**
 * Extract text from a PDF buffer
 * @param pdfBuffer PDF buffer to extract text from
 * @returns Promise with extracted text
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    let textContent = '';
    let lastY: number | undefined;
    let text = '';

    new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
      if (err) {
        console.error('Error parsing PDF:', err);
      } else if (!item) {
        // End of file, resolve the promise with the extracted text
        resolve(textContent);
      } else if (item.text) {
        // New line if y position changes
        const itemY = (item as any).y as number;
        if (lastY !== itemY) {
          textContent += '\n';
          text = '';
          lastY = itemY;
        }

        text += item.text;
        textContent += item.text;
      }
    });
  });
}

/**
 * Parses order information from email content using OpenAI
 * @param from Email sender
 * @param emailDate Email date
 * @param subject Email subject
 * @param snippet Email snippet or content
 * @param pdfAttachment Optional PDF attachment as base64 string
 * @returns Parsed order data or null if parsing failed
 */
export async function parseOrderWithAI(
  from: string,
  emailDate: string,
  subject: string,
  snippet: string,
  pdfAttachment?: Buffer
): Promise<ParsedOrderData | null> {
  try {
    // Check if OpenAI client is available
    if (!openaiClient) {
      console.error('OpenAI client not available. Check your API key.');
      return null;
    }

    if (!subject || !snippet) {
      console.error('Missing required fields: subject and snippet');
      return null;
    }

    // Combine email subject and content for context
    const emailContent = `
      From: ${from}
      Date: ${emailDate}
      Subject: ${subject}
      
      Content:
      ${snippet}
    `;

    console.log('EMAIL CONTENT', emailContent);

    // If we have a PDF attachment, use Vision API approach
    if (pdfAttachment) {
      return await parseWithPdf(emailContent, pdfAttachment);
    }

    // Otherwise, use regular text-based approach
    // Call OpenAI to parse order information
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt()
        },
        {
          role: 'user',
          content: emailContent
        }
      ],
      response_format: { type: 'json_object' }
    });

    return processOpenAIResponse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error parsing order with OpenAI:', error);
    return null;
  }
}

/**
 * Parse order data using both email content and PDF attachment
 * @param emailContent Formatted email content
 * @param pdfBuffer PDF attachment as Buffer
 * @returns Parsed order data or null if parsing failed
 */
async function parseWithPdf(
  emailContent: string,
  pdfBuffer: Buffer
): Promise<ParsedOrderData | null> {
  try {
    console.log('Processing email with PDF attachment');

    // Extract text from PDF
    const pdfText = await extractTextFromPdf(pdfBuffer);
    console.log('Extracted PDF text:', pdfText.substring(0, 500) + '...');

    // Call OpenAI to parse order information from both email and PDF content
    const response = await openaiClient!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt()
        },
        {
          role: 'user',
          content: `${emailContent}\n\nExtracted PDF content:\n${pdfText}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000
    });

    return processOpenAIResponse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error processing with PDF:', error);
    return null;
  }
}

/**
 * Helper function to process OpenAI API response
 * @param content Response content from OpenAI
 * @returns Parsed order data or null if parsing failed
 */
function processOpenAIResponse(content: string | null): ParsedOrderData | null {
  try {
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Check if the content looks like HTML
    if (
      content.trim().startsWith('<!DOCTYPE') ||
      content.trim().startsWith('<html')
    ) {
      throw new Error('Received HTML instead of JSON from OpenAI API');
    }

    const parsedData = JSON.parse(content) as ParsedOrderData;
    console.log('PARSED DATA', parsedData);

    // Validate that required fields are present and format is correct
    if (!parsedData.orderNumber) {
      console.warn('No order number found in OpenAI response');
    }

    if (!parsedData.status) {
      console.warn(
        "No status found in OpenAI response, defaulting to 'unknown'"
      );
      parsedData.status = 'unknown';
    }

    return parsedData;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError);
    return null;
  }
}

/**
 * Helper function to get the system prompt
 * @returns System prompt for order extraction
 */
function getSystemPrompt(): string {
  return `You are an AI assistant specialized in extracting structured order information from emails and PDF documents.
Extract the following details and format your response using the EXACT JSON structure shown below:

{
  "orderNumber": "string or null if not found (REQUIRED)",
  "supplier": "string or null if not found",
  "status": "one of: ordered, processing, shipped, delivered, cancelled",
  "estimatedArrival": "YYYY-MM-DD format or null if not found",
  "deliveredAt": "YYYY-MM-DD format or null if not found",
  "productList": [
    {
      "name": "string",
      "quantity": number,
      "price": number or null
    }
  ] or null if not found,
  "totalPrice": number or null if not found,
  "currency": "string or null if not found",
  "trackingNumber": "string or null if not found",
  "trackingUrl": "string or null if not found",
  "additionalNotes": "string or null if not found"
}

- You must extract the order number if it exists. Do NOT use an internal supplier/vendor number. The order number must be preceded by "Purchase Order", "PO", "Order", "Order Number", "Order ID", or "Order #".
- If the information is about a delivered order, set deliveredAt to the delivery date or use the email date.
- Do not add any explanations or fields not in the template above.
- Return NULL for any fields not found in the provided information.
- If information is present in both email and PDF, use the most detailed and complete source.`;
}

/**
 * Process base64-encoded PDF data along with email information
 * @param from Email sender
 * @param emailDate Email date
 * @param subject Email subject
 * @param snippet Email snippet
 * @param base64Pdf Base64-encoded PDF data
 * @returns Parsed order data or null if parsing failed
 */
export async function parseOrderWithPdf(
  from: string,
  emailDate: string,
  subject: string,
  snippet: string,
  base64Pdf: string
): Promise<ParsedOrderData | null> {
  try {
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(base64Pdf, 'base64');
    return parseOrderWithAI(from, emailDate, subject, snippet, pdfBuffer);
  } catch (error) {
    console.error('Error processing base64 PDF:', error);
    return null;
  }
}

/**
 * Creates a default ParsedOrderData object with basic parsing
 * @param subject Email subject
 * @param snippet Email snippet
 * @returns Basic parsed order data
 */
export function createDefaultParsedData(
  subject: string,
  snippet: string
): ParsedOrderData {
  // Use the basic parser to extract what it can
  const basicParsed = parseOrderFromEmail(subject, snippet);

  // Return a properly formatted object with defaults
  return {
    orderNumber: basicParsed.orderNumber,
    supplier: basicParsed.supplier || 'Unknown Supplier',
    status: basicParsed.status || 'ordered',
    estimatedArrival: basicParsed.estimatedArrival,
    deliveredAt: null,
    productList: [],
    totalPrice: null,
    currency: null,
    trackingNumber: null,
    trackingUrl: null,
    additionalNotes: null
  };
}
