
"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/landing/Hero';
import { Services } from '@/components/landing/Services';
import { Doctors } from '@/components/landing/Doctors';
import { Contact } from '@/components/landing/Contact';
import Chatbot from '@/components/Chatbot';
import { clinicInfo as defaultClinicInfo, doctors as defaultDoctors, services as defaultServices, type ClinicInfo, type Doctor, type Service } from '@/lib/data';
import { ScrollAnimation } from '@/components/ScrollAnimation';

export default function Home() {
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(defaultClinicInfo);
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [doctors, setDoctors] = useState<Doctor[]>(defaultDoctors);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedClinicInfo = localStorage.getItem('clinicInfo');
      if (storedClinicInfo) {
        setClinicInfo(JSON.parse(storedClinicInfo));
      }

      const storedServices = localStorage.getItem('services');
      if (storedServices) {
        setServices(JSON.parse(storedServices));
      }

      const storedDoctors = localStorage.getItem('doctors');
      if (storedDoctors) {
        setDoctors(JSON.parse(storedDoctors));
      }
    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
    } finally {
        setIsDataLoaded(true);
    }
  }, []);

  if (!isDataLoaded) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-primary text-lg">Loading Clinic Data...</div>
        </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <ScrollAnimation>
            <Hero clinicInfo={clinicInfo} />
        </ScrollAnimation>
        <ScrollAnimation>
            <Services services={services} />
        </ScrollAnimation>
        <ScrollAnimation>
            <Doctors doctors={doctors} />
        </ScrollAnimation>
        <ScrollAnimation>
            <Contact />
        </ScrollAnimation>
      </main>
      <Chatbot clinicInfo={clinicInfo} services={services} doctors={doctors} />
      <Footer clinicInfo={clinicInfo} />
    </div>
  );
}
