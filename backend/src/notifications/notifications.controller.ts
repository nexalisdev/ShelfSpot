/* eslint-disable prettier/prettier */
import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { PushNotificationService } from "./push-notification.service";
import { AlertsService } from "../alerts/alerts.service";

interface TestNotificationDto {
  pushToken: string;
  title: string;
  body: string;
}

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
    private readonly alertsService: AlertsService
  ) {}

  @Post("test")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Test push notification" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        pushToken: {
          type: "string",
          example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
          description: "Expo push token",
        },
        title: {
          type: "string",
          example: "Test Notification",
        },
        body: {
          type: "string",
          example: "This is a test notification",
        },
      },
      required: ["pushToken", "title", "body"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Notification sent successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request data",
  })
  async sendTestNotification(@Body() testData: TestNotificationDto) {
    try {
      await this.pushNotificationService.sendPushNotification(
        testData.pushToken,
        {
          title: testData.title,
          body: testData.body,
          data: { type: "test" },
        }
      );

      return {
        success: true,
        message: "Test notification sent successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to send test notification",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Post("test-alert-reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Test alert reset behavior" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        itemId: {
          type: "number",
          example: 1,
          description: "ID of the item to test",
        },
        quantity: {
          type: "number",
          example: 5,
          description: "New quantity to set",
        },
      },
      required: ["itemId", "quantity"],
    },
  })
  async testAlertReset(@Body() data: { itemId: number; quantity: number }) {
    try {
      const result = await this.alertsService.checkItemAlerts(
        data.itemId,
        data.quantity
      );

      return {
        success: true,
        message: "Alert check completed",
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to check alerts",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
