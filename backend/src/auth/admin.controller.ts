/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CreateUserDto, UpdateUserDto } from "./dto/admin.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { CurrentUser } from "./decorators/user.decorator";
import { UserPayload } from "./interfaces/auth.interface";

@ApiTags("Admin - User Management")
@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Get("users")
  @ApiOperation({ summary: "Get all users (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "List of all users retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async getAllUsers(@CurrentUser() currentUser: UserPayload) {
    return this.authService.getAllUsers();
  }

  @Post("users")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new user (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
  })
  @ApiResponse({
    status: 409,
    description: "Email already exists",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: UserPayload
  ) {
    return this.authService.createUserByAdmin(createUserDto);
  }

  @Put("users/:id")
  @ApiOperation({ summary: "Update a user (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  @ApiResponse({
    status: 409,
    description: "Email already exists",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async updateUser(
    @Param("id", ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: UserPayload
  ) {
    return this.authService.updateUserByAdmin(userId, updateUserDto);
  }

  @Delete("users/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a user (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 204,
    description: "User deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async deleteUser(
    @Param("id", ParseIntPipe) userId: number,
    @CurrentUser() currentUser: UserPayload
  ) {
    await this.authService.deleteUserByAdmin(userId);
    return { message: "User deleted successfully" };
  }
}
