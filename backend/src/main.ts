/* eslint-disable prettier/prettier */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { writeFileSync } from "fs";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS configuration for the frontend
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://frontend:3000", // Docker internal communication
      process.env.FRONTEND_URL || "http://localhost:3000",
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("ShelfSpot API")
    .setDescription("API for ShelfSpot application with JWT Authentication")
    .setVersion("1.0")
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      name: "JWT",
      description: "Enter JWT token",
      in: "header",
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync(
    join(process.cwd(), "swagger.json"),
    JSON.stringify(document, null, 2)
  );
  SwaggerModule.setup("api/swagger", app, document);

  await app.listen(process.env.PORT ?? 3001, "0.0.0.0");
  console.log(
    `🚀 ShelfSpot API is running on: http://localhost:${process.env.PORT ?? 3001}`
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3001}/api/swagger`
  );
}
bootstrap();
