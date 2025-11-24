import { Module } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { PrismaModule } from "../prisma.module";
import { ScoringModule } from "../scoring/scoring.module";

@Module({
  imports: [PrismaModule, ScoringModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
