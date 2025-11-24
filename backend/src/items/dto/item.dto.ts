import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateItemDto {
  @ApiProperty({ example: "Laptop Dell XPS 13", description: "Item name" })
  @IsString()
  name: string;

  @ApiProperty({ example: 1, description: "Item quantity", minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: "Available",
    description: "Item status",
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    example: "https://example.com/item-link",
    description: "Link to the item",
    required: false,
  })
  @IsOptional()
  @IsString()
  itemLink?: string;

  // price property
  @ApiProperty({
    example: 999.99,
    description: "Purchase price of the item",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  // sellprice property
  @ApiProperty({
    example: 899.99,
    description: "Selling price of the item",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellprice?: number;

  // boolean property to check if the item is a consumable
  @ApiProperty({
    example: true,
    description: "Indicates if the item is a consumable",
    required: false,
  })
  @IsBoolean()
  consumable: boolean;

  @ApiProperty({ example: 1, description: "Room ID" })
  @IsNumber()
  roomId: number;

  @ApiProperty({ example: 1, description: "Place ID", required: false })
  @IsOptional()
  @IsNumber()
  placeId?: number;

  @ApiProperty({ example: 1, description: "Container ID", required: false })
  @IsOptional()
  @IsNumber()
  containerId?: number;
}

export class UpdateItemDto {
  @ApiProperty({
    example: "Laptop Dell XPS 13",
    description: "Item name",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 1,
    description: "Item quantity",
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    example: "Available",
    description: "Item status",
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    example: "https://example.com/item-link",
    description: "Link to the item",
    required: false,
  })
  @IsOptional()
  @IsString()
  itemLink?: string;

  // price property
  @ApiProperty({
    example: 999.99,
    description: "Purchase price of the item",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  // sellprice property
  @ApiProperty({
    example: 899.99,
    description: "Selling price of the item",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellprice?: number;

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

  @ApiProperty({
    example: ["electronics", "work"],
    description: "Array of tag names",
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class BulkCreateItemDto {
  @ApiProperty({
    type: [CreateItemDto],
    description: "Array of items to be created",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemDto)
  items: CreateItemDto[];
}
