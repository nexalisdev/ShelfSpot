/* eslint-disable prettier/prettier */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import { EmailService } from "../email/email.service";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { CreateUserDto, UpdateUserDto } from "./dto/admin.dto";
import {
  UserPayload,
  AuthResult,
  JwtPayload,
} from "./interfaces/auth.interface";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService
  ) {}

  // Utility function to convert Prisma types to frontend types
  private convertPrismaUser(user: {
    id: number;
    email: string;
    name: string | null;
    admin: boolean;
    notificationToken?: string | null;
  }): UserPayload {
    return {
      id: String(user.id), // number -> string
      email: user.email,
      name: user.name || undefined,
      admin: user.admin,
      notificationToken: user.notificationToken || undefined,
    };
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<UserPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        admin: true,
        notificationToken: true,
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return {
        id: String(result.id),
        email: result.email,
        name: result.name || undefined,
        admin: result.admin,
        notificationToken: result.notificationToken || undefined,
      };
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    console.log("AuthService: User authenticated:", user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      admin: user.admin,
      notificationToken: user.notificationToken,
    };

    console.log("AuthService: JWT payload:", JSON.stringify(payload, null, 2));

    const access_token = this.jwtService.sign(payload);
    console.log(
      "AuthService: Generated token:",
      access_token.substring(0, 50) + "..."
    );

    return {
      access_token,
      token_type: "bearer",
      expires_in: 3600, // 1 hour in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        admin: user.admin,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    // Validate name if provided
    if (registerDto.name && registerDto.name.length < 5) {
      throw new BadRequestException("Name must be at least 5 characters long");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name || null,
        admin: false,
        notificationToken: registerDto.notificationToken || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
        notificationToken: true,
      },
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: String(user.id), // Conversion number -> string
      email: user.email,
      name: user.name || undefined, // null -> undefined
      admin: user.admin,
      notificationToken: user.notificationToken || undefined, // null -> undefined
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      token_type: "bearer",
      expires_in: 3600,
      user: {
        id: String(user.id), // Conversion number -> string
        email: user.email,
        name: user.name || undefined, // null -> undefined
        admin: user.admin,
        notificationToken: user.notificationToken || undefined, // null -> undefined
      },
    };
  }

  async getUserProfile(userId: string): Promise<UserPayload> {
    console.log("AuthService: getUserProfile called with userId:", userId);

    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
        notificationToken: true,
      },
    });

    if (!user) {
      console.log("AuthService: User not found for userId:", userId);
      throw new UnauthorizedException("User not found");
    }

    console.log("AuthService: User found:", user);
    const userPayload = this.convertPrismaUser(user);
    console.log("AuthService: Returning user payload:", userPayload);
    return userPayload;
  }

  async updateUserName(userId: string, newName: string): Promise<UserPayload> {
    if (typeof newName === "string" && newName.length < 5) {
      throw new BadRequestException("Name must be at least 5 characters long");
    }

    const user = await this.prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { name: newName },
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
      },
    });

    return this.convertPrismaUser(user);
  }

  async updateUserEmail(
    userId: string,
    newEmail: string
  ): Promise<UserPayload> {
    // Validate email format is handled by the DTO validator

    // Check if the new email is already in use by another user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== parseInt(userId, 10)) {
      throw new ConflictException("Email already exists");
    }

    const user = await this.prisma.user.update({
      where: { id: parseInt(userId, 10) }, // Convert string -> number for database
      data: { email: newEmail },
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
      },
    });

    return this.convertPrismaUser(user);
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generate a temporary password (8 characters)
    const tempPassword = Math.random().toString(36).slice(-8);

    // Hash the temporary password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // Update user with temporary password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send email with temporary password
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        tempPassword,
        user.name || "User"
      );
    } catch (error) {
      console.error("Error sending password reset email:", error);
      // Don't throw error to avoid revealing email sending failures
    }
  }

  async getAllUsers(): Promise<UserPayload[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map((user) => this.convertPrismaUser(user));
  }

  async createUserByAdmin(createUserDto: CreateUserDto): Promise<UserPayload> {
    // Check if the email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    // Validate name if provided
    if (createUserDto.name && createUserDto.name.length < 5) {
      throw new BadRequestException("Name must be at least 5 characters long");
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds
    );

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name || null,
        admin: createUserDto.admin || false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
      },
    });

    return this.convertPrismaUser(user);
  }

  async updateUserByAdmin(
    userId: number | string,
    updateUserDto: UpdateUserDto
  ): Promise<UserPayload> {
    const numericUserId =
      typeof userId === "string" ? parseInt(userId, 10) : userId;

    // Check that the user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: numericUserId },
    });

    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    // Prepare the data to update
    const updateData: {
      email?: string;
      name?: string | null;
      admin?: boolean;
      password?: string;
      notificationToken?: string | null;
    } = {};

    if (updateUserDto.email) {
      // Check that the new email is not already in use
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          id: { not: numericUserId },
        },
      });

      if (emailExists) {
        throw new ConflictException("Email already exists");
      }

      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.name !== undefined) {
      if (updateUserDto.name && updateUserDto.name.length < 5) {
        throw new BadRequestException(
          "Name must be at least 5 characters long"
        );
      }
      updateData.name = updateUserDto.name || null;
    }

    if (updateUserDto.admin !== undefined) {
      updateData.admin = updateUserDto.admin;
    }

    if (updateUserDto.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds
      );
    }

    if (updateUserDto.notificationToken !== undefined) {
      updateData.notificationToken = updateUserDto.notificationToken || null;
    }

    // Update the user
    const updatedUser = await this.prisma.user.update({
      where: { id: numericUserId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
        notificationToken: true,
      },
    });

    return this.convertPrismaUser(updatedUser);
  }

  async deleteUserByAdmin(userId: number | string): Promise<void> {
    const numericUserId =
      typeof userId === "string" ? parseInt(userId, 10) : userId;

    try {
      await this.prisma.user.delete({
        where: { id: numericUserId },
      });
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === "P2025") {
        throw new NotFoundException("User not found");
      }
      throw error;
    }
  }

  async updateNotificationToken(
    userId: string,
    notificationToken: string | null
  ): Promise<UserPayload> {
    const user = await this.prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { notificationToken },
      select: {
        id: true,
        email: true,
        name: true,
        admin: true,
        notificationToken: true,
      },
    });

    return this.convertPrismaUser(user);
  }
}
