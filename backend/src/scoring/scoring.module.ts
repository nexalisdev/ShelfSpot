import { Module } from "@nestjs/common";
import { ScoringService } from "./scoring.service";
import { PrismaModule } from "../prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
