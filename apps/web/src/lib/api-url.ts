const DEV_API_URL = "http://localhost:4000/graphql";

// Takes the values instead of reading process.env so callers keep the literal
// process.env.NEXT_PUBLIC_API_URL reference that Next inlines into the bundle.
export function resolveApiUrl(
  apiUrl: string | undefined,
  nodeEnv: string | undefined,
): string {
  if (apiUrl) {
    return apiUrl;
  }
  if (nodeEnv === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be set when NODE_ENV is production",
    );
  }
  return DEV_API_URL;
}
