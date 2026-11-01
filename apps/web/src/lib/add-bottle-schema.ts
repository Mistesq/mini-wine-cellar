import { BOTTLE_LIMITS, getMaxVintage } from "@mini-wine-cellar/shared";
import { z } from "zod";

const HTTPS_PREFIX = /^https:\/\//i;

function requiredText(label: string) {
  return z
    .string()
    .trim()
    .min(BOTTLE_LIMITS.text.min, { error: `${label} is required` })
    .max(BOTTLE_LIMITS.text.max, {
      error: `${label} must be at most ${BOTTLE_LIMITS.text.max} characters`,
    });
}

// Zod still runs the refines below after z.url fails; that failure has its own
// message, so an unparseable value passes them.
function checkParsedUrl(check: (url: URL) => boolean) {
  return (value: string) => !URL.canParse(value) || check(new URL(value));
}

const hasNoCredentials = checkParsedUrl(
  (url) => url.username === "" && url.password === "",
);

// The api's IsUrl requires a top-level domain (require_tld), so "localhost" fails there.
const hasDottedHostname = checkParsedUrl((url) => url.hostname.includes("."));

// Mirrors the api's AddBottleInput (D-24) so the form rejects what the server would.
const photoUrlSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .pipe(
    z
      .url({
        protocol: /^https$/,
        error: (issue) =>
          HTTPS_PREFIX.test(String(issue.input))
            ? "Photo URL must be a valid URL"
            : "Photo URL must start with https://",
      })
      // The URL parser also accepts "https:example.com"; the api requires "://".
      .regex(HTTPS_PREFIX, { error: "Photo URL must start with https://" })
      .max(BOTTLE_LIMITS.photoUrl.max, {
        error: `Photo URL must be at most ${BOTTLE_LIMITS.photoUrl.max} characters`,
      })
      .refine(hasDottedHostname, {
        error: "Photo URL must use a full domain name, like example.com",
      })
      .refine(hasNoCredentials, {
        error: "Photo URL must not contain a username or password",
      })
      .optional(),
  );

const vintageSchema = z
  .number({ error: "Vintage is required" })
  .int({ error: "Vintage must be a whole number" })
  // A function, not .max(getMaxVintage()), so the year is read on every validation.
  .refine(
    (vintage) =>
      vintage >= BOTTLE_LIMITS.vintage.min && vintage <= getMaxVintage(),
    {
      error: () =>
        `Vintage must be between ${BOTTLE_LIMITS.vintage.min} and ${getMaxVintage()}`,
    },
  );

export const addBottleSchema = z.object({
  name: requiredText("Name"),
  producer: requiredText("Producer"),
  vintage: vintageSchema,
  region: requiredText("Region"),
  photoUrl: photoUrlSchema,
});

export type AddBottleFormInput = z.input<typeof addBottleSchema>;
export type AddBottleFormValues = z.output<typeof addBottleSchema>;
