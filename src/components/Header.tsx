"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Shield } from "lucide-react";
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/#services", label: "Services" },
    { href: "/#doctors", label: "Doctors" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">MediTrack</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {pathname === '/' && navLinks.map(link => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </Link>
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-6 pt-6">
              <Link href="/" className="flex items-center gap-2">
                <Icons.logo className="h-6 w-6 text-primary" />
                <span className="font-bold">MediTrack</span>
              </Link>
              <div className="grid gap-4">
                {pathname === '/' && navLinks.map(link => (
                  <Link key={link.href} href={link.href} className="font-medium transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                ))}
              </div>
              <Button variant="default" asChild>
                <Link href="/login">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
