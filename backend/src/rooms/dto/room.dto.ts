import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

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
