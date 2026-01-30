"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const PLACEHOLDER_SRC = "https://placehold.co/600x600.png?text=MediTrack";

export function HeroCarousel() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/images")
      .then((res) => res.json())
      .then((data) => {
        setImages(data.images ?? []);
      })
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="relative w-full aspect-square max-h-[400px] md:max-h-[500px] rounded-lg overflow-hidden bg-muted animate-pulse" />
    );
  }

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-square max-h-[400px] md:max-h-[500px] rounded-lg overflow-hidden shadow-2xl">
        <Image
          src={PLACEHOLDER_SRC}
          alt="MediTrack Clinic"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    );
  }

  return (
    <Carousel
      opts={{ loop: true, align: "center" }}
      className="w-full max-w-full"
    >
      <CarouselContent className="-ml-0">
        {images.map((url) => (
          <CarouselItem key={url} className="pl-0">
            <div className="relative w-full aspect-square max-h-[400px] md:max-h-[500px] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={url}
                alt="Clinic"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2 md:left-4 h-9 w-9 bg-background/80 border-0 shadow-md hover:bg-background" />
      <CarouselNext className="right-2 md:right-4 h-9 w-9 bg-background/80 border-0 shadow-md hover:bg-background" />
    </Carousel>
  );
}
