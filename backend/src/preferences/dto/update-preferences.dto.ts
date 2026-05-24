/* eslint-disable prettier/prettier */
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ example: true, description: "Show welcome header on dashboard" })
  showWelcomeHeader?: boolean;

  @ApiPropertyOptional({ example: true, description: "Show stats cards on dashboard" })
  showStatsCards?: boolean;

  @ApiPropertyOptional({ example: true, description: "Show room distribution chart" })
  showRoomDistribution?: boolean;

  @ApiPropertyOptional({ example: true, description: "Show alerts per month chart" })
  showAlertsPerMonth?: boolean;

  @ApiPropertyOptional({ example: true, description: "Show inventory value widget" })
  showInventoryValue?: boolean;

  @ApiPropertyOptional({ example: true, description: "Show status distribution chart" })
  showStatusDistribution?: boolean;
}
