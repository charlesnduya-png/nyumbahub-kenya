import { Suspense } from "react";
import ComparePageClient from "./compare-client";

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12">Loading comparison…</div>}>
      <ComparePageClient />
    </Suspense>
  );
}
