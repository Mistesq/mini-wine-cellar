import { CombinedGraphQLErrors } from "@apollo/client";

// The api's formatError (D-21) sends per-field validation messages as
// extensions.fields: { [field]: string[] } on a BAD_USER_INPUT error.
export function getServerFieldErrors<Field extends string>(
  error: unknown,
  fields: readonly Field[],
): Partial<Record<Field, string>> | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const result: Partial<Record<Field, string>> = {};
  for (const graphQLError of error.errors) {
    const extensions = graphQLError.extensions;
    if (extensions?.code !== "BAD_USER_INPUT" || !isRecord(extensions.fields)) {
      continue;
    }
    for (const field of fields) {
      const messages = extensions.fields[field];
      if (Array.isArray(messages) && typeof messages[0] === "string") {
        result[field] = messages[0];
      }
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

// Server messages are already safe to show (formatError strips internals);
// anything else is a network failure. UNAUTHENTICATED means the stored user is
// gone (e.g. after a reseed), which the header's text would not tell a person.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (CombinedGraphQLErrors.is(error) && error.errors[0]) {
    if (error.errors[0].extensions?.code === "UNAUTHENTICATED") {
      return "Choose a user to open the cellar";
    }
    return error.errors[0].message;
  }
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
