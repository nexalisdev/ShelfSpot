import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  IsBoolean,
} from "class-validator";
import { ProjectStatus, ProjectPriority } from "@prisma/client";

export class CreateProjectDto {
  @ApiProperty({ example: "Office Renovation", description: "Project name" })
  @IsString()
  name: string;

  @ApiProperty({
    example: "Complete renovation of the main office",
    description: "Detailed description of the project",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
    description: "Project status",
    required: false,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({
    enum: ProjectPriority,
    example: ProjectPriority.HIGH,
    description: "Project priority",
    required: false,
  })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiProperty({
    example: "2025-07-01T00:00:00Z",
    description: "Project start date",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: "2025-12-31T23:59:59Z",
    description: "Planned project end date",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateProjectDto {
  @ApiProperty({
    example: "Office Renovation - Phase 2",
    description: "Project name",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: "Complete renovation of the main office - Phase 2",
    description: "Detailed description of the project",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ProjectStatus,
    example: ProjectStatus.COMPLETED,
    description: "Project status",
    required: false,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({
    enum: ProjectPriority,
    example: ProjectPriority.MEDIUM,
    description: "Project priority",
    required: false,
  })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiProperty({
    example: "2025-07-01T00:00:00Z",
    description: "Project start date",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: "2025-12-31T23:59:59Z",
    description: "Planned project end date",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AddItemToProjectDto {
  @ApiProperty({
    example: 1,
    description: "ID of the item to add to the project",
  })
  @IsInt()
  @Min(1)
  itemId: number;

  @ApiProperty({
    example: 3,
    description: "Quantity of this item used in the project",
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: true,
    description: "Whether the usage of this item is active in the project",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProjectItemDto {
  @ApiProperty({
    example: 5,
    description: "New quantity of this item used in the project",
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    example: false,
    description: "Whether the usage of this item is active in the project",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
