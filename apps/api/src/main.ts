import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowedHeaders: ["content-type", "x-user-id"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // formatError sends `fields` as extensions.fields, so the form can show each message under its field.
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: "Invalid input",
          fields: Object.fromEntries(
            errors.map((error) => [
              error.property,
              Object.values(error.constraints ?? {}),
            ]),
          ),
        }),
    }),
  );
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
