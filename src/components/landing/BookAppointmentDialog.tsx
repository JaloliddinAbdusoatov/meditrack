"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookAppointmentDialog({ open, onOpenChange }: BookAppointmentDialogProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });

  useEffect(() => {
    if (session?.user?.name && open) {
      setForm((p) => ({ ...p, name: session.user?.name ?? p.name }));
    }
  }, [session?.user?.name, open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) {
      toast({ title: "Login required", description: "Please log in to book an appointment.", variant: "destructive" });
      return;
    }
    if (!form.name || !form.phone || !form.preferredDate || !form.preferredTime) {
      toast({ title: "Error", description: "Please fill name, phone, date and time.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          message: form.message || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.error ?? "Could not submit.", variant: "destructive" });
        setLoading(false);
        return;
      }
      toast({ title: "Appointment Request Sent", description: "We will contact you shortly." });
      setForm({ name: "", phone: "", preferredDate: "", preferredTime: "", message: "" });
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            {session?.user?.email
              ? "Your email is taken from your account. We will confirm your appointment."
              : "Log in to book an appointment. Your email will be visible to the clinic."}
          </DialogDescription>
        </DialogHeader>
        {status === "loading" ? (
          <p className="text-muted-foreground text-sm py-4">Loading...</p>
        ) : !session?.user?.email ? (
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground text-sm">
              You need to be logged in to book an appointment. Your email will be shown to the clinic automatically.
            </p>
            <Button asChild>
              <Link href="/login" onClick={() => onOpenChange(false)}>Log in</Link>
            </Button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apt-name">Full Name</Label>
            <Input
              id="apt-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apt-phone">Phone</Label>
            <Input
              id="apt-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+1 234 567 8900"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apt-date">Preferred Date</Label>
              <Input
                id="apt-date"
                type="date"
                value={form.preferredDate}
                onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-time">Preferred Time</Label>
              <Input
                id="apt-time"
                type="time"
                value={form.preferredTime}
                onChange={(e) => setForm((p) => ({ ...p, preferredTime: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apt-message">Message (optional)</Label>
            <Textarea
              id="apt-message"
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Brief reason for visit..."
              className="min-h-20"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
