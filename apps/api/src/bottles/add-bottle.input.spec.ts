import { BOTTLE_LIMITS } from "@mini-wine-cellar/shared";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AddBottleInput } from "./add-bottle.input";

const VALID = {
  name: "Tignanello",
  producer: "Antinori",
  vintage: 2019,
  region: "Tuscany",
  photoUrl: "https://example.com/tignanello.jpg",
};

// The same steps as the global ValidationPipe with transform: true.
async function check(overrides: Record<string, unknown>) {
  const input = plainToInstance(AddBottleInput, { ...VALID, ...overrides });
  const errors = await validate(input);
  return { input, failed: errors.map((error) => error.property) };
}

describe("AddBottleInput", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("accepts a valid bottle", async () => {
    expect((await check({})).failed).toEqual([]);
  });

  it("trims text fields before validating", async () => {
    const { input, failed } = await check({
      name: "  Tignanello ",
      producer: " Antinori",
      region: "Tuscany  ",
    });

    expect(failed).toEqual([]);
    expect(input).toMatchObject({
      name: "Tignanello",
      producer: "Antinori",
      region: "Tuscany",
    });
  });

  it.each([
    "name",
    "producer",
    "region",
  ])("rejects a %s of only spaces", async (field) => {
    expect((await check({ [field]: "   " })).failed).toEqual([field]);
  });

  it("rejects text longer than the shared limit", async () => {
    const name = "a".repeat(BOTTLE_LIMITS.text.max + 1);

    expect((await check({ name })).failed).toEqual(["name"]);
  });

  it.each([
    ["http://", "http://example.com/a.jpg"],
    ["credentials", "https://user:pass@example.com/a.jpg"],
    ["a host without a top-level domain", "https://localhost/a.jpg"],
    ["a one-letter top-level domain", "https://example.c/a.jpg"],
    ["a missing protocol", "example.com/a.jpg"],
  ])("rejects a photo URL with %s", async (_, photoUrl) => {
    expect((await check({ photoUrl })).failed).toEqual(["photoUrl"]);
  });

  it("explains a bad photo URL in the form's words", async () => {
    const input = plainToInstance(AddBottleInput, {
      ...VALID,
      photoUrl: "https://example.c/a.jpg",
    });
    const [error] = await validate(input);

    expect(error.constraints?.isUrl).toBe(
      "Photo URL must be an https:// URL with a valid domain",
    );
  });

  it("rejects a photo URL longer than the shared limit", async () => {
    const photoUrl = `https://example.com/${"a".repeat(BOTTLE_LIMITS.photoUrl.max)}`;

    expect((await check({ photoUrl })).failed).toEqual(["photoUrl"]);
  });

  it.each([
    ["an empty string", ""],
    ["spaces", "   "],
    ["null", null],
  ])("treats %s as no photo", async (_, photoUrl) => {
    const { input, failed } = await check({ photoUrl });

    expect(failed).toEqual([]);
    expect(input.photoUrl).toBeUndefined();
  });

  it("rejects a vintage before the shared minimum", async () => {
    const vintage = BOTTLE_LIMITS.vintage.min - 1;

    expect((await check({ vintage })).failed).toEqual(["vintage"]);
  });

  it("accepts the current year and rejects the next one", async () => {
    const year = new Date().getUTCFullYear();

    expect((await check({ vintage: year })).failed).toEqual([]);
    expect((await check({ vintage: year + 1 })).failed).toEqual(["vintage"]);
  });

  it("reads the year at validation time, not when the class loads", async () => {
    jest.useFakeTimers({ now: new Date("2031-06-01T12:00:00Z") });
    expect((await check({ vintage: 2031 })).failed).toEqual([]);

    jest.setSystemTime(new Date("2030-06-01T12:00:00Z"));
    expect((await check({ vintage: 2031 })).failed).toEqual(["vintage"]);
  });

  it("rejects a vintage that is not a whole number", async () => {
    expect((await check({ vintage: 2019.5 })).failed).toEqual(["vintage"]);
  });
});
