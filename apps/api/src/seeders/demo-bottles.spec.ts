import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AddBottleInput } from "../bottles/add-bottle.input";
import { DEMO_BOTTLES } from "./demo-bottles";

const FREE_PHOTO_HOSTS = ["upload.wikimedia.org", "images.unsplash.com"];

describe("DEMO_BOTTLES", () => {
  it.each(
    DEMO_BOTTLES,
  )("$name passes the addBottle validation", async (bottle) => {
    const input = plainToInstance(AddBottleInput, {
      name: bottle.name,
      producer: bottle.producer,
      vintage: bottle.vintage,
      region: bottle.region,
      photoUrl: bottle.photoUrl ?? undefined,
    });

    expect(await validate(input)).toEqual([]);
  });

  it("hotlinks photos only from free-license hosts", () => {
    const hosts = DEMO_BOTTLES.flatMap((bottle) =>
      bottle.photoUrl ? [new URL(bottle.photoUrl).hostname] : [],
    );

    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts) {
      expect(FREE_PHOTO_HOSTS).toContain(host);
    }
  });

  it("keeps one bottle without a photo for the placeholder", () => {
    expect(DEMO_BOTTLES.some((bottle) => bottle.photoUrl === null)).toBe(true);
  });

  // Only the owner can like a bottle (D-1), so big demo counts would look fake.
  it("keeps demo likes between 0 and 5", () => {
    for (const bottle of DEMO_BOTTLES) {
      expect(bottle.likesCount).toBeGreaterThanOrEqual(0);
      expect(bottle.likesCount).toBeLessThanOrEqual(5);
    }
  });

  it("has unique ids", () => {
    const ids = DEMO_BOTTLES.map((bottle) => bottle.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
