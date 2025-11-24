/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { EmailService } from "../email/email.service";
import { PushNotificationService } from "../notifications/push-notification.service";
import { CreateAlertDto, UpdateAlertDto } from "./dto/alert.dto";

interface PrismaError {
  code: string;
  message: string;
}

function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string"
  );
}

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private pushNotificationService: PushNotificationService
  ) {}

  async create(createAlertDto: CreateAlertDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: createAlertDto.itemId },
    });

    if (!item) {
      throw new NotFoundException(
        `Item with ID ${createAlertDto.itemId} not found`
      );
    }

    try {
      return await this.prisma.alert.create({
        data: createAlertDto,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              quantity: true,
              status: true,
            },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === "P2002") {
        throw new ConflictException(
          "An alert with this threshold already exists for this item"
        );
      }
      throw error;
    }
  }

  async findAllByItem(itemId: number) {
    return this.prisma.alert.findMany({
      where: { itemId },
      orderBy: { threshold: "asc" },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            quantity: true,
            status: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.alert.findMany({
      include: {
        item: {
          select: {
            id: true,
            name: true,
            quantity: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: number) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            quantity: true,
            status: true,
          },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  async update(id: number, updateAlertDto: UpdateAlertDto) {
    try {
      return await this.prisma.alert.update({
        where: { id },
        data: updateAlertDto,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              quantity: true,
              status: true,
            },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === "P2025") {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }
      if (isPrismaError(error) && error.code === "P2002") {
        throw new ConflictException(
          "An alert with this threshold already exists for this item"
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.alert.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === "P2025") {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getMonthlyStatistics() {
    const currentDate = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(currentDate.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const alerts = await this.prisma.alert.findMany({
      where: {
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const monthlyData = new Map<string, number>();

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData.set(key, 0);
    }

    alerts.forEach((alert) => {
      const date = new Date(alert.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData.has(key)) {
        monthlyData.set(key, (monthlyData.get(key) || 0) + 1);
      }
    });

    const result = Array.from(monthlyData.entries()).map(([key, count]) => {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        year: parseInt(year),
        count,
      };
    });

    return {
      data: result,
      total: alerts.length,
    };
  }

  async checkAlerts() {
    const alerts = await this.prisma.alert.findMany({
      where: { isActive: true },
      include: {
        item: {
          include: {
            room: true,
            place: true,
            container: true,
            itemTags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    const triggeredAlerts = alerts.filter(
      (alert) => alert.item.quantity <= alert.threshold
    );

    if (triggeredAlerts.length === 0) {
      return {
        message: "No alerts triggered",
        checkedAlerts: alerts.length,
        triggeredAlerts: 0,
        sentAlerts: 0,
      };
    }

    const now = new Date();
    const alertsToSend = triggeredAlerts.filter((alert) => {
      if (!alert.lastSent) return true;

      const lastSent = new Date(alert.lastSent);
      const hoursSinceLastSent =
        (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastSent >= 24;
    });

    if (alertsToSend.length === 0) {
      return {
        message: "Alerts triggered but emails already sent recently",
        checkedAlerts: alerts.length,
        triggeredAlerts: triggeredAlerts.length,
        sentAlerts: 0,
      };
    }

    const emailRecipient = process.env.ALERT_EMAIL_RECIPIENT;
    if (emailRecipient && alertsToSend.length > 0) {
      try {
        const emailData = alertsToSend.map((alert) => ({
          id: alert.id,
          threshold: alert.threshold,
          name: alert.name,
          item: alert.item,
        }));

        await this.emailService.sendAlertEmail(emailRecipient, emailData);
      } catch (error) {
        console.error("Error sending alert emails:", error);
      }
    }

    if (alertsToSend.length > 0) {
      try {
        const usersWithTokens = await this.prisma.user.findMany({
          where: {
            notificationToken: {
              not: null,
            },
          },
          select: {
            notificationToken: true,
          },
        });

        const pushTokens = usersWithTokens
          .map((user) => user.notificationToken)
          .filter((token): token is string => token !== null);

        if (pushTokens.length > 0) {
          const alertNames = alertsToSend.map((alert) => alert.item.name);
          const title = "Alerte Stock";
          const body =
            alertsToSend.length === 1
              ? `Stock faible: ${alertNames[0]} (${alertsToSend[0].item.quantity} restant)`
              : `${alertsToSend.length} items en stock faible: ${alertNames.slice(0, 3).join(", ")}${alertsToSend.length > 3 ? "..." : ""}`;

          await this.pushNotificationService.sendPushNotifications(pushTokens, {
            title,
            body,
            data: {
              type: "low_stock_alert",
              alertCount: alertsToSend.length,
              items: alertsToSend.map((alert) => ({
                id: alert.item.id,
                name: alert.item.name,
                quantity: alert.item.quantity,
                threshold: alert.threshold,
              })),
            },
          });

          console.log(
            `Sent push notifications to ${pushTokens.length} users for ${alertsToSend.length} alerts`
          );
        }
      } catch (error) {
        console.error("Error sending push notifications:", error);
      }
    }

    await this.prisma.alert.updateMany({
      where: {
        id: {
          in: alertsToSend.map((alert) => alert.id),
        },
      },
      data: {
        lastSent: now,
      },
    });

    return {
      message: "Alerts processed successfully",
      checkedAlerts: alerts.length,
      triggeredAlerts: triggeredAlerts.length,
      sentAlerts: alertsToSend.length,
    };
  }

  /**
   * Check alerts for a specific item after its quantity has been modified
   * @param itemId ID de l'item modifié
   * @param newQuantity Nouvelle quantité de l'item
   */
  async checkItemAlerts(itemId: number, newQuantity: number) {
    const alerts = await this.prisma.alert.findMany({
      where: {
        itemId,
        isActive: true,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            quantity: true,
            status: true,
          },
        },
      },
    });

    if (alerts.length === 0) {
      return {
        message: "No alerts configured for this item",
        triggeredAlerts: 0,
        sentAlerts: 0,
      };
    }

    const alertsToReset = alerts.filter(
      (alert) => newQuantity > alert.threshold && alert.lastSent !== null
    );

    if (alertsToReset.length > 0) {
      await this.prisma.alert.updateMany({
        where: {
          id: {
            in: alertsToReset.map((alert) => alert.id),
          },
        },
        data: {
          lastSent: null,
        },
      });

      console.log(
        `🔄 Reset ${alertsToReset.length} alerts for item ${itemId} (quantity back above threshold: ${newQuantity})`
      );
    }

    const triggeredAlerts = alerts.filter(
      (alert) => newQuantity <= alert.threshold
    );

    if (triggeredAlerts.length === 0) {
      return {
        message: "No alerts triggered for this item",
        triggeredAlerts: 0,
        sentAlerts: 0,
        resetAlerts: alertsToReset.length,
      };
    }

    const now = new Date();
    const alertsToSend = triggeredAlerts.filter((alert) => {
      if (!alert.lastSent) return true;

      const lastSent = new Date(alert.lastSent);
      const hoursSinceLastSent =
        (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastSent >= 24;
    });

    if (alertsToSend.length === 0) {
      return {
        message: "Alerts triggered but emails already sent recently",
        triggeredAlerts: triggeredAlerts.length,
        sentAlerts: 0,
      };
    }

    const emailRecipient = process.env.ALERT_EMAIL_RECIPIENT;
    if (emailRecipient && alertsToSend.length > 0) {
      try {
        const emailData = alertsToSend.map((alert) => ({
          id: alert.id,
          threshold: alert.threshold,
          name: alert.name,
          item: alert.item,
        }));

        await this.emailService.sendAlertEmail(emailRecipient, emailData, {
          subject: `🚨 Alerte stock faible - ${alertsToSend[0].item.name} (quantité: ${newQuantity})`,
        });
      } catch (error) {
        console.error("Error sending alert emails for item %s:", itemId, error);
      }
    }

    if (alertsToSend.length > 0) {
      try {
        const usersWithTokens = await this.prisma.user.findMany({
          where: {
            notificationToken: {
              not: null,
            },
          },
          select: {
            notificationToken: true,
          },
        });

        const pushTokens = usersWithTokens
          .map((user) => user.notificationToken)
          .filter((token): token is string => token !== null);

        if (pushTokens.length > 0) {
          const itemName = alertsToSend[0].item.name;
          const title = "Alerte Stock";
          const body = `Stock faible: ${itemName} (${newQuantity} restant)`;

          await this.pushNotificationService.sendPushNotifications(pushTokens, {
            title,
            body,
            data: {
              type: "low_stock_alert",
              itemId,
              itemName,
              currentQuantity: newQuantity,
              threshold: alertsToSend[0].threshold,
            },
          });

          console.log(
            `Sent push notifications to ${pushTokens.length} users for item ${itemName}`
          );
        }
      } catch (error) {
        console.error(
          "Error sending push notifications for item %s:",
          itemId,
          error
        );
      }
    }

    console.log(`🚨 ALERT TRIGGERED for item ${itemId}:`);
    console.log(`   - New quantity: ${newQuantity}`);
    console.log(`   - Alerts triggered: ${alertsToSend.length}`);
    alertsToSend.forEach((alert) => {
      console.log(
        `   - Alert ID ${alert.id}: threshold ${alert.threshold}, name: "${alert.name || "Unnamed alert"}"`
      );
    });

    await this.prisma.alert.updateMany({
      where: {
        id: {
          in: alertsToSend.map((alert) => alert.id),
        },
      },
      data: {
        lastSent: now,
      },
    });

    return {
      message: "Item alerts processed successfully",
      triggeredAlerts: triggeredAlerts.length,
      sentAlerts: alertsToSend.length,
      alerts: alertsToSend.map((alert) => ({
        id: alert.id,
        threshold: alert.threshold,
        name: alert.name,
      })),
    };
  }

  async sendTestEmail(email?: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    message?: string;
  }> {
    const recipient = email || process.env.ALERT_EMAIL_RECIPIENT;

    if (!recipient) {
      return {
        success: false,
        error:
          "No email recipient configured. Set ALERT_EMAIL_RECIPIENT in environment variables or provide email parameter.",
      };
    }

    try {
      const result = await this.emailService.sendTestEmail(recipient);

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          message: `Test email sent successfully to ${recipient}`,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
