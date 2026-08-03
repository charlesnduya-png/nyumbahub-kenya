"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

import type { MockTestimonial } from "@/data/mock";

interface TestimonialsProps {
  testimonials: MockTestimonial[];
  title?: string;
  subtitle?: string;
}

export function Testimonials({
  testimonials,
  title = "What Our Users Say",
  subtitle = "Trusted by thousands of buyers, sellers, and agents across Kenya",
}: TestimonialsProps) {
  return (
    <section
      className="gradient-mesh py-16 sm:py-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2
            id="testimonials-heading"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.blockquote
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <Quote
                className="absolute right-5 top-5 h-8 w-8 text-primary/15"
                aria-hidden="true"
              />
              <div
                className="flex gap-0.5"
                aria-label={`${testimonial.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <footer className="mt-6 flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.avatar}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <cite className="not-italic font-semibold text-foreground">
                    {testimonial.name}
                  </cite>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} · {testimonial.location}
                  </p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
