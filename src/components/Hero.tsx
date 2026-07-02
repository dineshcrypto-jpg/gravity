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
    title: "KSN Homemade Specials",
    description: "Authentic, traditional homemade snacks and spices prepared with purity and love.",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=1200&h=600&auto=format&fit=crop",
    ctaText: "Shop Homemade",
    ctaLink: "/categories/ksn-homemade"
  }
];


export default function Hero({ className }: { className?: string }) {
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
    <div className={className || "relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6"}>
      <div className="overflow-hidden rounded-3xl shadow-2xl relative" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div className="relative flex-[0_0_100%] min-w-0 h-[180px] sm:h-[240px] md:h-[280px] lg:h-[320px]" key={banner.id}>
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover"
                priority={banner.id === 1}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-20">
                <div className="max-w-xl text-white">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 md:mb-3 drop-shadow-xl leading-tight tracking-tight">
                    {banner.title}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg mb-4 md:mb-6 drop-shadow-lg text-gray-200 font-medium line-clamp-2 sm:line-clamp-none">
                    {banner.description}
                  </p>
                  <Link
                    href={banner.ctaLink}
                    className="inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm md:text-base font-bold text-black bg-white rounded-full hover:bg-gray-100 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transform hover:-translate-y-0.5"
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
          className="absolute left-3 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all z-10 group border border-white/20"
          onClick={scrollPrev}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <button
          className="absolute right-3 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all z-10 group border border-white/20"
          onClick={scrollNext}
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === selectedIndex ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
