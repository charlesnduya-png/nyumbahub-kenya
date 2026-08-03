"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, ShieldCheck } from "lucide-react";
import * as React from "react";

import { HeroSearch } from "@/components/home/hero-search";
import { formatPrice } from "@/lib/utils";

const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1920&q=80",
    alt: "Luxury villa with pool in Kenya",
    label: "Runda · Villa",
    price: 85000000,
  },
  {
    src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1920&q=80",
    alt: "Modern apartment interior in Nairobi",
    label: "Kilimani · Apartment",
    price: 18500000,
  },
  {
    src: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1920&q=80",
    alt: "Beachfront holiday home in Diani",
    label: "Diani · Holiday Home",
    price: 25000,
  },
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80",
    alt: "Contemporary family home exterior",
    label: "Karen · House",
    price: 65000000,
  },
  {
    src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80",
    alt: "Bright city apartment living space",
    label: "Westlands · Rent",
    price: 95000,
  },
];

const FLOATING_CARDS = [
  {
    title: "Kilimani Heights",
    place: "Nairobi",
    price: 18500000,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80",
    delay: 0.4,
    className: "hidden lg:flex left-[6%] top-[22%]",
  },
  {
    title: "Diani Beach Villa",
    place: "Kwale",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=400&q=80",
    delay: 0.65,
    className: "hidden lg:flex right-[5%] top-[28%]",
  },
  {
    title: "Runda Estate",
    place: "Nairobi",
    price: 85000000,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80",
    delay: 0.9,
    className: "hidden xl:flex right-[10%] bottom-[18%]",
  },
];

const SLIDE_MS = 5500;

export function AnimatedHero() {
  const [index, setIndex] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const slide = HERO_SLIDES[index];

  return (
    <section
      className="relative flex min-h-[92vh] items-end overflow-hidden pb-10 pt-28 sm:items-center sm:pb-16 sm:pt-24"
      aria-labelledby="hero-heading"
    >
      {/* Animated background slides */}
      <div className="absolute inset-0" aria-hidden="true">
        <AnimatePresence mode="sync">
          <motion.div
            key={slide.src}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : 1.1, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0"
              initial={reducedMotion ? false : { scale: 1.08 }}
              animate={reducedMotion ? { scale: 1 } : { scale: 1 }}
              transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
            >
              <Image
                src={slide.src}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="hero-overlay absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      {/* Floating mini property cards */}
      {FLOATING_CARDS.map((card) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{
            opacity: 1,
            y: [0, -10, 0],
            scale: 1,
          }}
          transition={{
            opacity: { delay: card.delay, duration: 0.6 },
            scale: { delay: card.delay, duration: 0.6 },
            y: {
              delay: card.delay + 0.6,
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className={`absolute z-20 items-center gap-3 rounded-2xl border border-white/25 bg-white/15 p-2.5 shadow-2xl backdrop-blur-xl ${card.className}`}
        >
          <div className="relative h-14 w-14 overflow-hidden rounded-xl">
            <Image src={card.image} alt="" fill className="object-cover" sizes="56px" />
          </div>
          <div className="pr-2">
            <p className="text-sm font-semibold text-white">{card.title}</p>
            <p className="flex items-center gap-1 text-xs text-white/75">
              <MapPin className="h-3 w-3" />
              {card.place}
            </p>
            <p className="mt-0.5 text-xs font-medium text-emerald-200">
              {formatPrice(card.price)}
            </p>
          </div>
        </motion.div>
      ))}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden />
            Verified homes across Kenya
          </motion.div>

          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl lg:leading-[1.05]"
          >
            Find your{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-200 via-white to-teal-200 bg-clip-text text-transparent">
                perfect home
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-emerald-300 to-teal-200"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
              />
            </span>{" "}
            in Kenya
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg"
          >
            Browse animated, verified listings from Nairobi to the coast —
            buy, rent, or invest with confidence.
          </motion.p>

          {/* Live slide caption */}
          <motion.div
            key={slide.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-xs text-white/90 backdrop-blur-md sm:text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Now showing · {slide.label} · {formatPrice(slide.price)}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mx-auto mt-8 flex justify-center sm:mt-10"
        >
          <HeroSearch />
        </motion.div>

        {/* Slide dots */}
        <div
          className="mt-8 flex justify-center gap-2"
          role="tablist"
          aria-label="Hero image slides"
        >
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${s.label}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
