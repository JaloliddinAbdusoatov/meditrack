"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Shield, User, LogOut, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useState, useEffect, useCallback } from "react";

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.email) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(session.user.email)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.filter((n: { read?: number }) => !n.read).length : 0;
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    } catch {
      setUnreadCount(0);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!notificationsOpen && session?.user?.email) {
      fetchUnreadCount();
    }
  }, [notificationsOpen, session?.user?.email, fetchUnreadCount]);

  const navLinks = [
    { href: "/#services", label: "Services" },
    { href: "/#doctors", label: "Doctors" },
    { href: "/#contact", label: "Contact" },
  ];

  const authButtons = (
    <>
      {status === "loading" ? (
        <Button variant="outline" size="sm" disabled>
          Loading…
        </Button>
      ) : session ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              {session.user?.email ?? session.user?.name ?? "Account"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {session.user?.role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/register">Register</Link>
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">MediTrack</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {pathname === "/" &&
            navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
                className={`relative ${unreadCount > 0 ? "text-primary border-primary/50 bg-primary/5" : ""}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle className="sr-only">Notifications</SheetTitle>
              </SheetHeader>
              <NotificationsPanel onMarkAsRead={fetchUnreadCount} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">{authButtons}</div>
        </nav>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 pt-6">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                <Icons.logo className="h-6 w-6 text-primary" />
                <span className="font-bold">MediTrack</span>
              </Link>
              <div className="grid gap-4">
                {pathname === "/" &&
                  navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="font-medium transition-colors hover:text-primary"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className={`w-full justify-center md:hidden relative ${unreadCount > 0 ? "text-primary border-primary/50 bg-primary/5" : ""}`}
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
                onClick={() => {
                  setMenuOpen(false);
                  setNotificationsOpen(true);
                }}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              <div className="flex flex-col gap-2">{authButtons}</div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
