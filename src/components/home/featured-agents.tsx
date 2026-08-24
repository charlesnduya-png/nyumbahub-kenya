import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FeaturedAgent } from "@/types/agent";

interface FeaturedAgentsProps {
  agents: FeaturedAgent[];
  title?: string;
  subtitle?: string;
}

export function FeaturedAgents({
  agents,
  title = "Featured Agents",
  subtitle = "Work with verified professionals across Kenya",
}: FeaturedAgentsProps) {
  if (agents.length === 0) {
    return null;
  }

  return (
    <section className="cv-auto py-16 sm:py-20" aria-labelledby="agents-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              id="agents-heading"
              className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>
          </div>
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/agents">
              View all agents
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <Link
                href={`/agents/${agent.slug}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
                    <Image
                      src={
                        agent.image ??
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&q=70"
                      }
                      alt={agent.name}
                      fill
                      sizes="64px"
                      quality={70}
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                      {agent.name}
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {agent.agency}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1 text-sm">
                  <Star
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                  <span className="font-medium">{agent.rating}</span>
                  <span className="text-muted-foreground">
                    ({agent.reviewCount} reviews)
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {agent.listingsCount} active listings · {agent.county}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.specialties.slice(0, 2).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Link>

              <div className="mt-4 space-y-2 border-t border-border pt-3">
                {agent.showListings ? (
                  <Link
                    href={`/agents/${agent.slug}#listings`}
                    className="block text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    View their listings
                  </Link>
                ) : (
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="block text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    View profile
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
