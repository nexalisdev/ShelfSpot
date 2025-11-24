/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma.service";
import { JwtPayload, UserPayload } from "../interfaces/auth.interface";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    const jwtSecret = configService.get<string>("JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    // Check that the user still exists in the database
    const userId = parseInt(payload.sub);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
      },
    });

    if (!user) {
      console.log("JWT Strategy: User not found for ID:", userId);
      throw new UnauthorizedException("User not found");
    }

    const userPayload = {
      id: String(user.id),
      email: user.email,
      name: user.name || undefined,
      admin: user.admin,
    };

    return userPayload;
  }
}
