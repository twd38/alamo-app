import { SlackClient } from './slack-client';
import { prisma } from './db';

interface NotifyOptions {
  /**
   * A list of user IDs from the local database that should receive the notification.
   */
  recipientIds: readonly string[];
  /**
   * The plain-text message to display inside Slack.
   */
  message: string;
  /**
   * Optional Slack "blocks" to render rich messages.
   * Keeping this generic (`unknown[]`) so callers can pass whatever structure
   * the Slack API expects without the need to duplicate their type definitions here.
   */
  blocks?: unknown[];
}

/**
 * A very small abstraction over our various out-bound notification channels.
 *
 * Right now we only support Slack, but the shape of this function allows us to
 * pipe the same `NotifyOptions` into additional providers (e.g. email, push)
 * without changing the call-site.
 */
export async function notify(options: NotifyOptions): Promise<void> {
  const { recipientIds, message, blocks } = options;

  // Early exit if there is nothing to do.
  if (recipientIds.length === 0) return;

  // Fetch user emails – we only need email addresses for Slack right now.
  const users = await prisma.user.findMany({
    where: { id: { in: [...recipientIds] } },
    select: { id: true, email: true }
  });

  // Guard against missing env var so local development still works even when
  // Slack is not configured.
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn(
      '[NotificationService] SLACK_BOT_TOKEN not set – skipping Slack notifications.'
    );
    return;
  }

  const slackClient = new SlackClient(token);

  await Promise.all(
    users
      .filter((u): u is { id: string; email: string } => Boolean(u.email))
      .map((user) =>
        slackClient.sendDirectMessageByEmail({
          recipientEmail: user.email!,
          text: message,
          blocks
        })
      )
  );
}
