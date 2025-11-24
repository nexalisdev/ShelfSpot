import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail({}, { message: "Email must be valid" })
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;
}
