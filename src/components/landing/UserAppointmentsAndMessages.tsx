"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, MessageSquare, Send } from "lucide-react";
import type { Appointment } from "@/lib/db";

interface Notification {
  id: number;
  email: string;
  message: string;
  appointmentId: number | null;
  createdAt: string;
  read: number;
}

export function UserAppointmentsAndMessages() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<(Appointment & { status?: string; rescheduledDate?: string | null; rescheduledTime?: string | null })[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingApt, setLoadingApt] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [messageToAdmin, setMessageToAdmin] = useState("");
  const [phoneToAdmin, setPhoneToAdmin] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) return;
    setLoadingApt(true);
    fetch("/api/appointments/mine", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoadingApt(false));
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) return;
    setLoadingNotif(true);
    fetch(`/api/notifications?email=${encodeURIComponent(session.user.email)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoadingNotif(false));
  }, [session?.user?.email]);

  const sendMessageToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageToAdmin.trim() || !phoneToAdmin.trim()) return;
    setSendingMessage(true);
    setMessageSent(false);
    try {
      const res = await fetch("/api/user-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: phoneToAdmin.trim(),
          message: messageToAdmin.trim(),
        }),
      });
      if (res.ok) {
        setMessageToAdmin("");
        setPhoneToAdmin("");
        setMessageSent(true);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  if (status === "loading" || !session?.user?.email) return null;

  return (
    <section id="my-appointments" className="py-16 sm:py-24 bg-secondary/50">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-primary font-headline mb-8">
          My Appointments & Messages
        </h2>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                My Appointments
              </CardTitle>
              <CardDescription>
                Status of your appointment requests. You will also see messages from the clinic in the panel on the right.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingApt ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : appointments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No appointments yet. Book one from the button above.</p>
              ) : (
                <ScrollArea className="h-[280px] pr-4">
                  <ul className="space-y-3">
                    {appointments.map((apt) => {
                      const status = apt.status ?? "pending";
                      const rescheduledDate = apt.rescheduledDate;
                      const rescheduledTime = apt.rescheduledTime;
                      const displayDate = rescheduledDate ?? apt.preferredDate;
                      const displayTime = rescheduledTime ?? apt.preferredTime;
                      return (
                        <li
                          key={apt.id}
                          className="rounded-lg border p-3 text-sm bg-background"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge
                              variant={
                                status === "accepted"
                                  ? "default"
                                  : status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {status}
                            </Badge>
                            {(rescheduledDate ?? rescheduledTime) && (
                              <span className="text-xs text-muted-foreground">(rescheduled)</span>
                            )}
                          </div>
                          <p className="font-medium">
                            {displayDate} {displayTime}
                          </p>
                          {apt.message && (
                            <p className="text-muted-foreground text-xs mt-1 truncate" title={apt.message}>
                              {apt.message}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Messages from Clinic
              </CardTitle>
              <CardDescription>
                Updates about your appointments (confirmed, rescheduled, or other messages).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNotif ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-muted-foreground text-sm">No messages yet.</p>
              ) : (
                <ScrollArea className="h-[280px] pr-4">
                  <ul className="space-y-3">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`rounded-lg border p-3 text-sm ${
                          n.read
                            ? "bg-muted/40 border-border text-muted-foreground"
                            : "bg-primary/10 border-primary/30 border-l-4 border-l-primary font-medium text-foreground"
                        }`}
                      >
                        <p className="text-xs mb-1 flex items-center gap-1">
                          <span className={n.read ? "text-muted-foreground" : "text-primary"}>
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                          {!n.read && (
                            <span className="text-primary font-semibold">New</span>
                          )}
                        </p>
                        <p className={`whitespace-pre-wrap break-words ${n.read ? "text-muted-foreground" : ""}`}>{n.message}</p>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5" />
              Send message to clinic
            </CardTitle>
            <CardDescription>
              Send a message to the clinic. Your email is taken from your account; enter your phone number so the clinic can contact you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendMessageToAdmin} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="phone-to-admin">Phone number</Label>
                <Input
                  id="phone-to-admin"
                  type="tel"
                  value={phoneToAdmin}
                  onChange={(e) => setPhoneToAdmin(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  required
                  className="max-w-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-to-admin">Message</Label>
                <Textarea
                  id="message-to-admin"
                  value={messageToAdmin}
                  onChange={(e) => setMessageToAdmin(e.target.value)}
                  placeholder="e.g. I confirm the new time. / I have a question about my appointment..."
                  className="min-h-24"
                  required
                />
              </div>
              <Button type="submit" disabled={sendingMessage || !messageToAdmin.trim() || !phoneToAdmin.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {sendingMessage ? "Sending…" : "Send to clinic"}
              </Button>
              {messageSent && <p className="text-sm text-primary">Message sent. The clinic will see it in the admin panel.</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
