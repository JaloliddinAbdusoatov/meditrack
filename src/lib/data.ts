import type { LucideIcon } from 'lucide-react';

export type ServiceIcon = "Stethoscope" | "HeartPulse" | "Microscope" | "Bone";

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: ServiceIcon;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  education: string;
  bio: string;
  imageUrl: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
}

export const clinicInfo: ClinicInfo = {
  name: "MediTrack Clinic",
  address: "123 Health St, Wellness City, 45678",
  phone: "(123) 456-7890",
  email: "contact@meditrack.clinic",
  description: "Providing compassionate and comprehensive healthcare for our community. Our experienced team is dedicated to your well-being, offering a wide range of medical services in a modern and welcoming environment.",
};

export const services: Service[] = [
  {
    id: "s1",
    name: "General Practice",
    description: "Comprehensive primary care for all ages, including routine check-ups, and managing chronic conditions.",
    icon: "Stethoscope",
  },
  {
    id: "s2",
    name: "Cardiology",
    description: "Specialized care for heart and blood vessel conditions, including diagnostics and treatment plans.",
    icon: "HeartPulse",
  },
  {
    id: "s3",
    name: "Diagnostics Lab",
    description: "Advanced laboratory services for accurate and timely diagnosis, using state-of-the-art equipment.",
    icon: "Microscope",
  },
  {
    id: "s4",
    name: "Orthopedics",
    description: "Treatment for injuries and diseases of your body's musculoskeletal system.",
    icon: "Bone",
  },
];

export const doctors: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Evelyn Reed",
    specialization: "Cardiologist",
    education: "MD from Stanford University",
    bio: "Dr. Reed has over 15 years of experience in cardiology and is a leader in preventative heart care and advanced cardiac imaging.",
    imageUrl: "https://placehold.co/400x400",
  },
  {
    id: "d2",
    name: "Dr. Marcus Chen",
    specialization: "General Practitioner",
    education: "MD from Johns Hopkins University",
    bio: "Dr. Chen is a dedicated family physician known for his compassionate approach and commitment to long-term patient relationships.",
    imageUrl: "https://placehold.co/400x400",
  },
  {
    id: "d3",
    name: "Dr. Sofia Garcia",
    specialization: "Orthopedic Surgeon",
    education: "MD from Harvard Medical School",
    bio: "Dr. Garcia specializes in sports medicine and minimally invasive surgery, helping patients return to their active lifestyles.",
    imageUrl: "https://placehold.co/400x400",
  },
];

    