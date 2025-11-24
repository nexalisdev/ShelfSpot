import { Module } from "@nestjs/common";
import { ConsumablesService } from "./consumables.service";
import { ConsumablesController } from "./consumables.controller";
import { PrismaModule } from "../prisma.module";
import { AlertsModule } from "../alerts/alerts.module";

@Module({
  imports: [PrismaModule, AlertsModule],
  providers: [ConsumablesService],
  controllers: [ConsumablesController],
})
export class ConsumablesModule {}
