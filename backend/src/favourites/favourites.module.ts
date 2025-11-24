import { Module } from "@nestjs/common";
import { FavouritesService } from "./favourites.service";
import { FavouritesController } from "./favourites.controller";
import { PrismaModule } from "../prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [FavouritesService],
  controllers: [FavouritesController],
})
export class FavouritesModule {}
