import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { createValidationException } from "./graphql/validation-exception";

// Same rule as DATABASE_URL (D-18) and NEXT_PUBLIC_API_URL (D-26): a localhost
// fallback for the local run flow, a loud failure in production.
function resolveCorsOrigin(): string {
  const origin = process.env.CORS_ORIGIN;
  if (origin) {
    return origin;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("CORS_ORIGIN must be set when NODE_ENV is production");
  }
  return "http://localhost:3000";
}

const corsOrigin = resolveCorsOrigin();

async function bootstrap() {
  // abortOnError: false, so a failed start rejects here instead of Nest exiting
  // on its own with a bare stack trace.
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  app.enableCors({
    origin: corsOrigin,
    allowedHeaders: ["content-type", "x-user-id"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createValidationException,
    }),
  );
  await app.listen(process.env.PORT ?? 4000);
}

// A refused connection arrives as an AggregateError with an empty message and
// the reason only in `code`.
function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const code = "code" in error ? String(error.code) : undefined;
  return error.message || code || error.name;
}

// A start failure is almost always the database or a taken port, so point at the fix.
bootstrap().catch((error: unknown) => {
  new Logger("Bootstrap").error(
    `Failed to start API: ${describeError(error)}. Is Postgres running? See README Troubleshooting`,
  );
  process.exit(1);
});
