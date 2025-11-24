import { IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateEmailDto {
  @ApiProperty({ example: "newemail@example.com" })
  @IsEmail({}, { message: "Email must be valid" })
  email: string;
}
