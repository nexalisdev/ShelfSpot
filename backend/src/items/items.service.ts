/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AlertsService } from "../alerts/alerts.service";
import { ScoringService } from "../scoring/scoring.service";
import { Prisma } from "@prisma/client";

// Interface for update data with tags support
interface UpdateItemData {
  name?: string;
  quantity?: number;
  status?: string;
  itemLink?: string;
  price?: number;
  sellprice?: number;
  roomId?: number;
  placeId?: number;
  containerId?: number;
  tags?: string[];
}

// Type for item with all includes
type ItemWithIncludes = Prisma.ItemGetPayload<{
  include: {
    room: true;
    place: true;
    container: true;
    itemTags: {
      include: {
        tag: true;
      };
    };
  };
}>;

// Type for transformed item
export interface TransformedItem {
  id: number;
  name: string;
  quantity: number;
  image: string | null;
  price: number | null;
  sellprice: number | null;
  status: string | null;
  consumable: boolean;
  placeId: number | null;
  roomId: number | null;
  containerId: number | null;
  itemLink: string | null;
  importanceScore: number;
  room: { id: number; name: string; icon: string | null } | null;
  place: {
    id: number;
    name: string;
    icon: string | null;
    roomId: number | null;
  } | null;
  container: {
    id: number;
    name: string;
    icon: string | null;
    roomId: number | null;
    placeId: number | null;
  } | null;
  tags: string[];
}

// Type for inventory value response
export interface InventoryValueResponse {
  totalValue: number;
  itemsWithValue: number;
  totalItems: number;
}

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private alertsService: AlertsService,
    private scoringService: ScoringService
  ) {}

  private transformItem(item: ItemWithIncludes | null): TransformedItem | null {
    if (!item) {
      return null;
    }
    const { itemTags, ...rest } = item;
    const tags = itemTags ? itemTags.map((it) => it.tag.name) : [];
    return {
      ...rest,
      tags,
    };
  }

  async create(data: Prisma.ItemCreateInput): Promise<TransformedItem | null> {
    const item = await this.prisma.item.create({
      data,
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

    if (typeof data.quantity === "number") {
      this.alertsService
        .checkItemAlerts(item.id, data.quantity)
        .catch((error) => {
          console.error(
            `Error checking alerts for new item ${item.id}:`,
            error
          );
        });
    }

    return this.transformItem(item);
  }

  async createMany(
    data: Prisma.ItemCreateManyInput[]
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.item.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async findAll(): Promise<(TransformedItem | null)[]> {
    const items = await this.prisma.item.findMany({
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

  async findOne(id: number): Promise<TransformedItem | null> {
    const item = await this.prisma.item.findUnique({
      where: { id },
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

  async update(
    id: number,
    data: UpdateItemData
  ): Promise<TransformedItem | null> {
    const oldItem = await this.prisma.item.findUnique({
      where: { id },
      select: { quantity: true },
    });

    // Extract tags from data if present
    const { tags, ...itemData } = data;

    // Update the item first
    const item = await this.prisma.item.update({
      where: { id },
      data: itemData,
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

    // Handle tags update if tags array is provided
    if (tags !== undefined && Array.isArray(tags)) {
      // Delete existing item-tag relationships
      await this.prisma.itemTag.deleteMany({
        where: { itemId: id },
      });

      // Create new item-tag relationships
      if (tags.length > 0) {
        for (const tagName of tags) {
          // Find or create the tag
          let tag = await this.prisma.tag.findUnique({
            where: { name: tagName },
          });

          if (!tag) {
            tag = await this.prisma.tag.create({
              data: { name: tagName },
            });
          }

          // Create item-tag relationship
          await this.prisma.itemTag.create({
            data: {
              itemId: id,
              tagId: tag.id,
            },
          });
        }
      }

      // Fetch the updated item with new tags
      const updatedItem = await this.prisma.item.findUnique({
        where: { id },
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

      if (updatedItem) {
        if (
          itemData.quantity !== undefined &&
          oldItem &&
          typeof itemData.quantity === "number"
        ) {
          const newQuantity = itemData.quantity;
          if (newQuantity !== oldItem.quantity) {
            // Check alerts asynchronously without blocking the response
            this.alertsService
              .checkItemAlerts(id, newQuantity)
              .catch((error) => {
                console.error(`Error checking alerts for item ${id}:`, error);
              });
          }
        }

        return this.transformItem(updatedItem);
      }
    }

    // Check alerts if quantity has changed
    if (
      itemData.quantity !== undefined &&
      oldItem &&
      typeof itemData.quantity === "number"
    ) {
      const newQuantity = itemData.quantity;
      if (newQuantity !== oldItem.quantity) {
        // Check alerts asynchronously without blocking the response
        this.alertsService.checkItemAlerts(id, newQuantity).catch((error) => {
          console.error(`Error checking alerts for item ${id}:`, error);
        });
      }
    }

    return this.transformItem(item);
  }

  remove(id: number) {
    return this.prisma.item.delete({
      where: { id },
    });
  }

  async search(searchTerm: string): Promise<(TransformedItem | null)[]> {
    const items = await this.prisma.item.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
            },
          },
          {
            status: {
              contains: searchTerm,
            },
          },
          {
            room: {
              name: {
                contains: searchTerm,
              },
            },
          },
          {
            place: {
              name: {
                contains: searchTerm,
              },
            },
          },
        ],
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

  async getInventoryValue(): Promise<InventoryValueResponse> {
    const allItemsCount = await this.prisma.item.count();

    const items = await this.prisma.item.findMany({
      where: {
        sellprice: {
          not: null,
        },
      },
      select: {
        sellprice: true,
        quantity: true,
      },
    });

    const totalValue = items.reduce((sum, item) => {
      return sum + (item.sellprice || 0) * item.quantity;
    }, 0);

    return {
      totalValue,
      itemsWithValue: items.length,
      totalItems: allItemsCount,
    };
  }

  async getStatusStatistics() {
    // Get all items with their status
    const items = await this.prisma.item.findMany({
      select: {
        status: true,
      },
    });

    // Group items by status and normalize the data
    const statusCounts = new Map<string, number>();

    items.forEach((item) => {
      let status = item.status;

      // Normalize status values
      if (!status || status.trim() === "") {
        status = "No Status";
      } else {
        // Normalize case and common variations
        status = status.trim().toLowerCase();
        switch (status) {
          case "good":
          case "bon":
          case "available":
          case "disponible":
          case "ok":
            status = "Good";
            break;
          case "damaged":
          case "endommagé":
          case "endommage":
          case "broken":
          case "cassé":
          case "casse":
            status = "Damaged";
            break;
          case "missing":
          case "manquant":
          case "lost":
          case "perdu":
            status = "Missing";
            break;
          case "expired":
          case "expiré":
          case "expire":
          case "old":
          case "ancien":
            status = "Expired";
            break;
          default:
            // Keep the original status but capitalize first letter
            status = status.charAt(0).toUpperCase() + status.slice(1);
        }
      }

      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    // Convert to array format
    const data = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Sort by count descending
    data.sort((a, b) => b.count - a.count);

    return {
      data,
      total: items.length,
    };
  }
}
