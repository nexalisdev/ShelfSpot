/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AlertsService } from "../alerts/alerts.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ConsumablesService {
  constructor(
    private prisma: PrismaService,
    private alertsService: AlertsService
  ) {}

  private transformItem(item: any) {
    if (!item) {
      return null;
    }
    const { itemTags, ...rest } = item;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const tags = itemTags ? itemTags.map((it: any) => it.tag.name) : [];
    return {
      ...rest,
      tags,
    };
  }

  async findAll() {
    const items = await this.prisma.item.findMany({
      where: {
        consumable: true,
      },
      include: {
        room: true,
        place: true,
        container: true,
        itemTags: {
          include: {
            tag: true,
          },
        },
      },
    });
    return items.map((item) => this.transformItem(item));
  }

  async findOne(id: number) {
    const item = await this.prisma.item.findUnique({
      where: {
        id,
        consumable: true,
      },
      include: {
        room: true,
        place: true,
        container: true,
        itemTags: {
          include: {
            tag: true,
          },
        },
      },
    });
    return this.transformItem(item);
  }

  async create(data: Prisma.ItemCreateInput) {
    const item = await this.prisma.item.create({
      data: {
        ...data,
        consumable: true,
      },
      include: {
        room: true,
        place: true,
        container: true,
        itemTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Check alerts for the new consumable
    if (typeof data.quantity === "number") {
      // Check alerts asynchronously without blocking the response
      this.alertsService
        .checkItemAlerts(item.id, data.quantity)
        .catch((error) => {
          console.error(
            `Error checking alerts for new consumable ${item.id}:`,
            error
          );
        });
    }

    return this.transformItem(item);
  }

  async update(id: number, data: Prisma.ItemUpdateInput) {
    // Retrieve the previous quantity before the update
    const oldItem = await this.prisma.item.findUnique({
      where: { id, consumable: true },
      select: { quantity: true },
    });

    const item = await this.prisma.item.update({
      where: {
        id,
        consumable: true,
      },
      data: {
        ...data,
        consumable: true,
      },
      include: {
        room: true,
        place: true,
        container: true,
        itemTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Check alerts if the quantity has changed
    if (
      data.quantity !== undefined &&
      oldItem &&
      typeof data.quantity === "number"
    ) {
      const newQuantity = data.quantity;
      if (newQuantity !== oldItem.quantity) {
        // Check alerts asynchronously without blocking the response
        this.alertsService.checkItemAlerts(id, newQuantity).catch((error) => {
          console.error(`Error checking alerts for consumable ${id}:`, error);
        });
      }
    }

    return this.transformItem(item);
  }

  remove(id: number) {
    return this.prisma.item.delete({
      where: {
        id,
        consumable: true,
      },
    });
  }

  // Method to get consumables with low stock
  async findLowStock(threshold: number = 5) {
    const items = await this.prisma.item.findMany({
      where: {
        consumable: true,
        quantity: {
          lte: threshold,
        },
      },
      include: {
        room: true,
        place: true,
        container: true,
        itemTags: {
          include: {
            tag: true,
          },
        },
      },
    });
    return items.map((item) => this.transformItem(item));
  }
}
