import type { Doctor } from "@/lib/data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface DoctorsProps {
  doctors: Doctor[];
}

export function Doctors({ doctors }: DoctorsProps) {
  return (
    <section id="doctors" className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-headline">
            Meet Our Experienced Doctors
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Our team of dedicated professionals is here to provide you with the best possible care.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0">
                <div className="relative h-64 w-full">
                  <Image
                    src={doctor.imageUrl}
                    alt={`Photo of ${doctor.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint="doctor portrait"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="font-headline text-xl">{doctor.name}</CardTitle>
                <p className="text-md font-semibold text-primary mt-1">{doctor.specialization}</p>
                <p className="text-sm text-muted-foreground mt-2">{doctor.education}</p>
                <p className="text-sm mt-4">{doctor.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
