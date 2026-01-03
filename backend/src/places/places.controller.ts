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
import { PlacesService } from "./places.service";
import { CreatePlaceDto, UpdatePlaceDto, BulkCreatePlaceDto } from "./dto/place.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Places")
@Controller("places")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new place" })
  @ApiBody({ type: CreatePlaceDto })
  @ApiResponse({ status: 201, description: "Place created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createPlaceDto: CreatePlaceDto) {
    return this.placesService.create(createPlaceDto);
  }

  @Post("bulk")
  @ApiOperation({ summary: "Create multiple places at once" })
  @ApiBody({ type: BulkCreatePlaceDto })
  @ApiResponse({ status: 201, description: "Places created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  createBulk(@Body() bulkCreatePlaceDto: BulkCreatePlaceDto) {
    return this.placesService.createMany(bulkCreatePlaceDto.places);
  }

  @Get()
  @ApiOperation({ summary: "Get all places" })
  @ApiResponse({ status: 200, description: "Places retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.placesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get place by ID" })
  @ApiParam({ name: "id", description: "Place ID" })
  @ApiResponse({ status: 200, description: "Place retrieved successfully" })
  @ApiResponse({ status: 404, description: "Place not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.placesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update place" })
  @ApiParam({ name: "id", description: "Place ID" })
  @ApiBody({ type: UpdatePlaceDto })
  @ApiResponse({ status: 200, description: "Place updated successfully" })
  @ApiResponse({ status: 404, description: "Place not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePlaceDto: UpdatePlaceDto
  ) {
    return this.placesService.update(id, updatePlaceDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete place" })
  @ApiParam({ name: "id", description: "Place ID" })
  @ApiResponse({ status: 200, description: "Place deleted successfully" })
  @ApiResponse({ status: 404, description: "Place not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.placesService.remove(id);
  }
}
