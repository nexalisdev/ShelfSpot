/* eslint-disable prettier/prettier */
import { Controller, Get, Put, Body, UseGuards, Request } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { PreferencesService } from "./preferences.service";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UserPreferences } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name?: string;
    admin: boolean;
  };
}

@ApiTags("Preferences")
@ApiBearerAuth()
@Controller("preferences")
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: "Get current user dashboard preferences" })
  @ApiResponse({
    status: 200,
    description: "User preferences retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getUserPreferences(
    @Request() req: AuthenticatedRequest
  ): Promise<UserPreferences> {
    return this.preferencesService.getUserPreferences(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: "Update current user dashboard preferences" })
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiResponse({
    status: 200,
    description: "User preferences updated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateUserPreferences(
    @Request() req: AuthenticatedRequest,
    @Body() updates: UpdatePreferencesDto
  ): Promise<UserPreferences> {
    return this.preferencesService.updateUserPreferences(req.user.id, updates);
  }
}
