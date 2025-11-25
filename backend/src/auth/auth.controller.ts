/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Put,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateEmailDto } from "./dto/update-email.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/user.decorator";
import { UserPayload } from "./interfaces/auth.interface";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: 201,
    description: "User successfully registered",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "Email already exists",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data",
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials",
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async getProfile(@CurrentUser() user: UserPayload) {
    console.log("AuthController: getProfile called with user:", user);
    return this.authService.getUserProfile(user.id);
  }

  @Put("profile/name")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user name" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          example: "John Doe",
          minLength: 5,
        },
      },
      required: ["name"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "User name updated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid name",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async updateName(
    @CurrentUser() user: UserPayload,
    @Body("name") name: string
  ) {
    return this.authService.updateUserName(user.id, name);
  }

  @Put("profile/email")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user email" })
  @ApiBody({ type: UpdateEmailDto })
  @ApiResponse({
    status: 200,
    description: "User email updated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid email format",
  })
  @ApiResponse({
    status: 409,
    description: "Email already exists",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async updateEmail(
    @CurrentUser() user: UserPayload,
    @Body() updateEmailDto: UpdateEmailDto
  ) {
    return this.authService.updateUserEmail(user.id, updateEmailDto.email);
  }

  @Post("password/reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset user password" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          format: "email",
          example: "user@example.com",
        },
        newPassword: {
          type: "string",
          example: "newPassword123",
          minLength: 8,
        },
      },
      required: ["email", "newPassword"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Password reset successfully",
  })
  @ApiResponse({
    status: 401,
    description: "User not found",
  })
  async resetPassword(
    @Body("email") email: string,
    @Body("newPassword") newPassword: string
  ) {
    await this.authService.resetPassword(email, newPassword);
    return { message: "Password reset successfully" };
  }

  @Post("password/forgot")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset with temporary password" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          format: "email",
          example: "user@example.com",
        },
      },
      required: ["email"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Temporary password sent to email if account exists",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid email format",
  })
  async forgotPassword(@Body("email") email: string) {
    await this.authService.forgotPassword(email);
    return {
      message:
        "If an account with this email exists, a temporary password has been sent to your email address.",
    };
  }

  @Put("profile/notification-token")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user notification token" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        notificationToken: {
          type: "string",
          example: "fcm_token_example_123456789abcdef",
          description: "Firebase Cloud Messaging token for push notifications",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Notification token updated successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async updateNotificationToken(
    @CurrentUser() user: UserPayload,
    @Body("notificationToken") notificationToken: string
  ) {
    return this.authService.updateNotificationToken(user.id, notificationToken);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @ApiResponse({
    status: 200,
    description: "New access token generated successfully",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired refresh token",
  })
  async refresh(@Body("refresh_token") refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }
}
