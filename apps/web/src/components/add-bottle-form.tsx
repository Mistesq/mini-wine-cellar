"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADD_BOTTLE_MUTATION, MY_BOTTLES_QUERY } from "@/graphql/bottles";
import {
  type AddBottleFormInput,
  type AddBottleFormValues,
  addBottleSchema,
} from "@/lib/add-bottle-schema";
import { getErrorMessage, getServerFieldErrors } from "@/lib/graphql-errors";

const FIELDS = ["name", "producer", "vintage", "region", "photoUrl"] as const;

export function AddBottleForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [addBottle] = useMutation(ADD_BOTTLE_MUTATION, {
    // Prepend instead of refetching myBottles: the list is newest first.
    update(cache, { data }) {
      const bottle = data?.addBottle;
      if (!bottle) {
        return;
      }
      cache.updateQuery({ query: MY_BOTTLES_QUERY }, (existing) => {
        if (!existing) {
          return;
        }
        return { myBottles: [bottle, ...existing.myBottles] };
      });
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddBottleFormInput, unknown, AddBottleFormValues>({
    resolver: zodResolver(addBottleSchema),
    defaultValues: { name: "", producer: "", region: "", photoUrl: "" },
  });

  const onSubmit = async (input: AddBottleFormValues) => {
    setFormError(null);
    try {
      await addBottle({ variables: { input } });
      reset();
      toast.success("Bottle added");
    } catch (error) {
      const fieldErrors = getServerFieldErrors(error, FIELDS);
      if (!fieldErrors) {
        setFormError(
          getErrorMessage(
            error,
            "Could not add the bottle. Check your connection and try again.",
          ),
        );
        return;
      }
      // Focus the first invalid field in form order, so keyboard and screen
      // reader users land on the message after submitting from the button.
      let focused = false;
      for (const field of FIELDS) {
        const message = fieldErrors[field];
        if (message) {
          setError(
            field,
            { type: "server", message },
            { shouldFocus: !focused },
          );
          focused = true;
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle id="add-bottle-title" className="text-base">
          Add a bottle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          aria-labelledby="add-bottle-title"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </p>
          )}
          <FormField id="name" label="Name" error={errors.name?.message}>
            <Input
              id="name"
              autoComplete="off"
              {...fieldProps("name", errors.name?.message)}
              {...register("name")}
            />
          </FormField>
          <FormField
            id="producer"
            label="Producer"
            error={errors.producer?.message}
          >
            <Input
              id="producer"
              autoComplete="off"
              {...fieldProps("producer", errors.producer?.message)}
              {...register("producer")}
            />
          </FormField>
          <FormField
            id="vintage"
            label="Vintage"
            error={errors.vintage?.message}
          >
            <Input
              id="vintage"
              type="number"
              inputMode="numeric"
              {...fieldProps("vintage", errors.vintage?.message)}
              {...register("vintage", { valueAsNumber: true })}
            />
          </FormField>
          <FormField id="region" label="Region" error={errors.region?.message}>
            <Input
              id="region"
              autoComplete="off"
              {...fieldProps("region", errors.region?.message)}
              {...register("region")}
            />
          </FormField>
          <FormField
            id="photoUrl"
            label="Photo URL (optional)"
            error={errors.photoUrl?.message}
          >
            <Input
              id="photoUrl"
              type="url"
              inputMode="url"
              placeholder="https://"
              {...fieldProps("photoUrl", errors.photoUrl?.message)}
              {...register("photoUrl")}
            />
          </FormField>
          <Button type="submit" className="h-11" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add bottle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function fieldProps(id: string, error: string | undefined) {
  return {
    className: "h-11",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
