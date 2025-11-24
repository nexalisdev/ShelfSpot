/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { ScoringService } from "../scoring/scoring.service";
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddItemToProjectDto,
  UpdateProjectItemDto,
} from "./dto/project.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Projects")
@Controller("projects")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly scoringService: ScoringService
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new project" })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, description: "Project created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 409,
    description: "A project with this name already exists",
  })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: "List all projects" })
  @ApiResponse({
    status: 200,
    description: "Projects list retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get("scoring/statistics")
  @ApiOperation({
    summary: "Get overall importance scoring statistics",
    description:
      "Returns statistics on the distribution of importance scores for all items",
  })
  @ApiResponse({
    status: 200,
    description: "Importance scoring statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        totalItems: { type: "number" },
        itemsWithScore: { type: "number" },
        averageScore: { type: "number" },
        maxScore: { type: "number" },
        distribution: {
          type: "object",
          properties: {
            critical: { type: "number" },
            high: { type: "number" },
            medium: { type: "number" },
            low: { type: "number" },
            zero: { type: "number" },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getScoringStatistics() {
    return this.scoringService.getScorignStatistics();
  }

  @Get("scoring/top-items")
  @ApiOperation({
    summary: "Get items with the highest importance scores",
    description:
      "Returns the list of items sorted by descending importance score",
  })
  @ApiResponse({
    status: 200,
    description: "Top items by importance retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getTopImportanceItems() {
    return this.scoringService.getTopImportanceItems(20);
  }

  @Get("scoring/critical-items")
  @ApiOperation({
    summary: "Get critical items (high score + low stock)",
    description:
      "Returns items that have a high importance score but low stock, sorted by criticality",
  })
  @ApiResponse({
    status: 200,
    description: "Critical items retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getCriticalItems() {
    return this.scoringService.getCriticalItems(5);
  }

  @Post("scoring/recalculate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Recalculate all importance scores",
    description:
      "Triggers recalculation of importance scores for all inventory items",
  })
  @ApiResponse({
    status: 200,
    description: "Score recalculation completed successfully",
    schema: {
      type: "object",
      properties: {
        updated: { type: "number" },
        errors: { type: "number" },
        topItems: { type: "array" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  recalculateAllScores() {
    return this.scoringService.calculateAllItemsScores();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get project details" })
  @ApiParam({ name: "id", description: "Project ID" })
  @ApiResponse({
    status: 200,
    description: "Project details retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Project not found" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Get(":id/statistics")
  @ApiOperation({
    summary: "Get project statistics",
    description: "Returns detailed statistics about a specific project",
  })
  @ApiParam({ name: "id", description: "Project ID" })
  @ApiResponse({
    status: 200,
    description: "Project statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Project not found" })
  getProjectStatistics(@Param("id", ParseIntPipe) id: number) {
    return this.projectsService.getProjectStatistics(id);
  }

  @Get(":id/scoring/breakdown")
  @ApiOperation({
    summary: "Get importance score breakdown for a project's items",
    description:
      "Returns the detailed calculation of importance scores for all items used in a project",
  })
  @ApiParam({ name: "id", description: "ID du projet" })
  @ApiResponse({
    status: 200,
    description: "Score breakdown retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Project not found" })
  async getProjectScoringBreakdown(
    @Param("id", ParseIntPipe) projectId: number
  ) {
    const project = await this.projectsService.findOne(projectId);
    const scores: any[] = [];

    for (const projectItem of project.projectItems) {
      const scoreBreakdown = await this.scoringService.calculateItemScore(
        projectItem.item.id
      );
      if (scoreBreakdown) {
        scores.push({
          ...scoreBreakdown,
          quantityUsedInProject: projectItem.quantity,
          isActiveInProject: projectItem.isActive,
        });
      }
    }

    return {
      projectId,
      projectName: project.name,
      projectStatus: project.status,
      projectPriority: project.priority,
      itemsScores: (scores as Array<{ totalScore: number }>).sort(
        (a, b) => b.totalScore - a.totalScore
      ),
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a project" })
  @ApiParam({ name: "id", description: "Project ID" })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: "Project updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Project not found" })
  @ApiResponse({
    status: 409,
    description: "A project with this name already exists",
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a project" })
  @ApiParam({ name: "id", description: "Project ID" })
  @ApiResponse({ status: 204, description: "Project deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Project not found" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }

  // --- Project items management ---

  @Post(":id/items")
  @ApiOperation({
    summary: "Add an item to a project",
    description: "Adds an existing item to a project with a specific quantity",
  })
  @ApiParam({ name: "id", description: "Project ID" })
  @ApiBody({ type: AddItemToProjectDto })
  @ApiResponse({
    status: 201,
    description: "Item added to project successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Project or item not found" })
  @ApiResponse({
    status: 409,
    description: "Item already present in the project",
  })
  addItemToProject(
    @Param("id", ParseIntPipe) projectId: number,
    @Body() addItemDto: AddItemToProjectDto
  ) {
    return this.projectsService.addItemToProject(projectId, addItemDto);
  }

  @Patch(":id/items/:itemId")
  @ApiOperation({
    summary: "Modify an item in a project",
    description:
      "Modifies the quantity or active state of an item in a project",
  })
  @ApiParam({ name: "id", description: "Project ID" })
  @ApiParam({ name: "itemId", description: "Item ID" })
  @ApiBody({ type: UpdateProjectItemDto })
  @ApiResponse({
    status: 200,
    description: "Project item updated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 404,
    description: "Project or item not found in the project",
  })
  updateProjectItem(
    @Param("id", ParseIntPipe) projectId: number,
    @Param("itemId", ParseIntPipe) itemId: number,
    @Body() updateDto: UpdateProjectItemDto
  ) {
    return this.projectsService.updateProjectItem(projectId, itemId, updateDto);
  }

  @Delete(":id/items/:itemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remove an item from a project",
    description: "Removes an item completely from a project",
  })
  @ApiParam({ name: "id", description: "Project ID" })
  @ApiParam({ name: "itemId", description: "Item ID" })
  @ApiResponse({
    status: 204,
    description: "Item removed from project successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 404,
    description: "Project or item not found in the project",
  })
  removeItemFromProject(
    @Param("id", ParseIntPipe) projectId: number,
    @Param("itemId", ParseIntPipe) itemId: number
  ) {
    return this.projectsService.removeItemFromProject(projectId, itemId);
  }
}
