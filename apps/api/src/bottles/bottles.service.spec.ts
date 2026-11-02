import { raw } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/postgresql";
import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Bottle } from "./bottle.entity";
import { BottlesService, type CreateBottleData } from "./bottles.service";

jest.mock("@mikro-orm/core", () => ({
  ...jest.requireActual("@mikro-orm/core"),
  raw: jest.fn((sql: string) => ({ sql })),
}));

const OWNER_ID = "00000000-0000-4000-8000-000000000001";
const BOTTLE_ID = "11111111-1111-4111-8111-111111111111";

const DATA: CreateBottleData = {
  name: "Tignanello",
  producer: "Antinori",
  region: "Tuscany",
  vintage: 2019,
};

describe("BottlesService", () => {
  let service: BottlesService;
  const em = {
    find: jest.fn(),
    create: jest.fn(),
    flush: jest.fn(),
    nativeUpdate: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [BottlesService, { provide: EntityManager, useValue: em }],
    }).compile();
    service = moduleRef.get(BottlesService);
  });

  describe("findForOwner", () => {
    it("filters by owner and orders newest first with id as tie-breaker", async () => {
      const bottles = [{ id: BOTTLE_ID }];
      em.find.mockResolvedValue(bottles);

      await expect(service.findForOwner(OWNER_ID)).resolves.toBe(bottles);
      expect(em.find).toHaveBeenCalledWith(
        Bottle,
        { owner: OWNER_ID },
        { orderBy: { createdAt: "DESC", id: "DESC" } },
      );
      const { orderBy } = em.find.mock.calls[0][2];
      expect(Object.keys(orderBy)).toEqual(["createdAt", "id"]);
    });
  });

  describe("create", () => {
    it("takes the owner from the argument and flushes", async () => {
      const bottle = { id: BOTTLE_ID };
      em.create.mockReturnValue(bottle);

      await expect(service.create(OWNER_ID, DATA)).resolves.toBe(bottle);
      expect(em.create).toHaveBeenCalledWith(Bottle, {
        ...DATA,
        owner: OWNER_ID,
        photoUrl: null,
      });
      expect(em.flush).toHaveBeenCalled();
    });

    it("ignores an owner smuggled into the input", async () => {
      const input = { ...DATA, owner: "someone-else" } as CreateBottleData;

      await service.create(OWNER_ID, input);
      expect(em.create.mock.calls[0][1].owner).toBe(OWNER_ID);
    });

    it("keeps the photo URL when given", async () => {
      const photoUrl = "https://example.com/tignanello.jpg";

      await service.create(OWNER_ID, { ...DATA, photoUrl });
      expect(em.create.mock.calls[0][1].photoUrl).toBe(photoUrl);
    });
  });

  describe("like", () => {
    it("increments atomically for the owner and returns the reloaded bottle", async () => {
      const bottle = { id: BOTTLE_ID, likesCount: 4 };
      em.nativeUpdate.mockResolvedValue(1);
      em.findOne.mockResolvedValue(bottle);

      await expect(service.like(OWNER_ID, BOTTLE_ID)).resolves.toBe(bottle);
      expect(raw).toHaveBeenCalledWith("likes_count + 1");
      expect(em.nativeUpdate).toHaveBeenCalledWith(
        Bottle,
        { id: BOTTLE_ID, owner: OWNER_ID },
        { likesCount: { sql: "likes_count + 1" } },
      );
      expect(em.findOne).toHaveBeenCalledWith(
        Bottle,
        { id: BOTTLE_ID, owner: OWNER_ID },
        { refresh: true },
      );
    });

    it("throws NotFoundException when no row matches (foreign or missing bottle)", async () => {
      em.nativeUpdate.mockResolvedValue(0);

      await expect(service.like(OWNER_ID, BOTTLE_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(em.findOne).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the row is gone before the reload", async () => {
      em.nativeUpdate.mockResolvedValue(1);
      em.findOne.mockResolvedValue(null);

      await expect(service.like(OWNER_ID, BOTTLE_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
