/**
 * SlackClient is a thin wrapper around Slack Web API endpoints that we need right now.
 * We purposefully avoid pulling an additional dependency (`@slack/web-api`) because
 * the handful of REST calls we need – user lookup, conversation open, post message –
 * can be achieved with simple `fetch` requests.
 *
 * The class focuses on *just enough* functionality for the current use-case while
 * keeping the interface flexible so that we can swap in the official SDK at any time
 * without affecting the rest of the codebase.
 */
export class SlackClient {
  private readonly token: string;
  private readonly apiBaseUrl: string = 'https://slack.com/api';

  constructor(token: string | undefined) {
    if (!token) {
      throw new Error('SlackClient: SLACK_BOT_TOKEN environment variable is missing.');
    }

    this.token = token;
  }

  // ---------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------
  /**
   * Send a direct message to a Slack user identified by their email address.
   * If the user cannot be found we log and silently return.
   */
  async sendDirectMessageByEmail(params: {
    recipientEmail: string;
    text: string;
    blocks?: unknown[];
  }): Promise<void> {
    const { recipientEmail, text, blocks } = params;

    const userId = await this.lookupUserId(recipientEmail);
    if (!userId) {
      console.warn(`[SlackClient] No Slack user found for email: ${recipientEmail}`);
      return;
    }

    const channelId = await this.openDirectChannel(userId);
    if (!channelId) {
      console.warn(`[SlackClient] Failed to open conversation with user: ${userId}`);
      return;
    }

    await this.postMessage({ channelId, text, blocks });
  }
  

  // ---------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------
  
  private async lookupUserId(email: string): Promise<string | null> {
    const url = `${this.apiBaseUrl}/users.lookupByEmail?email=${encodeURIComponent(email)}`;
    const response = await this.fetchSlack<{ ok: boolean; user?: { id: string } }>(url);

    if (!response.ok || !response.user) {
      return null;
    }

    return response.user.id;
  }

  private async openDirectChannel(userId: string): Promise<string | null> {
    const url = `${this.apiBaseUrl}/conversations.open`;
    const body = JSON.stringify({ users: userId });
    const response = await this.fetchSlack<{ ok: boolean; channel?: { id: string } }>(url, {
      method: 'POST',
      body,
    });

    if (!response.ok || !response.channel) {
      return null;
    }

    return response.channel.id;
  }

  private async postMessage(params: {
    channelId: string;
    text: string;
    blocks?: unknown[];
  }): Promise<void> {
    const { channelId, text, blocks } = params;
    const url = `${this.apiBaseUrl}/chat.postMessage`;
    const body = JSON.stringify({ 
        channel: channelId, 
        text, 
        blocks,
        unfurl_links: false,
        unfurl_media: false,
    });

    await this.fetchSlack(url, { method: 'POST', body });
  }

  // Generic fetch wrapper that automatically attaches auth headers and handles errors.
  private async fetchSlack<T = unknown>(
    url: string,
    init: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${this.token}`,
        ...(init.headers ?? {}),
      },
    });

    const data = (await response.json()) as T;

    if (!response.ok) {
      const message =
        typeof data === 'object' && data && 'error' in data
          ? (data as Record<string, unknown>).error
          : response.statusText;
      throw new Error(`SlackClient: Request to ${url} failed – ${message}`);
    }

    return data;
  }
} 