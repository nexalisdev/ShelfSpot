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
import { RoomsService } from "./rooms.service";
import { CreateRoomDto, UpdateRoomDto, BulkCreateRoomDto } from "./dto/room.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Rooms")
@Controller("rooms")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new room" })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({ status: 201, description: "Room created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Post("bulk")
  @ApiOperation({ summary: "Create multiple rooms at once" })
  @ApiBody({ type: BulkCreateRoomDto })
  @ApiResponse({ status: 201, description: "Rooms created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  createBulk(@Body() bulkCreateRoomDto: BulkCreateRoomDto) {
    return this.roomsService.createMany(bulkCreateRoomDto.rooms);
  }

  @Get()
  @ApiOperation({ summary: "Get all rooms" })
  @ApiResponse({ status: 200, description: "Rooms retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get room by ID" })
  @ApiParam({ name: "id", description: "Room ID" })
  @ApiResponse({ status: 200, description: "Room retrieved successfully" })
  @ApiResponse({ status: 404, description: "Room not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update room" })
  @ApiParam({ name: "id", description: "Room ID" })
  @ApiBody({ type: UpdateRoomDto })
  @ApiResponse({ status: 200, description: "Room updated successfully" })
  @ApiResponse({ status: 404, description: "Room not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete room" })
  @ApiParam({ name: "id", description: "Room ID" })
  @ApiResponse({ status: 200, description: "Room deleted successfully" })
  @ApiResponse({ status: 404, description: "Room not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.roomsService.remove(id);
  }
}
