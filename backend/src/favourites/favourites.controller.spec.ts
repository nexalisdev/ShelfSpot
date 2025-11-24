import { Test, TestingModule } from "@nestjs/testing";
import { FavouritesController } from "./favourites.controller";

describe("FavouritesController", () => {
  let controller: FavouritesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavouritesController],
    }).compile();

    controller = module.get<FavouritesController>(FavouritesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
