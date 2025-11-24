import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional } from "class-validator";

export class CreateContainerDto {
  @ApiProperty({ example: "Storage Box", description: "Container name" })
  @IsString()
  name: string;

  @ApiProperty({
    example: "box",
    description: "Container icon",
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ example: 1, description: "Place ID", required: false })
  @IsOptional()
  @IsNumber()
  placeId?: number;

  @ApiProperty({ example: 1, description: "Room ID", required: false })
  @IsOptional()
  @IsNumber()
  roomId?: number;
}

export class UpdateContainerDto {
  @ApiProperty({
    example: "Storage Box",
    description: "Container name",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: "box",
    description: "Container icon",
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ example: 1, description: "Place ID", required: false })
  @IsOptional()
  @IsNumber()
  placeId?: number;

  @ApiProperty({ example: 1, description: "Room ID", required: false })
  @IsOptional()
  @IsNumber()
  roomId?: number;
}
