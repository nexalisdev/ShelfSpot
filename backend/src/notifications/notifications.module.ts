import { Module, forwardRef } from "@nestjs/common";
import { PushNotificationService } from "./push-notification.service";
import { NotificationsController } from "./notifications.controller";
import { AlertsModule } from "../alerts/alerts.module";

@Module({
  imports: [forwardRef(() => AlertsModule)],
  controllers: [NotificationsController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class NotificationsModule {}
