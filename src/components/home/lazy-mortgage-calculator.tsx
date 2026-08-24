"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const MortgageCalculator = dynamic(
  () =>
    import("@/components/home/mortgage-calculator").then((m) => ({
      default: m.MortgageCalculator,
    })),
  { ssr: false },
);

export function LazyMortgageCalculator() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {show ? (
        <MortgageCalculator />
      ) : (
        <section className="py-16 sm:py-20" aria-hidden>
          <div className="mx-auto h-96 max-w-3xl rounded-2xl bg-muted/40" />
        </section>
      )}
    </div>
  );
}
