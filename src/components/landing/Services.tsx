"use client";

import type { Service, ServiceIcon } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stethoscope, HeartPulse, Microscope, Bone, type LucideIcon } from 'lucide-react';
import type { ComponentType } from "react";

const iconMap: Record<ServiceIcon, LucideIcon> = {
  Stethoscope,
  HeartPulse,
  Microscope,
  Bone,
};

interface ServicesProps {
  services: Service[];
}

export function Services({ services }: ServicesProps) {
  return (
    <section id="services" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-headline">
            Our Medical Services
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            We offer a wide range of services to meet your health needs. Our team is dedicated to providing the highest quality of care.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const IconComponent = iconMap[service.icon];
            return (
              <Card key={service.id} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="items-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <CardTitle className="font-headline">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  );
}