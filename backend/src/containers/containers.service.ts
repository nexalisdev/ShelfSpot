/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateContainerDto, UpdateContainerDto } from "./dto/container.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ContainersService {
  constructor(private prisma: PrismaService) {}

  async create(createContainerDto: CreateContainerDto) {
    // Check that the place exists if provided
    if (createContainerDto.placeId) {
      const place = await this.prisma.place.findUnique({
        where: { id: createContainerDto.placeId },
      });
      if (!place) {
        throw new NotFoundException(
          `Place with ID ${createContainerDto.placeId} not found`
        );
      }
    }

    // Check that the room exists if provided
    if (createContainerDto.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: createContainerDto.roomId },
      });
      if (!room) {
        throw new NotFoundException(
          `Room with ID ${createContainerDto.roomId} not found`
        );
      }
    }

    return this.prisma.container.create({
      data: {
        name: createContainerDto.name,
        icon: createContainerDto.icon || "box",
        placeId: createContainerDto.placeId,
        roomId: createContainerDto.roomId,
      },
      include: {
        place: true,
        room: true,
        items: true,
      },
    });
  }

  async createMany(data: Prisma.ContainerCreateManyInput[]) {
    const created: any[] = [];
    for (const d of data) {
      // Reuse existing create() which performs place/room existence checks
      const payload: CreateContainerDto = {
        name: (d as any).name,
        icon: (d as any).icon,
        placeId: (d as any).placeId,
        roomId: (d as any).roomId,
      };
      const container = await this.create(payload);
      created.push(container);
    }
    return { count: created.length } as Prisma.BatchPayload;
  }

  async findAll() {
    return this.prisma.container.findMany({
      include: {
        place: true,
        room: true,
        items: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findOne(id: number) {
    const container = await this.prisma.container.findUnique({
      where: { id },
      include: {
        place: true,
        room: true,
        items: true,
      },
    });

    if (!container) {
      throw new NotFoundException(`Container with ID ${id} not found`);
    }

    return container;
  }

  async update(id: number, updateContainerDto: UpdateContainerDto) {
    // Check that the container exists
    const existingContainer = await this.prisma.container.findUnique({
      where: { id },
    });

    if (!existingContainer) {
      throw new NotFoundException(`Container with ID ${id} not found`);
    }

    // Check that the place exists if provided
    if (updateContainerDto.placeId) {
      const place = await this.prisma.place.findUnique({
        where: { id: updateContainerDto.placeId },
      });
      if (!place) {
        throw new NotFoundException(
          `Place with ID ${updateContainerDto.placeId} not found`
        );
      }
    }

    // Check that the room exists if provided
    if (updateContainerDto.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: updateContainerDto.roomId },
      });
      if (!room) {
        throw new NotFoundException(
          `Room with ID ${updateContainerDto.roomId} not found`
        );
      }
    }

    return this.prisma.container.update({
      where: { id },
      data: updateContainerDto,
      include: {
        place: true,
        room: true,
        items: true,
      },
    });
  }

  async remove(id: number) {
    const existingContainer = await this.prisma.container.findUnique({
      where: { id },
    });

    if (!existingContainer) {
      throw new NotFoundException(`Container with ID ${id} not found`);
    }

    return this.prisma.container.delete({
      where: { id },
    });
  }
}
