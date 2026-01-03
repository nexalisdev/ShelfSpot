import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

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

export class BulkCreateContainerDto {
  @ApiProperty({ type: [CreateContainerDto], description: "Array of containers to create" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContainerDto)
  containers: CreateContainerDto[];
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
