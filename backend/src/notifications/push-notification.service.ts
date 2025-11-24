/* eslint-disable prettier/prettier */
import { Injectable, Logger } from "@nestjs/common";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  /**
   * Send push notifications to multiple users
   */
  async sendPushNotifications(
    pushTokens: string[],
    notification: PushNotificationData
  ): Promise<void> {
    // Filter valid Expo push tokens
    const validTokens = pushTokens.filter((token) => {
      if (!Expo.isExpoPushToken(token)) {
        this.logger.warn(`Invalid Expo push token: ${String(token)}`);
        return false;
      }
      return true;
    });

    if (validTokens.length === 0) {
      this.logger.warn("No valid push tokens found");
      return;
    }

    // Create messages array
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    }));

    // Split messages into chunks (Expo recommends chunks of 100)
    const chunks = this.expo.chunkPushNotifications(messages);

    try {
      // Send notifications
      for (const chunk of chunks) {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        this.handlePushTickets(tickets);
      }

      this.logger.log(
        `Successfully sent push notifications to ${validTokens.length} users`
      );
    } catch (error) {
      this.logger.error("Failed to send push notifications:", error);
      throw error;
    }
  }

  /**
   * Send push notification to a single user
   */
  async sendPushNotification(
    pushToken: string,
    notification: PushNotificationData
  ): Promise<void> {
    await this.sendPushNotifications([pushToken], notification);
  }

  /**
   * Handle push notification tickets and log any errors
   */
  private handlePushTickets(tickets: ExpoPushTicket[]): void {
    tickets.forEach((ticket, index) => {
      if (ticket.status === "error") {
        this.logger.error(
          `Push notification error for ticket ${index}:`,
          ticket.message
        );
        if (ticket.details?.error) {
          this.logger.error("Error details:", ticket.details.error);
        }
      }
    });
  }
}
