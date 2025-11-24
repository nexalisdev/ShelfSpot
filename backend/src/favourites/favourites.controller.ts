/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
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
import { FavouritesService } from "./favourites.service";
import { CreateFavouriteDto } from "./dto/favourite.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/user.decorator";
import { UserPayload } from "../auth/interfaces/auth.interface";

@ApiTags("Favourites")
@Controller("favourites")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new favourite" })
  @ApiBody({ type: CreateFavouriteDto })
  @ApiResponse({ status: 201, description: "Favourite created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(
    @Body() createFavouriteDto: CreateFavouriteDto,
    @CurrentUser() user: UserPayload
  ) {
    return this.favouritesService.createWithUserId(
      createFavouriteDto.itemId,
      user.id
    );
  }

  @Post("item/:itemId")
  @ApiOperation({ summary: "Add item to favourites" })
  @ApiParam({ name: "itemId", description: "Item ID to add to favourites" })
  @ApiResponse({
    status: 201,
    description: "Item added to favourites successfully",
  })
  @ApiResponse({ status: 400, description: "Item already in favourites" })
  @ApiResponse({ status: 404, description: "Item not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  createByItem(
    @Param("itemId", ParseIntPipe) itemId: number,
    @CurrentUser() user: UserPayload
  ) {
    return this.favouritesService.createWithUserId(itemId, user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get user favourites" })
  @ApiQuery({
    name: "userId",
    description: "User ID (admin only)",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Favourites retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required for userId parameter",
  })
  findAll(@CurrentUser() user: UserPayload, @Query("userId") userId?: string) {
    if (userId && user.admin) {
      // If admin and userId specified, return that user's favourites
      return this.favouritesService.findByUser(userId);
    } else {
      // Return the connected user's favourites
      return this.favouritesService.findByUser(user.id);
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove favourite by ID" })
  @ApiParam({ name: "id", description: "Favourite ID" })
  @ApiResponse({ status: 200, description: "Favourite removed successfully" })
  @ApiResponse({ status: 404, description: "Favourite not found" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot delete other users favourites",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload
  ) {
    if (user.admin) {
      // Admin can delete any favourite
      return this.favouritesService.remove(id);
    } else {
      // Regular user can only delete their own favourites
      return this.favouritesService.removeWithUserId(id, user.id);
    }
  }

  @Delete("item/:itemId")
  @ApiOperation({ summary: "Remove item from favourites" })
  @ApiParam({
    name: "itemId",
    description: "Item ID to remove from favourites",
  })
  @ApiResponse({
    status: 200,
    description: "Item removed from favourites successfully",
  })
  @ApiResponse({ status: 404, description: "Favourite not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  removeByItem(
    @Param("itemId", ParseIntPipe) itemId: number,
    @CurrentUser() user: UserPayload
  ) {
    return this.favouritesService.removeByItemAndUserId(itemId, user.id);
  }
}
