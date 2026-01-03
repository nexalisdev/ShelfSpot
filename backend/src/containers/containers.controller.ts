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
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { ContainersService } from "./containers.service";
import { CreateContainerDto, UpdateContainerDto, BulkCreateContainerDto } from "./dto/container.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Containers")
@Controller("containers")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new container" })
  @ApiBody({ type: CreateContainerDto })
  @ApiResponse({ status: 201, description: "Container created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 404, description: "Place or Room not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createContainerDto: CreateContainerDto) {
    return this.containersService.create(createContainerDto);
  }

  @Post("bulk")
  @ApiOperation({ summary: "Create multiple containers at once" })
  @ApiBody({ type: BulkCreateContainerDto })
  @ApiResponse({ status: 201, description: "Containers created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  createBulk(@Body() bulkCreateContainerDto: BulkCreateContainerDto) {
    return this.containersService.createMany(bulkCreateContainerDto.containers);
  }

  @Get()
  @ApiOperation({ summary: "Get all containers" })
  @ApiResponse({
    status: 200,
    description: "Containers retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.containersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get container by ID" })
  @ApiParam({ name: "id", description: "Container ID" })
  @ApiResponse({ status: 200, description: "Container retrieved successfully" })
  @ApiResponse({ status: 404, description: "Container not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.containersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update container" })
  @ApiParam({ name: "id", description: "Container ID" })
  @ApiBody({ type: UpdateContainerDto })
  @ApiResponse({ status: 200, description: "Container updated successfully" })
  @ApiResponse({
    status: 404,
    description: "Container, Place or Room not found",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateContainerDto: UpdateContainerDto
  ) {
    return this.containersService.update(id, updateContainerDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete container" })
  @ApiParam({ name: "id", description: "Container ID" })
  @ApiResponse({ status: 200, description: "Container deleted successfully" })
  @ApiResponse({ status: 404, description: "Container not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.containersService.remove(id);
  }
}
