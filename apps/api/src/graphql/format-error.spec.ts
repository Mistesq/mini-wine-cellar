import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GraphQLError, type GraphQLFormattedError } from "graphql";
import { AddBottleInput } from "../bottles/add-bottle.input";
import { formatError } from "./format-error";
import { createValidationException } from "./validation-exception";

const LOCATIONS = [{ line: 1, column: 12 }];
const PATH = ["addBottle"];

// What Apollo hands formatError for an error thrown in a resolver: the
// formatted error (with whatever extensions it added) and a GraphQLError that
// wraps the original exception.
function fromResolver(original: Error) {
  const formatted: GraphQLFormattedError = {
    message: original.message,
    locations: LOCATIONS,
    path: PATH,
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
      stacktrace: ["Error: internal", "at someFile.ts:1:1"],
    },
  };
  const error = new GraphQLError(original.message, {
    path: PATH,
    originalError: original,
  });
  return formatError(formatted, error);
}

describe("formatError", () => {
  let loggerError: jest.SpyInstance;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerError.mockRestore();
  });

  it("maps 400 to BAD_USER_INPUT with the field messages", () => {
    const exception = new BadRequestException({
      message: "Invalid input",
      fields: { name: ["name must be longer than or equal to 1 characters"] },
    });

    expect(fromResolver(exception)).toEqual({
      message: "Invalid input",
      locations: LOCATIONS,
      path: PATH,
      extensions: {
        code: "BAD_USER_INPUT",
        fields: {
          name: ["name must be longer than or equal to 1 characters"],
        },
      },
    });
  });

  it("maps a 400 without fields (e.g. ParseUUIDPipe) to BAD_USER_INPUT without fields", () => {
    const result = fromResolver(
      new BadRequestException("Validation failed (uuid is expected)"),
    );

    expect(result.extensions).toEqual({ code: "BAD_USER_INPUT" });
    expect(result.message).toBe("Validation failed (uuid is expected)");
  });

  it("drops fields that are not string arrays", () => {
    const result = fromResolver(
      new BadRequestException({
        message: "Invalid input",
        fields: { name: 1 },
      }),
    );

    expect(result.extensions).toEqual({ code: "BAD_USER_INPUT" });
  });

  it("maps 401 to UNAUTHENTICATED", () => {
    const result = fromResolver(
      new UnauthorizedException("A valid x-user-id header is required"),
    );

    expect(result).toEqual({
      message: "A valid x-user-id header is required",
      locations: LOCATIONS,
      path: PATH,
      extensions: { code: "UNAUTHENTICATED" },
    });
  });

  it("maps 404 to NOT_FOUND", () => {
    const result = fromResolver(new NotFoundException("Bottle not found"));

    expect(result.message).toBe("Bottle not found");
    expect(result.extensions).toEqual({ code: "NOT_FOUND" });
  });

  it.each([
    ["an unexpected error", new Error("connect ECONNREFUSED 127.0.0.1:5432")],
    ["an unmapped HTTP status", new ForbiddenException("internal rule 7")],
  ])("hides %s behind a generic message and logs it", (_, original) => {
    const result = fromResolver(original);

    expect(result).toEqual({
      message: "Internal server error",
      locations: LOCATIONS,
      path: PATH,
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
    expect(JSON.stringify(result)).not.toContain(original.message);
    expect(loggerError).toHaveBeenCalledWith(original.stack);
  });

  it.each([
    "GRAPHQL_PARSE_FAILED",
    "GRAPHQL_VALIDATION_FAILED",
    "BAD_USER_INPUT",
  ])("passes Apollo's own %s through with only its code", (code) => {
    const formatted: GraphQLFormattedError = {
      message: 'Cannot query field "bottles" on type "Query".',
      locations: LOCATIONS,
      extensions: { code, stacktrace: ["GraphQLError: ..."] },
    };

    expect(formatError(formatted, new GraphQLError(formatted.message))).toEqual(
      {
        message: formatted.message,
        locations: LOCATIONS,
        path: undefined,
        extensions: { code },
      },
    );
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("sends the ValidationPipe field messages as extensions.fields", async () => {
    const input = plainToInstance(AddBottleInput, {
      name: "   ",
      producer: "Antinori",
      vintage: 1899,
      region: "Tuscany",
      photoUrl: "http://example.com/a.jpg",
    });
    const exception = createValidationException(await validate(input));

    const result = fromResolver(exception);

    expect(result.extensions?.code).toBe("BAD_USER_INPUT");
    const fields = result.extensions?.fields as Record<string, string[]>;
    expect(Object.keys(fields).sort()).toEqual(["name", "photoUrl", "vintage"]);
    for (const messages of Object.values(fields)) {
      expect(messages.length).toBeGreaterThan(0);
      for (const message of messages) {
        expect(typeof message).toBe("string");
      }
    }
  });
});
