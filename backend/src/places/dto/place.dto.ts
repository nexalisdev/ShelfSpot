import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreatePlaceDto {
  @ApiProperty({ example: "Kitchen Counter" })
  @IsString()
  name: string;

  @ApiProperty({
    example: 1,
    description: "Room ID",
  })
  @IsNumber()
  roomId: number;
}

export class UpdatePlaceDto {
  @ApiProperty({
    example: "Kitchen Counter",
    required: false,
  })
  @IsString()
  name: string;
}

export class BulkCreatePlaceDto {
  @ApiProperty({ type: [CreatePlaceDto], description: "Array of places to create" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlaceDto)
  places: CreatePlaceDto[];
}
