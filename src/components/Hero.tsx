"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const banners = [
  {
    id: 1,
    title: "KSN Fresh Groceries",
    description: "Daily essentials and premium groceries delivered to your doorstep.",
    image: "/images/banner_groceries.png",
    ctaText: "Shop Groceries",
    ctaLink: "/categories/groceries-staples"
  },
  {
    id: 2,
    title: "Beauty & Fashion",
    description: "Experience the premium collection of clothing and accessories.",
    image: "/images/banner_fashion.png",
    ctaText: "Shop Fashion",
    ctaLink: "/categories/beauty-fashion"
  },
  {
    id: 3,
    title: "Premium Electronics",
    description: "Latest gadgets and home appliances for your modern lifestyle.",
    image: "/images/banner_electronics.png",
    ctaText: "View Gadgets",
    ctaLink: "/categories/mobiles-electronics"
  }
];


export default function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="overflow-hidden rounded-3xl shadow-2xl relative" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div className="relative flex-[0_0_100%] min-w-0 h-[400px] md:h-[500px] lg:h-[600px]" key={banner.id}>
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover"
                priority={banner.id === 1}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-8 md:px-16 lg:px-24">
                <div className="max-w-xl text-white">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 drop-shadow-xl leading-tight tracking-tight">
                    {banner.title}
                  </h2>
                  <p className="text-lg md:text-xl lg:text-2xl mb-8 drop-shadow-lg text-gray-200 font-medium">
                    {banner.description}
                  </p>
                  <Link
                    href={banner.ctaLink}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-white rounded-full hover:bg-gray-100 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
                  >
                    {banner.ctaText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        <button
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all z-10 group border border-white/20"
          onClick={scrollPrev}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
        </button>
        <button
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all z-10 group border border-white/20"
          onClick={scrollNext}
          aria-label="Next slide"
        >
          <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-10 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === selectedIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
