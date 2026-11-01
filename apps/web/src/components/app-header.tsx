import { UserPicker } from "@/components/user-picker";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <span className="truncate text-lg font-semibold text-primary">
          Mini Wine Cellar
        </span>
        <UserPicker />
      </div>
    </header>
  );
}
