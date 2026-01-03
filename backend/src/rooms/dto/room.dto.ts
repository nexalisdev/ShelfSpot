import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateRoomDto {
  @ApiProperty({ example: "Living Room", description: "Room name" })
  @IsString()
  name: string;

  @ApiProperty({
    example: "Main living area",
    description: "Room description",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoomDto {
  @ApiProperty({
    example: "Living Room",
    description: "Room name",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: "Main living area",
    description: "Room description",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BulkCreateRoomDto {
  @ApiProperty({ type: [CreateRoomDto], description: "Array of rooms to create" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomDto)
  rooms: CreateRoomDto[];
}
