import { BOTTLE_LIMITS, getMaxVintage } from "@mini-wine-cellar/shared";
import { Field, InputType, Int } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Min,
  Validate,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// An empty optional field means "no photo", so @IsOptional skips it instead of IsUrl rejecting "".
const trimToUndefined = (params: { value: unknown }) => {
  const value = trim(params);
  return value === "" ? undefined : value;
};

// @Max(getMaxVintage()) would freeze the year at boot; this reads it on every validation.
@ValidatorConstraint({ name: "maxVintage" })
class MaxVintageConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === "number" && value <= getMaxVintage();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must not be greater than ${getMaxVintage()}`;
  }
}

@InputType()
export class AddBottleInput {
  @Field()
  @Transform(trim)
  @IsString()
  @Length(BOTTLE_LIMITS.text.min, BOTTLE_LIMITS.text.max)
  name: string;

  @Field()
  @Transform(trim)
  @IsString()
  @Length(BOTTLE_LIMITS.text.min, BOTTLE_LIMITS.text.max)
  producer: string;

  @Field(() => Int)
  @IsInt()
  @Min(BOTTLE_LIMITS.vintage.min)
  @Validate(MaxVintageConstraint)
  vintage: number;

  @Field()
  @Transform(trim)
  @IsString()
  @Length(BOTTLE_LIMITS.text.min, BOTTLE_LIMITS.text.max)
  region: string;

  @Field(() => String, { nullable: true })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsUrl(
    // No credentials in the URL: the web renders it as an <img> for anyone who owns the bottle.
    { protocols: ["https"], require_protocol: true, disallow_auth: true },
    { message: "photoUrl must be an https:// URL" },
  )
  @MaxLength(BOTTLE_LIMITS.photoUrl.max)
  photoUrl?: string;
}
