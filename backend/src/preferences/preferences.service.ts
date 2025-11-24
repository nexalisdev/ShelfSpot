/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { UserPreferences } from "@prisma/client";

export interface UpdatePreferencesDto {
  showWelcomeHeader?: boolean;
  showStatsCards?: boolean;
  showRecentItems?: boolean;
  showRoomDistribution?: boolean;
  showAlertsPerMonth?: boolean;
  showInventoryValue?: boolean;
  showStatusDistribution?: boolean;
}

@Injectable()
export class PreferencesService {
  constructor(private prisma: PrismaService) {}

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const numericUserId = parseInt(userId, 10);
    // Try to get existing preferences
    let preferences = await this.prisma.userPreferences.findUnique({
      where: { userId: numericUserId },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await this.prisma.userPreferences.create({
        data: {
          userId: numericUserId,
          showWelcomeHeader: true,
          showStatsCards: true,
          showRecentItems: true,
          showRoomDistribution: true,
          showAlertsPerMonth: true,
          showInventoryValue: true,
          showStatusDistribution: true,
        },
      });
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    updates: UpdatePreferencesDto
  ): Promise<UserPreferences> {
    const numericUserId = parseInt(userId, 10);

    // First ensure preferences exist
    await this.getUserPreferences(userId);

    // Update preferences
    return this.prisma.userPreferences.update({
      where: { userId: numericUserId },
      data: updates,
    });
  }
}
