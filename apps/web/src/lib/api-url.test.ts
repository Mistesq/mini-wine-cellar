import { resolveApiUrl } from "./api-url";

describe("resolveApiUrl", () => {
  it("returns the configured url", () => {
    expect(resolveApiUrl("https://api.example.com/graphql", "production")).toBe(
      "https://api.example.com/graphql",
    );
  });

  it("falls back to the local api outside production", () => {
    expect(resolveApiUrl(undefined, "development")).toBe(
      "http://localhost:4000/graphql",
    );
    expect(resolveApiUrl("", "test")).toBe("http://localhost:4000/graphql");
  });

  it("throws in production without a url", () => {
    expect(() => resolveApiUrl(undefined, "production")).toThrow(
      "NEXT_PUBLIC_API_URL must be set when NODE_ENV is production",
    );
  });
});
