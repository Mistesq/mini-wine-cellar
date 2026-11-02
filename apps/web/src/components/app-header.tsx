import { WineIcon } from "lucide-react";
import { UserPicker } from "@/components/user-picker";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <span className="flex min-w-0 items-center gap-2 text-lg font-semibold text-primary">
          <WineIcon className="size-5 shrink-0" aria-hidden />
          <span className="truncate">Mini Wine Cellar</span>
        </span>
        <UserPicker />
      </div>
    </header>
  );
}
