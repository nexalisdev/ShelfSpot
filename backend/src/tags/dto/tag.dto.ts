import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreateTagDto {
  @ApiProperty({ example: "Electronics", description: "Tag name" })
  @IsString()
  name: string;
}

export class UpdateTagDto {
  @ApiProperty({
    example: "Electronics",
    description: "Tag name",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
