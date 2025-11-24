import { Module } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { RoomsController } from "./rooms.controller";
import { PrismaModule } from "../prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [RoomsService],
  controllers: [RoomsController],
})
export class RoomsModule {}
