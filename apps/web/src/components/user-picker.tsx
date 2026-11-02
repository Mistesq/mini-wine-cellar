"use client";

import { useQuery } from "@apollo/client/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USERS_QUERY } from "@/graphql/users";
import { setCurrentUserId, useCurrentUserId } from "@/lib/current-user-store";

export function UserPicker() {
  const { data, loading, error } = useQuery(USERS_QUERY);
  const userId = useCurrentUserId();
  const isKnownUser = data?.users.some((user) => user.id === userId) ?? false;

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load users
      </p>
    );
  }

  return (
    <Select
      // Radix shows the placeholder only for "", so keep it until the stored id
      // matches an item; an id from before a reseed would leave the trigger blank.
      value={isKnownUser && userId ? userId : ""}
      onValueChange={setCurrentUserId}
      disabled={loading}
    >
      <SelectTrigger
        aria-label="Current user"
        className="w-36 data-[size=default]:h-11 sm:w-48"
      >
        <SelectValue
          placeholder={loading ? "Loading users..." : "Choose a user"}
        />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {data?.users.map((user) => (
          <SelectItem key={user.id} value={user.id} className="min-h-11">
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
