import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CreateFavouriteDto {
  @ApiProperty({ example: 1, description: "Item ID to add to favourites" })
  @IsNumber()
  itemId: number;
}
