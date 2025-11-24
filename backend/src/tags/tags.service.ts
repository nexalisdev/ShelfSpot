import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateTagDto, UpdateTagDto } from "./dto/tag.dto";

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto) {
    return this.prisma.tag.create({
      data: createTagDto,
    });
  }

  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.tag.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateTagDto: UpdateTagDto) {
    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });
  }

  async remove(id: number) {
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
