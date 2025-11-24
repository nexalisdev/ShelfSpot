import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealthStatus() {
    const startTime = Date.now();

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      ping: `${Date.now() - startTime}ms`,
      service: "ShelfSpot API",
    };
  }
}
