import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.RoomCreateInput) {
    return this.prisma.room.create({
      data,
    });
  }

  async createMany(data: Prisma.RoomCreateManyInput[]) {
    const created: any[] = [];
    for (const d of data) {
      // Ensure we only pass allowed fields to create (strip unknown fields like description)
      const payload: Prisma.RoomCreateInput = {
        name: (d as any).name,
        icon: (d as any).icon || undefined,
      };
      const room = await this.create(payload);
      created.push(room);
    }
    return { count: created.length } as Prisma.BatchPayload;
  }

  findAll() {
    return this.prisma.room.findMany({
      include: {
        places: true,
        _count: {
          select: { items: true },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        places: true,
        _count: {
          select: { items: true },
        },
      },
    });
  }

  update(id: number, data: Prisma.RoomUpdateInput) {
    return this.prisma.room.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.room.delete({
      where: { id },
    });
  }
}
