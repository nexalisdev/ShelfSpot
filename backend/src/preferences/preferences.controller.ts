/* eslint-disable prettier/prettier */
import { Controller, Get, Put, Body, UseGuards, Request } from "@nestjs/common";
import {
  PreferencesService,
  UpdatePreferencesDto,
} from "./preferences.service";
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

@Controller("preferences")
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private preferencesService: PreferencesService) {}

  @Get()
  async getUserPreferences(
    @Request() req: AuthenticatedRequest
  ): Promise<UserPreferences> {
    return this.preferencesService.getUserPreferences(req.user.id);
  }

  @Put()
  async updateUserPreferences(
    @Request() req: AuthenticatedRequest,
    @Body() updates: UpdatePreferencesDto
  ): Promise<UserPreferences> {
    return this.preferencesService.updateUserPreferences(req.user.id, updates);
  }
}
