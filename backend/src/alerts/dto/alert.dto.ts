import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateAlertDto {
  @ApiProperty({ example: 1, description: "Item ID for the alert" })
  @IsNumber()
  itemId: number;

  @ApiProperty({
    example: 5,
    description: "Threshold quantity that triggers the alert",
    minimum: 0,
  })
  @IsNumber()
  threshold: number;

  @ApiProperty({
    example: "Low stock alert",
    description: "Alert name/description",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateAlertDto {
  @ApiProperty({
    example: 5,
    description: "Threshold quantity that triggers the alert",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @ApiProperty({
    example: "Low stock alert",
    description: "Alert name/description",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: true,
    description: "Whether the alert is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
