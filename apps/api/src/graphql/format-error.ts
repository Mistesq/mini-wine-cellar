import {
  ApolloServerErrorCode,
  unwrapResolverError,
} from "@apollo/server/errors";
import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { GraphQLFormattedError } from "graphql";

const logger = new Logger("GraphQL");

const CODE_BY_STATUS: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: ApolloServerErrorCode.BAD_USER_INPUT,
  [HttpStatus.UNAUTHORIZED]: "UNAUTHENTICATED",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
};

// Codes Apollo sets itself for a bad request (parse, validation, variable coercion).
// They describe the client's mistake, so they pass through as they are.
const APOLLO_CLIENT_CODES = new Set<unknown>(
  Object.values(ApolloServerErrorCode).filter(
    (code) => code !== ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
  ),
);

// The single place that turns errors into what the client sees: a known code,
// a safe message, field messages for bad input, and never a stack trace.
export function formatError(
  formatted: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const { message, locations, path } = formatted;
  const original = unwrapResolverError(error);

  if (original instanceof HttpException) {
    const code = CODE_BY_STATUS[original.getStatus()];
    if (code) {
      const fields = readFields(original.getResponse());
      return {
        message: original.message,
        locations,
        path,
        extensions: fields ? { code, fields } : { code },
      };
    }
  } else if (APOLLO_CLIENT_CODES.has(formatted.extensions?.code)) {
    return {
      message,
      locations,
      path,
      extensions: { code: formatted.extensions?.code },
    };
  }

  logger.error(
    original instanceof Error ? (original.stack ?? original.message) : original,
  );
  return {
    message: "Internal server error",
    locations,
    path,
    extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
  };
}

type FieldMessages = Record<string, string[]>;

// Set by the ValidationPipe exceptionFactory in main.ts.
function readFields(response: string | object): FieldMessages | undefined {
  if (
    typeof response === "object" &&
    "fields" in response &&
    isFieldMessages(response.fields)
  ) {
    return response.fields;
  }
  return undefined;
}

function isFieldMessages(value: unknown): value is FieldMessages {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every(
      (messages) =>
        Array.isArray(messages) &&
        messages.every((message) => typeof message === "string"),
    )
  );
}
