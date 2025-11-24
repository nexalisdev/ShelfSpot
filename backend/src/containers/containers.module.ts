import { Module } from "@nestjs/common";
import { ContainersService } from "./containers.service";
import { ContainersController } from "./containers.controller";
import { PrismaModule } from "../prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ContainersController],
  providers: [ContainersService],
  exports: [ContainersService],
})
export class ContainersModule {}
