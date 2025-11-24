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
import { TagsService } from "./tags.service";
import { CreateTagDto, UpdateTagDto } from "./dto/tag.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Tags")
@Controller("tags")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new tag" })
  @ApiBody({ type: CreateTagDto })
  @ApiResponse({ status: 201, description: "Tag created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all tags" })
  @ApiResponse({ status: 200, description: "Tags retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get tag by ID" })
  @ApiParam({ name: "id", description: "Tag ID" })
  @ApiResponse({ status: 200, description: "Tag retrieved successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.tagsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update tag" })
  @ApiParam({ name: "id", description: "Tag ID" })
  @ApiBody({ type: UpdateTagDto })
  @ApiResponse({ status: 200, description: "Tag updated successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto
  ) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete tag" })
  @ApiParam({ name: "id", description: "Tag ID" })
  @ApiResponse({ status: 200, description: "Tag deleted successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.tagsService.remove(id);
  }
}
