"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Mail } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: number;
  email: string;
  message: string;
  appointmentId: number | null;
  createdAt: string;
  read: number;
}

export function Notifications() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [viewEmail, setViewEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (email?: string) => {
    if (!email && !session?.user?.email) return;
    setLoading(true);
    try {
      const url = email
        ? `/api/notifications?email=${encodeURIComponent(email)}`
        : "/api/notifications";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      setViewEmail(session.user.email);
      fetchNotifications(session.user.email);
    }
  }, [session?.user?.email]);

  const handleViewByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setViewEmail(emailInput.trim());
    fetchNotifications(emailInput.trim());
  };

  const markAsRead = async (id: number) => {
    const email = viewEmail || session?.user?.email;
    if (!email) return;
    try {
      await fetch(`/api/notifications/${id}/read?email=${encodeURIComponent(email)}`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
      );
    } catch {
      // ignore
    }
  };

  const displayEmail = viewEmail || session?.user?.email;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <section id="notifications" className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-headline">
              <Bell className="h-8 w-8 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription className="text-base">
              Messages from the clinic about your appointments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "loading" && !viewEmail ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : !session?.user?.email && !viewEmail ? (
              <form onSubmit={handleViewByEmail} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="notif-email" className="sr-only">
                    Your email
                  </Label>
                  <Input
                    id="notif-email"
                    type="email"
                    placeholder="your@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <Button type="submit" variant="default" disabled={loading} className="shrink-0">
                  <Mail className="mr-2 h-4 w-4" />
                  {loading ? "Loading…" : "View notifications"}
                </Button>
              </form>
            ) : null}

            {displayEmail && (
              <>
                {session?.user?.email && !viewEmail && (
                  <p className="text-sm text-muted-foreground text-center">
                    Showing notifications for {session.user.email}
                  </p>
                )}
                {!session?.user?.email && viewEmail && (
                  <p className="text-sm text-muted-foreground text-center">
                    Showing notifications for {viewEmail}
                  </p>
                )}
                {loading ? (
                  <p className="text-center text-muted-foreground">Loading...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notifications yet.
                  </p>
                ) : (
                  <ScrollArea className="h-[320px] pr-4">
                    <ul className="space-y-3">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`rounded-lg border p-4 ${
                            n.read ? "bg-muted/50" : "bg-primary/5 border-primary/20"
                          }`}
                        >
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {new Date(n.createdAt).toLocaleString()}
                            {!n.read && (
                              <span className="ml-2 text-primary text-xs">New</span>
                            )}
                          </p>
                          <p className="text-foreground whitespace-pre-wrap">{n.message}</p>
                          {!n.read && (
                            <Button
                              variant="link"
                              size="sm"
                              className="mt-2 p-0 h-auto text-muted-foreground"
                              onClick={() => markAsRead(n.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
