import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AdminController } from "./admin.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { PrismaModule } from "../prisma.module";
import { EmailModule } from "../email/email.module";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: "1h",
          issuer: "shelfspot-api",
          audience: "shelfspot-app",
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController, AdminController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
