/* eslint-disable prettier/prettier */
import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

export interface AlertEmailData {
  id: number;
  threshold: number;
  name?: string | null;
  item: {
    id: number;
    name: string;
    quantity: number;
    status: string | null;
    room?: { name: string } | null;
    place?: { name: string } | null;
    container?: { name: string } | null;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    // Initialiser Resend avec la clé API depuis les variables d'environnement
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        "RESEND_API_KEY not found in environment variables. Email service will not work."
      );
    } else {
      this.resend = new Resend(apiKey);
      this.logger.log("Email service initialized with Resend");
    }
  }

  /**
   * Envoie un email d'alerte pour des items dont la quantité est faible
   */
  async sendAlertEmail(
    to: string,
    alerts: AlertEmailData[],
    options?: {
      from?: string;
      subject?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.resend) {
      this.logger.error("Resend not initialized. Cannot send email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      // Use a proper format for the from email address
      const fromEmailConfig =
        process.env.RESEND_FROM_EMAIL || "noreply@resend.dev";
      let defaultFrom: string;

      // If fromEmailConfig is just a domain, create a proper email address
      if (fromEmailConfig && !fromEmailConfig.includes("@")) {
        defaultFrom = `ShelfSpot <noreply@${fromEmailConfig}>`;
      } else if (
        fromEmailConfig.includes("@") &&
        !fromEmailConfig.includes("<")
      ) {
        // If it's just an email address, wrap it with app name
        defaultFrom = `ShelfSpot <${fromEmailConfig}>`;
      } else {
        defaultFrom = fromEmailConfig;
      }

      const from = options?.from || defaultFrom;
      const subject =
        options?.subject ||
        `🚨 Alerte stock faible - ${alerts.length} article(s) concerné(s)`;

      // Générer le contenu HTML de l'email
      const htmlContent = this.generateAlertEmailHtml(alerts);
      const textContent = this.generateAlertEmailText(alerts);

      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        this.logger.error("Failed to send alert email:", error);
        return { success: false, error: error.message };
      }

      this.logger.log(`Alert email sent successfully. Message ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      this.logger.error("Error sending alert email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Génère le contenu HTML de l'email d'alerte
   */
  private generateAlertEmailHtml(alerts: AlertEmailData[]): string {
    const alertsHtml = alerts
      .map((alert) => {
        const location = this.getItemLocation(alert.item);
        return `
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 12px; font-weight: 500;">${alert.item.name}</td>
          <td style="padding: 12px; text-align: center; color: #dc2626; font-weight: 600;">${alert.item.quantity}</td>
          <td style="padding: 12px; text-align: center;">${alert.threshold}</td>
          <td style="padding: 12px; font-size: 12px; color: #6b7280;">${location}</td>
          <td style="padding: 12px;">
            <span style="background-color: ${this.getStatusColor(alert.item.status || "unknown")}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${alert.item.status || "Non spécifié"}
            </span>
          </td>
        </tr>
      `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alerte Stock Faible - ShelfSpot</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 24px;">🚨 Alerte Stock Faible</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">ShelfSpot - Gestion d'inventaire</p>
          </div>

          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #dc2626; font-weight: 500;">
              ⚠️ ${alerts.length} article(s) de votre inventaire ont atteint ou dépassé leur seuil d'alerte.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Article</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qté actuelle</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Seuil</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Localisation</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${alertsHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              💡 <strong>Action recommandée :</strong> Vérifiez votre stock et commandez les articles nécessaires pour éviter les ruptures.
            </p>
          </div>

          <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">
              Cet email a été envoyé automatiquement par ShelfSpot.<br>
              Pour configurer vos alertes, connectez-vous à votre tableau de bord.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Génère le contenu texte de l'email d'alerte
   */
  private generateAlertEmailText(alerts: AlertEmailData[]): string {
    const alertsText = alerts
      .map((alert) => {
        const location = this.getItemLocation(alert.item);
        return `- ${alert.item.name}: ${alert.item.quantity} (seuil: ${alert.threshold}) - ${location} - ${alert.item.status}`;
      })
      .join("\n");

    return `
🚨 ALERTE STOCK FAIBLE - ShelfSpot

${alerts.length} article(s) de votre inventaire ont atteint ou dépassé leur seuil d'alerte :

${alertsText}

Action recommandée : Vérifiez votre stock et commandez les articles nécessaires pour éviter les ruptures.

---
Cet email a été envoyé automatiquement par ShelfSpot.
Pour configurer vos alertes, connectez-vous à votre tableau de bord.
    `.trim();
  }

  /**
   * Obtient la localisation d'un item sous forme de chaîne
   */
  private getItemLocation(item: AlertEmailData["item"]): string {
    const parts: string[] = [];
    if (item.room?.name) parts.push(item.room.name);
    if (item.place?.name) parts.push(item.place.name);
    if (item.container?.name) parts.push(item.container.name);
    return parts.length > 0 ? parts.join(" > ") : "Non spécifié";
  }

  /**
   * Obtient la couleur associée à un statut
   */
  private getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "disponible":
        return "#10b981";
      case "indisponible":
        return "#dc2626";
      case "réservé":
        return "#f59e0b";
      case "en maintenance":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  }

  /**
   * Envoie un email de test pour vérifier la configuration
   */
  async sendTestEmail(
    to: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.resend) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      // Use a proper format for the from email address
      const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@resend.dev";
      const fromAddress =
        fromEmail.includes("@") && !fromEmail.includes("<")
          ? `ShelfSpot <${fromEmail}>`
          : fromEmail;

      const { data, error } = await this.resend.emails.send({
        from: fromAddress,
        to,
        subject: "✅ Test Email - ShelfSpot",
        html: `
          <h1>Test Email ShelfSpot</h1>
          <p>Si vous recevez cet email, la configuration Resend fonctionne correctement !</p>
          <p><em>Envoyé le ${new Date().toLocaleString("fr-FR")}</em></p>
        `,
        text: `Test Email ShelfSpot\n\nSi vous recevez cet email, la configuration Resend fonctionne correctement !\n\nEnvoyé le ${new Date().toLocaleString("fr-FR")}`,
      });

      if (error) {
        this.logger.error("Failed to send test email:", error);
        return { success: false, error: error.message };
      }

      this.logger.log(`Test email sent successfully. Message ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      this.logger.error("Error sending test email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send password reset email with temporary password
   */
  async sendPasswordResetEmail(
    to: string,
    tempPassword: string,
    userName: string = "User"
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.resend) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      // Use a proper format for the from email address
      const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@resend.dev";
      const fromAddress =
        fromEmail.includes("@") && !fromEmail.includes("<")
          ? `ShelfSpot <${fromEmail}>`
          : fromEmail;

      const { data, error } = await this.resend.emails.send({
        from: fromAddress,
        to,
        subject: "🔐 Temporary Password - ShelfSpot",
        html: this.generatePasswordResetEmailHtml(tempPassword, userName),
        text: this.generatePasswordResetEmailText(tempPassword, userName),
      });

      if (error) {
        this.logger.error("Failed to send password reset email:", error);
        return { success: false, error: error.message };
      }

      this.logger.log(
        `Password reset email sent successfully. Message ID: ${data?.id}`
      );
      return { success: true, messageId: data?.id };
    } catch (error) {
      this.logger.error("Error sending password reset email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate HTML content for password reset email
   */
  private generatePasswordResetEmailHtml(
    tempPassword: string,
    userName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - ShelfSpot</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">ShelfSpot - Inventory Management</p>
          </div>

          <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #1e40af; font-weight: 500;">
              Hi ${userName},
            </p>
            <p style="margin: 8px 0 0 0; color: #1e40af;">
              We've generated a temporary password for your ShelfSpot account as requested.
            </p>
          </div>

          <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">Your temporary password:</p>
            <div style="background-color: #374151; border-radius: 4px; padding: 12px; display: inline-block;">
              <span style="color: #f3f4f6; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px;">
                ${tempPassword}
              </span>
            </div>
          </div>

          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">
              ⚠️ Important Security Information:
            </p>
            <ul style="margin: 8px 0 0 0; color: #92400e; padding-left: 20px;">
              <li>This is a temporary password that replaces your previous one</li>
              <li>Use it to log in to your account</li>
              <li>Change it immediately after logging in for security</li>
              <li>This password will work until you set a new one</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Sign In to ShelfSpot
            </a>
          </div>

          <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">
              If you didn't request this password reset, please contact support immediately.<br>
              This email was sent automatically by ShelfSpot.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate text content for password reset email
   */
  private generatePasswordResetEmailText(
    tempPassword: string,
    userName: string
  ): string {
    return `
🔐 PASSWORD RESET - ShelfSpot

Hi ${userName},

We've generated a temporary password for your ShelfSpot account as requested.

Your temporary password: ${tempPassword}

IMPORTANT SECURITY INFORMATION:
- This is a temporary password that replaces your previous one
- Use it to log in to your account
- Change it immediately after logging in for security
- This password will work until you set a new one

Sign in at: ${process.env.FRONTEND_URL || "http://localhost:3000"}/login

If you didn't request this password reset, please contact support immediately.

---
This email was sent automatically by ShelfSpot.
    `.trim();
  }
}
