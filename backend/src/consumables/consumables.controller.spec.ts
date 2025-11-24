import { Test, TestingModule } from "@nestjs/testing";
import { ConsumablesController } from "./consumables.controller";

describe("ConsumablesController", () => {
  let controller: ConsumablesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumablesController],
    }).compile();

    controller = module.get<ConsumablesController>(ConsumablesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
