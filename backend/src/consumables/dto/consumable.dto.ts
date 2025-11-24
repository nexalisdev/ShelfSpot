import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, Min } from "class-validator";

export class CreateConsumableDto {
  @ApiProperty({ example: "Coffee Beans", description: "Consumable name" })
  @IsString()
  name: string;

  @ApiProperty({ example: 5, description: "Consumable quantity", minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    example: "Available",
    description: "Consumable status",
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 1, description: "Room ID" })
  @IsNumber()
  roomId: number;

  @ApiProperty({ example: 1, description: "Place ID" })
  @IsNumber()
  placeId: number;

  @ApiProperty({ example: 1, description: "Container ID", required: false })
  @IsOptional()
  @IsNumber()
  containerId?: number;
}

export class UpdateConsumableDto {
  @ApiProperty({
    example: "Coffee Beans",
    description: "Consumable name",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 5,
    description: "Consumable quantity",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({
    example: "Available",
    description: "Consumable status",
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 1, description: "Room ID", required: false })
  @IsOptional()
  @IsNumber()
  roomId?: number;

  @ApiProperty({ example: 1, description: "Place ID", required: false })
  @IsOptional()
  @IsNumber()
  placeId?: number;

  @ApiProperty({ example: 1, description: "Container ID", required: false })
  @IsOptional()
  @IsNumber()
  containerId?: number;
}
