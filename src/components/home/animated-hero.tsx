"use client";

import Image from "next/image";
import { MapPin, ShieldCheck } from "lucide-react";
import * as React from "react";

import { HeroSearch } from "@/components/home/hero-search";
import { CurrencySwitcher } from "@/components/currency/currency-switcher";
import { useDisplayCurrency } from "@/components/currency/currency-provider";

const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=70",
    alt: "Luxury villa with pool in Kenya",
    label: "Runda · Villa",
    price: 85000000,
  },
  {
    src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=70",
    alt: "Modern apartment interior in Nairobi",
    label: "Kilimani · Apartment",
    price: 18500000,
  },
  {
    src: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=70",
    alt: "Beachfront holiday home in Diani",
    label: "Diani · Holiday Home",
    price: 25000,
  },
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=70",
    alt: "Contemporary family home exterior",
    label: "Karen · House",
    price: 65000000,
  },
  {
    src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=70",
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
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=200&q=70",
    className: "left-[6%] top-[22%]",
  },
  {
    title: "Diani Beach Villa",
    place: "Kwale",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=200&q=70",
    className: "right-[5%] top-[28%]",
  },
  {
    title: "Runda Estate",
    place: "Nairobi",
    price: 85000000,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=200&q=70",
    className: "right-[10%] bottom-[18%]",
  },
];

const SLIDE_MS = 5500;

export function AnimatedHero() {
  const [index, setIndex] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [wide, setWide] = React.useState(false);
  const { formatConvertedPrice } = useDisplayCurrency();

  React.useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wideMq = window.matchMedia("(min-width: 1024px)");
    setReducedMotion(motionMq.matches);
    setWide(wideMq.matches);
    const onMotion = () => setReducedMotion(motionMq.matches);
    const onWide = () => setWide(wideMq.matches);
    motionMq.addEventListener("change", onMotion);
    wideMq.addEventListener("change", onWide);
    return () => {
      motionMq.removeEventListener("change", onMotion);
      wideMq.removeEventListener("change", onWide);
    };
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
      className="relative flex min-h-[78dvh] items-end overflow-hidden pb-8 pt-24 sm:min-h-[85vh] sm:items-center sm:pb-16 sm:pt-24 lg:min-h-[92vh]"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div
          key={slide.src}
          className={`absolute inset-0 ${reducedMotion ? "" : "hero-zoom"}`}
        >
          <Image
            src={slide.src}
            alt=""
            fill
            priority={index === 0}
            fetchPriority={index === 0 ? "high" : "auto"}
            quality={70}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1400px"
            className="object-cover"
          />
        </div>

        <div className="hero-overlay absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      {wide
        ? FLOATING_CARDS.map((card) => (
            <div
              key={card.title}
              className={`absolute z-20 hidden items-center gap-3 rounded-2xl border border-white/25 bg-white/15 p-2.5 shadow-2xl backdrop-blur-xl lg:flex ${card.className} ${
                reducedMotion ? "" : "animate-float-soft"
              }`}
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                <Image
                  src={card.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  quality={65}
                  loading="lazy"
                />
              </div>
              <div className="pr-2">
                <p className="text-sm font-semibold text-white">{card.title}</p>
                <p className="flex items-center gap-1 text-xs text-white/75">
                  <MapPin className="h-3 w-3" />
                  {card.place}
                </p>
                <p className="mt-0.5 text-xs font-medium text-emerald-200">
                  {formatConvertedPrice(card.price, "KES")}
                </p>
              </div>
            </div>
          ))
        : null}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden />
            Verified homes across Africa
          </div>

          <h1
            id="hero-heading"
            className="font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl lg:leading-[1.05]"
          >
            Find your{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-200 via-white to-teal-200 bg-clip-text text-transparent">
                perfect home
              </span>
              <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-200" />
            </span>{" "}
            in Africa
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Browse verified listings from Nairobi to Lagos, Accra, Cape Town,
            and every African country — buy, rent, or book a BnB.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-xs text-white/90 backdrop-blur-md sm:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Now showing · {slide.label} · {formatConvertedPrice(slide.price, "KES")}
            </div>
            <CurrencySwitcher variant="hero" />
          </div>
        </div>

        <div className="mx-auto mt-8 flex justify-center sm:mt-10">
          <HeroSearch />
        </div>

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
