import type { ClinicInfo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface HeroProps {
  clinicInfo: ClinicInfo;
}

export function Hero({ clinicInfo }: HeroProps) {
  return (
    <section className="relative bg-secondary overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl font-headline">
              Welcome to {clinicInfo.name}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {clinicInfo.description}
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Button asChild size="lg">
                <Link href="#contact">Book Appointment</Link>
              </Button>
              <Button asChild variant="link" size="lg">
                <Link href="#services">Our Services &rarr;</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-80 md:h-full">
            <Image
              src="https://placehold.co/600x600.png"
              alt="Friendly doctor smiling"
              fill
              className="object-cover rounded-lg shadow-2xl"
              data-ai-hint="clinic interior"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
