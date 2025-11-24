import { IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateNotificationTokenDto {
  @ApiProperty({
    example: "fcm_token_example_123456789abcdef",
    description: "Firebase Cloud Messaging token for push notifications",
    required: false,
  })
  @IsOptional()
  @IsString()
  notificationToken?: string;
}
