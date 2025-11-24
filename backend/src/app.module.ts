import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ItemsModule } from "./items/items.module";
import { RoomsModule } from "./rooms/rooms.module";
import { PlacesModule } from "./places/places.module";
import { FavouritesModule } from "./favourites/favourites.module";
import { ConsumablesModule } from "./consumables/consumables.module";
import { TagsModule } from "./tags/tags.module";
import { ContainersModule } from "./containers/containers.module";
import { AlertsModule } from "./alerts/alerts.module";
import { EmailModule } from "./email/email.module";
import { ScoringModule } from "./scoring/scoring.module";
import { ProjectsModule } from "./projects/projects.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PreferencesModule } from "./preferences/preferences.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuthModule,
    ItemsModule,
    RoomsModule,
    PlacesModule,
    FavouritesModule,
    ConsumablesModule,
    TagsModule,
    ContainersModule,
    AlertsModule,
    EmailModule,
    ScoringModule,
    ProjectsModule,
    NotificationsModule,
    PreferencesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
