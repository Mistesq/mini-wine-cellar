import { BadRequestException, type ValidationError } from "@nestjs/common";

// The ValidationPipe exceptionFactory. formatError sends `fields` as
// extensions.fields, so the form can show each message under its field.
export function createValidationException(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    message: "Invalid input",
    fields: Object.fromEntries(
      errors.map((error) => [
        error.property,
        Object.values(error.constraints ?? {}),
      ]),
    ),
  });
}
