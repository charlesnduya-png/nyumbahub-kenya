import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CtaSectionProps {
  title?: string;
  subtitle?: string;
}

export function CtaSection({
  title = "Sell or rent with a professional account",
  subtitle = "Create a free professional account, list up to 5 properties, and go live after Your Home admin approval.",
}: CtaSectionProps) {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)",
            }}
          />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Building2 className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <h2
              id="cta-heading"
              className="font-display mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">{subtitle}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-xl bg-white text-primary hover:bg-white/90 dark:bg-white dark:text-primary dark:hover:bg-white/90"
                asChild
              >
                <Link href="/register/professional">
                  Open free professional account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-white/50 bg-white/5 text-white hover:bg-white/15 hover:text-white dark:border-white/50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                asChild
              >
                <Link href="/dashboard/seller/properties/new">List a property</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
