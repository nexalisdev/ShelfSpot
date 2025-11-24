import { Module } from "@nestjs/common";
import { PreferencesService } from "./preferences.service";
import { PreferencesController } from "./preferences.controller";
import { PrismaModule } from "../prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [PreferencesService],
  controllers: [PreferencesController],
})
export class PreferencesModule {}
