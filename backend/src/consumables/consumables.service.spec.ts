import { Test, TestingModule } from "@nestjs/testing";
import { ConsumablesService } from "./consumables.service";

describe("ConsumablesService", () => {
  let service: ConsumablesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsumablesService],
    }).compile();

    service = module.get<ConsumablesService>(ConsumablesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
