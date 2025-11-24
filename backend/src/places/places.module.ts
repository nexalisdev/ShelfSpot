import { Module } from "@nestjs/common";
import { PlacesService } from "./places.service";
import { PlacesController } from "./places.controller";
import { PrismaModule } from "../prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [PlacesService],
  controllers: [PlacesController],
})
export class PlacesModule {}
