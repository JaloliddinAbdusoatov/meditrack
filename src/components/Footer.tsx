import Link from "next/link";
import { Icons } from "@/components/icons";
import type { ClinicInfo } from "@/lib/data";
import { Mail, MapPin, Phone } from "lucide-react";

interface FooterProps {
  clinicInfo: ClinicInfo;
}

export function Footer({ clinicInfo }: FooterProps) {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Icons.logo className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">{clinicInfo.name}</span>
            </Link>
            <p className="text-sm text-muted-foreground">{clinicInfo.description}</p>
          </div>
          <div className="md:justify-self-center">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{clinicInfo.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`tel:${clinicInfo.phone}`} className="hover:text-primary">{clinicInfo.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a href={`mailto:${clinicInfo.email}`} className="hover:text-primary">{clinicInfo.email}</a>
              </li>
            </ul>
          </div>
          <div className="md:justify-self-end">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/#services" className="hover:text-primary">Services</Link></li>
              <li><Link href="/#doctors" className="hover:text-primary">Our Doctors</Link></li>
              <li><Link href="/#contact" className="hover:text-primary">Get in Touch</Link></li>
              <li><Link href="/login" className="hover:text-primary">Admin Panel</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {clinicInfo.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
