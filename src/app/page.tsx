"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { Doctors } from "@/components/landing/Doctors";
import { Contact } from "@/components/landing/Contact";
import Chatbot from "@/components/Chatbot";
import { clinicInfo as defaultClinicInfo, type ClinicInfo, type Doctor, type Service } from "@/lib/data";
import { ScrollAnimation } from "@/components/ScrollAnimation";
import { BookAppointmentDialog } from "@/components/landing/BookAppointmentDialog";
import { UserAppointmentsAndMessages } from "@/components/landing/UserAppointmentsAndMessages";

export default function Home() {
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(defaultClinicInfo);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [clinicRes, servicesRes, doctorsRes] = await Promise.all([
          fetch("/api/clinic"),
          fetch("/api/services"),
          fetch("/api/doctors"),
        ]);
        if (clinicRes.ok) {
          const data = await clinicRes.json();
          if (data.name) setClinicInfo(data);
        }
        if (servicesRes.ok) setServices(await servicesRes.json());
        if (doctorsRes.ok) setDoctors(await doctorsRes.json());
      } catch {
        // keep defaults
      } finally {
        setIsDataLoaded(true);
      }
    };
    load();
  }, []);

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" suppressHydrationWarning>
        <div className="text-primary text-lg" suppressHydrationWarning>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <ScrollAnimation>
          <Hero clinicInfo={clinicInfo} onBookAppointment={() => setBookDialogOpen(true)} />
        </ScrollAnimation>
        <ScrollAnimation>
          <Services services={services} />
        </ScrollAnimation>
        <ScrollAnimation>
          <Doctors doctors={doctors} />
        </ScrollAnimation>
        <ScrollAnimation>
          <UserAppointmentsAndMessages />
        </ScrollAnimation>
        <ScrollAnimation>
          <Contact onBookAppointment={() => setBookDialogOpen(true)} />
        </ScrollAnimation>
      </main>
      <BookAppointmentDialog open={bookDialogOpen} onOpenChange={setBookDialogOpen} />
      <Chatbot clinicInfo={clinicInfo} services={services} doctors={doctors} />
      <Footer clinicInfo={clinicInfo} />
    </div>
  );
}
