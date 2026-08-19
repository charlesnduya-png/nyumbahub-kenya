import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyDetailLoading() {
  return (
    <div className="min-h-dvh bg-background pb-32 lg:pb-0">
      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-9 w-full max-w-xl" />
          <Skeleton className="h-5 w-48" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Skeleton className="aspect-[16/9] w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <aside className="space-y-4">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </aside>
        </div>
      </main>
    </div>
  );
}
