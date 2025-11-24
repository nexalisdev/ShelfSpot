import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail({}, { message: "Email must be valid" })
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(32, { message: "Password must be at most 32 characters long" })
  password: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: "Name must be at least 5 characters long" })
  name?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  admin?: boolean;

  @ApiProperty({ example: "fcm_token_example_123456", required: false })
  @IsOptional()
  @IsString()
  notificationToken?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: "user@example.com", required: false })
  @IsOptional()
  @IsEmail({}, { message: "Email must be valid" })
  email?: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: "Name must be at least 5 characters long" })
  name?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  admin?: boolean;

  @ApiProperty({ example: "newPassword123", required: false })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(32, { message: "Password must be at most 32 characters long" })
  password?: string;

  @ApiProperty({ example: "fcm_token_example_123456", required: false })
  @IsOptional()
  @IsString()
  notificationToken?: string;
}
