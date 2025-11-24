import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.PlaceCreateInput) {
    return this.prisma.place.create({
      data,
    });
  }

  async createWithValidation(data: Prisma.PlaceCreateInput) {
    // Check that the room exists if roomId is provided
    if (data.room && typeof data.room === "object" && "connect" in data.room) {
      const roomId = data.room.connect?.id;
      if (roomId) {
        const roomExists = await this.prisma.room.findUnique({
          where: { id: roomId },
        });
        if (!roomExists) {
          throw new Error(`Room with id ${roomId} does not exist`);
        }
      }
    }

    return this.create(data);
  }

  findAll() {
    return this.prisma.place.findMany({
      include: {
        items: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.place.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  update(id: number, data: Prisma.PlaceUpdateInput) {
    return this.prisma.place.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.place.delete({
      where: { id },
    });
  }
}
