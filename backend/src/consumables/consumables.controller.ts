/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
  ApiQuery,
} from "@nestjs/swagger";
import { ConsumablesService } from "./consumables.service";
import { CreateConsumableDto, UpdateConsumableDto } from "./dto/consumable.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Consumables")
@Controller("consumables")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new consumable" })
  @ApiBody({ type: CreateConsumableDto })
  @ApiResponse({ status: 201, description: "Consumable created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createConsumableDto: CreateConsumableDto) {
    return this.consumablesService.create(createConsumableDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all consumables" })
  @ApiResponse({
    status: 200,
    description: "Consumables retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.consumablesService.findAll();
  }

  @Get("low-stock")
  @ApiOperation({ summary: "Get low stock consumables" })
  @ApiQuery({
    name: "threshold",
    description: "Stock threshold (default: 5)",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Low stock consumables retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findLowStock(@Query("threshold") threshold?: string) {
    const thresholdValue = threshold ? parseInt(threshold, 10) : 5;
    return this.consumablesService.findLowStock(thresholdValue);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get consumable by ID" })
  @ApiParam({ name: "id", description: "Consumable ID" })
  @ApiResponse({
    status: 200,
    description: "Consumable retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Consumable not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.consumablesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update consumable" })
  @ApiParam({ name: "id", description: "Consumable ID" })
  @ApiBody({ type: UpdateConsumableDto })
  @ApiResponse({ status: 200, description: "Consumable updated successfully" })
  @ApiResponse({ status: 404, description: "Consumable not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateConsumableDto: UpdateConsumableDto
  ) {
    return this.consumablesService.update(id, updateConsumableDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete consumable" })
  @ApiParam({ name: "id", description: "Consumable ID" })
  @ApiResponse({ status: 200, description: "Consumable deleted successfully" })
  @ApiResponse({ status: 404, description: "Consumable not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.consumablesService.remove(id);
  }
}
