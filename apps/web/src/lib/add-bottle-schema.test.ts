import { getMaxVintage } from "@mini-wine-cellar/shared";
import { addBottleSchema } from "./add-bottle-schema";

const VALID = {
  name: "Barolo",
  producer: "Giacomo Conterno",
  vintage: 2016,
  region: "Piedmont",
  photoUrl: "https://example.com/barolo.jpg",
};

function messagesFor(input: Record<string, unknown>, field: string): string[] {
  const result = addBottleSchema.safeParse(input);
  if (result.success) {
    return [];
  }
  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

describe("addBottleSchema", () => {
  it("accepts a valid bottle", () => {
    expect(addBottleSchema.parse(VALID)).toEqual(VALID);
  });

  it.each([
    ["name", "Name"],
    ["producer", "Producer"],
    ["region", "Region"],
  ])("requires %s", (field, label) => {
    expect(messagesFor({ ...VALID, [field]: "   " }, field)).toEqual([
      `${label} is required`,
    ]);
  });

  it.each([
    "name",
    "producer",
    "region",
  ])("rejects %s longer than 100 characters", (field) => {
    expect(messagesFor({ ...VALID, [field]: "a".repeat(101) }, field)).toEqual([
      expect.stringContaining("at most 100 characters"),
    ]);
  });

  it("trims the text fields", () => {
    const parsed = addBottleSchema.parse({
      ...VALID,
      name: "  Barolo  ",
      producer: " Giacomo Conterno ",
      region: "\tPiedmont\n",
    });
    expect(parsed).toMatchObject({
      name: "Barolo",
      producer: "Giacomo Conterno",
      region: "Piedmont",
    });
  });

  it("requires a vintage", () => {
    expect(messagesFor({ ...VALID, vintage: Number.NaN }, "vintage")).toEqual([
      "Vintage is required",
    ]);
    expect(messagesFor({ ...VALID, vintage: undefined }, "vintage")).toEqual([
      "Vintage is required",
    ]);
  });

  it("accepts the vintage bounds and rejects values outside them", () => {
    const max = getMaxVintage();
    const range = `Vintage must be between 1900 and ${max}`;
    expect(messagesFor({ ...VALID, vintage: 1900 }, "vintage")).toEqual([]);
    expect(messagesFor({ ...VALID, vintage: max }, "vintage")).toEqual([]);
    expect(messagesFor({ ...VALID, vintage: 1899 }, "vintage")).toEqual([
      range,
    ]);
    expect(messagesFor({ ...VALID, vintage: max + 1 }, "vintage")).toEqual([
      range,
    ]);
  });

  it("reads the max vintage at validation time, not at import", () => {
    jest.useFakeTimers({ now: new Date("2030-06-01T00:00:00Z") });
    try {
      expect(messagesFor({ ...VALID, vintage: 2030 }, "vintage")).toEqual([]);
    } finally {
      jest.useRealTimers();
    }
  });

  it("rejects a fractional vintage", () => {
    expect(messagesFor({ ...VALID, vintage: 2016.5 }, "vintage")).toContain(
      "Vintage must be a whole number",
    );
  });

  it.each([
    "",
    "   ",
  ])("turns an empty photo URL %j into undefined", (photoUrl) => {
    expect(addBottleSchema.parse({ ...VALID, photoUrl }).photoUrl).toBe(
      undefined,
    );
  });

  it("trims the photo URL", () => {
    expect(
      addBottleSchema.parse({
        ...VALID,
        photoUrl: " https://example.com/a.jpg ",
      }).photoUrl,
    ).toBe("https://example.com/a.jpg");
  });

  it.each([
    "http://x.com/a.jpg",
    "ftp://x.com/a.jpg",
    "x.com/a.jpg",
    "https:x.com/a.jpg",
  ])("accepts https only: rejects %s", (photoUrl) => {
    expect(messagesFor({ ...VALID, photoUrl }, "photoUrl")).toContain(
      "Photo URL must start with https://",
    );
  });

  it("rejects a photo URL with credentials", () => {
    expect(
      messagesFor(
        { ...VALID, photoUrl: "https://user:pass@x.com/a.jpg" },
        "photoUrl",
      ),
    ).toEqual(["Photo URL must not contain a username or password"]);
    expect(
      messagesFor(
        { ...VALID, photoUrl: "https://user@x.com/a.jpg" },
        "photoUrl",
      ),
    ).toEqual(["Photo URL must not contain a username or password"]);
  });

  it.each([
    "https://localhost/a.jpg",
    "https://cellar/a.jpg",
  ])("requires a full domain like the api: rejects %s", (photoUrl) => {
    expect(messagesFor({ ...VALID, photoUrl }, "photoUrl")).toEqual([
      "Photo URL must use a full domain name, like example.com",
    ]);
  });

  it("rejects a photo URL longer than 2048 characters", () => {
    const photoUrl = `https://x.com/${"a".repeat(2048)}`;
    expect(messagesFor({ ...VALID, photoUrl }, "photoUrl")).toEqual([
      "Photo URL must be at most 2048 characters",
    ]);
  });
});
