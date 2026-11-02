import { CombinedGraphQLErrors } from "@apollo/client";
import { getErrorMessage, getServerFieldErrors } from "./graphql-errors";

const FIELDS = ["name", "photoUrl"] as const;

function graphQLError(message: string, extensions?: Record<string, unknown>) {
  return new CombinedGraphQLErrors({
    data: null,
    errors: [{ message, extensions }],
  });
}

describe("getServerFieldErrors", () => {
  it("maps BAD_USER_INPUT fields onto the known form fields", () => {
    const error = graphQLError("Invalid input", {
      code: "BAD_USER_INPUT",
      fields: {
        name: ["name must be shorter than or equal to 100 characters"],
        photoUrl: [
          "Photo URL must be an https:// URL with a valid domain",
          "second message",
        ],
        unknown: ["ignored"],
      },
    });
    expect(getServerFieldErrors(error, FIELDS)).toEqual({
      name: "name must be shorter than or equal to 100 characters",
      photoUrl: "Photo URL must be an https:// URL with a valid domain",
    });
  });

  it("returns null for a BAD_USER_INPUT without fields", () => {
    const error = graphQLError("Invalid id", { code: "BAD_USER_INPUT" });
    expect(getServerFieldErrors(error, FIELDS)).toBeNull();
  });

  it("returns null when only unknown fields are reported", () => {
    const error = graphQLError("Invalid input", {
      code: "BAD_USER_INPUT",
      fields: { other: ["nope"] },
    });
    expect(getServerFieldErrors(error, FIELDS)).toBeNull();
  });

  it("ignores other error codes and network errors", () => {
    const unauthenticated = graphQLError(
      "A valid x-user-id header is required",
      {
        code: "UNAUTHENTICATED",
        fields: { name: ["not a validation error"] },
      },
    );
    expect(getServerFieldErrors(unauthenticated, FIELDS)).toBeNull();
    expect(getServerFieldErrors(new TypeError("Failed to fetch"), FIELDS)).toBe(
      null,
    );
  });
});

describe("getErrorMessage", () => {
  it("returns the first GraphQL error message", () => {
    expect(getErrorMessage(graphQLError("Bottle not found"), "fallback")).toBe(
      "Bottle not found",
    );
  });

  it("asks to choose a user instead of showing the UNAUTHENTICATED text", () => {
    const error = graphQLError("A valid x-user-id header is required", {
      code: "UNAUTHENTICATED",
    });
    expect(getErrorMessage(error, "fallback")).toBe(
      "Choose a user to open the cellar",
    );
  });

  it("returns the fallback for a network error", () => {
    expect(getErrorMessage(new TypeError("Failed to fetch"), "fallback")).toBe(
      "fallback",
    );
  });
});
