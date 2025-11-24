/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AlertsService } from "./alerts.service";
import { CreateAlertDto, UpdateAlertDto } from "./dto/alert.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Alerts")
@Controller("alerts")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new alert" })
  @ApiBody({ type: CreateAlertDto })
  @ApiResponse({ status: 201, description: "Alert created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 404, description: "Item not found" })
  @ApiResponse({
    status: 409,
    description: "Alert with this threshold already exists for this item",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get("statistics/monthly")
  @ApiOperation({ summary: "Get monthly alerts statistics" })
  @ApiResponse({
    status: 200,
    description: "Monthly alerts statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              month: { type: "string", example: "Jan" },
              year: { type: "number", example: 2025 },
              count: { type: "number", example: 5 },
            },
          },
        },
        total: { type: "number", example: 45 },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getMonthlyStatistics() {
    return this.alertsService.getMonthlyStatistics();
  }

  @Get()
  @ApiOperation({ summary: "Get alerts" })
  @ApiQuery({
    name: "itemId",
    description: "Filter alerts by item ID",
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: "Alerts retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll(@Query("itemId") itemId?: string) {
    if (itemId) {
      return this.alertsService.findAllByItem(parseInt(itemId, 10));
    }
    return this.alertsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get alert by ID" })
  @ApiParam({ name: "id", description: "Alert ID" })
  @ApiResponse({ status: 200, description: "Alert retrieved successfully" })
  @ApiResponse({ status: 404, description: "Alert not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.alertsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update alert" })
  @ApiParam({ name: "id", description: "Alert ID" })
  @ApiBody({ type: UpdateAlertDto })
  @ApiResponse({ status: 200, description: "Alert updated successfully" })
  @ApiResponse({ status: 404, description: "Alert not found" })
  @ApiResponse({
    status: 409,
    description: "Alert with this threshold already exists for this item",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateAlertDto: UpdateAlertDto
  ) {
    return this.alertsService.update(id, updateAlertDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete alert" })
  @ApiParam({ name: "id", description: "Alert ID" })
  @ApiResponse({ status: 200, description: "Alert deleted successfully" })
  @ApiResponse({ status: 404, description: "Alert not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.alertsService.remove(id);
  }

  @Post("check")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Check all alerts and send notifications if needed",
  })
  @ApiResponse({
    status: 200,
    description: "Alerts checked successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        checkedAlerts: { type: "number" },
        triggeredAlerts: { type: "number" },
        sentAlerts: { type: "number" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Failed to check alerts" })
  checkAlerts() {
    return this.alertsService.checkAlerts();
  }

  @Post("test-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send test email to verify email configuration",
    description:
      "Sends a test email to the configured recipient to verify that email functionality is working properly",
  })
  @ApiQuery({
    name: "email",
    description: "Email address to send test email to",
    required: false,
    type: String,
    example: "test@example.com",
  })
  @ApiResponse({
    status: 200,
    description: "Test email sent successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        messageId: { type: "string" },
        message: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Email service not configured" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Failed to send test email" })
  async testEmail(@Query("email") email?: string) {
    return this.alertsService.sendTestEmail(email);
  }
}
