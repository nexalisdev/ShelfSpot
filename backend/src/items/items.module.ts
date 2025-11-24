import { Module } from "@nestjs/common";
import { ItemsService } from "./items.service";
import { ItemsController } from "./items.controller";
import { PrismaModule } from "../prisma.module";
import { AlertsModule } from "../alerts/alerts.module";
import { ScoringModule } from "../scoring/scoring.module";

@Module({
  imports: [PrismaModule, AlertsModule, ScoringModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
