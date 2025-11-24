import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

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
