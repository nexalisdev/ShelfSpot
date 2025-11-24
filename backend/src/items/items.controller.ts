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
import { ItemsService } from "./items.service";
import {
  CreateItemDto,
  UpdateItemDto,
  BulkCreateItemDto,
} from "./dto/item.dto";
import { ItemResponseDto } from "./dto/item-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Items")
@Controller("items")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new item" })
  @ApiBody({ type: CreateItemDto })
  @ApiResponse({
    status: 201,
    description: "Item created successfully",
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(createItemDto);
  }

  @Post("bulk")
  @ApiOperation({ summary: "Create multiple items at once" })
  @ApiBody({ type: BulkCreateItemDto })
  @ApiResponse({
    status: 201,
    description: "Items created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  createBulk(@Body() bulkCreateItemDto: BulkCreateItemDto) {
    return this.itemsService.createMany(bulkCreateItemDto.items);
  }

  @Get()
  @ApiOperation({ summary: "Get all items" })
  @ApiResponse({
    status: 200,
    description: "Items retrieved successfully",
    type: [ItemResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.itemsService.findAll();
  }

  @Get("inventory-value")
  @ApiOperation({
    summary: "Get total inventory value based on selling prices",
  })
  @ApiResponse({
    status: 200,
    description: "Inventory value calculated successfully",
    schema: {
      type: "object",
      properties: {
        totalValue: {
          type: "number",
          description: "Total inventory value",
        },
        itemsWithValue: {
          type: "number",
          description: "Number of items with sellprice",
        },
        totalItems: {
          type: "number",
          description: "Total number of items",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getInventoryValue() {
    return this.itemsService.getInventoryValue();
  }

  @Get("statistics/status")
  @ApiOperation({ summary: "Get items status distribution statistics" })
  @ApiResponse({
    status: 200,
    description: "Status distribution statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              status: { type: "string", example: "Good" },
              count: { type: "number", example: 15 },
            },
          },
        },
        total: { type: "number", example: 50 },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getStatusStatistics() {
    return this.itemsService.getStatusStatistics();
  }

  @Get("search")
  @ApiOperation({ summary: "Search items" })
  @ApiQuery({ name: "q", description: "Search term", required: false })
  @ApiResponse({
    status: 200,
    description: "Search results retrieved successfully",
    type: [ItemResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  search(@Query("q") searchTerm: string) {
    return this.itemsService.search(searchTerm || "");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get item by ID" })
  @ApiParam({ name: "id", description: "Item ID" })
  @ApiResponse({
    status: 200,
    description: "Item retrieved successfully",
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: "Item not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update item" })
  @ApiParam({ name: "id", description: "Item ID" })
  @ApiBody({ type: UpdateItemDto })
  @ApiResponse({ status: 200, description: "Item updated successfully" })
  @ApiResponse({ status: 404, description: "Item not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(
    @Param("id", ParseIntPipe) id: number,
    // eslint-disable-next-line prettier/prettier
    @Body() updateItemDto: UpdateItemDto
  ) {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete item" })
  @ApiParam({ name: "id", description: "Item ID" })
  @ApiResponse({ status: 200, description: "Item deleted successfully" })
  @ApiResponse({ status: 404, description: "Item not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.itemsService.remove(id);
  }
}
