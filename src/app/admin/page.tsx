"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { clinicInfo as defaultClinicInfo, type ClinicInfo, type Doctor, type Service } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Upload, UserPlus, Calendar, Check, X, Clock, MessageSquare, Send, Inbox, UserCog, UserMinus } from "lucide-react";
import Image from "next/image";
import type { Appointment } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const canAddAdmins = (session?.user as { canAddAdmins?: number })?.canAddAdmins === 1;

  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(defaultClinicInfo);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingClinic, setSavingClinic] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setServiceDialogOpen] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDoctorDialogOpen, setDoctorDialogOpen] = useState(false);

  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", name: "", canAddAdmins: 0 });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminsList, setAdminsList] = useState<{ id: string; email: string; name: string; role: string; canAddAdmins: number }[]>([]);
  const [sentMessages, setSentMessages] = useState<{ id: number; email: string; message: string; appointmentId: number | null; createdAt: string }[]>([]);
  const [messagesFromUsers, setMessagesFromUsers] = useState<{ id: number; email: string; message: string; appointmentId: number | null; createdAt: string }[]>([]);
  const [replyToUserMessage, setReplyToUserMessage] = useState<{ email: string; appointmentId: number | null } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [profileForm, setProfileForm] = useState({ email: "", password: "", name: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; email: string } | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const MAIN_ADMIN_EMAIL = "admin@meditrack.clinic";

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "", message: "" });
  const [messageForm, setMessageForm] = useState("");
  const [updatingApt, setUpdatingApt] = useState(false);

  const [acceptApt, setAcceptApt] = useState<Appointment | null>(null);
  const [acceptMessage, setAcceptMessage] = useState("");
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [rejectApt, setRejectApt] = useState<Appointment | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [clinicRes, servicesRes, doctorsRes, appointmentsRes] = await Promise.all([
        fetch("/api/clinic"),
        fetch("/api/services"),
        fetch("/api/doctors"),
        fetch("/api/appointments"),
      ]);
      if (clinicRes.ok) {
        const data = await clinicRes.json();
        if (data.name) setClinicInfo(data);
      }
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (doctorsRes.ok) setDoctors(await doctorsRes.json());
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
    } catch {
      toast({ title: "Error", description: "Could not load data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/images");
      if (res.ok) {
        const data = await res.json();
        setImages(data.images ?? []);
      }
    } catch {
      setImages([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (!canAddAdmins) return;
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAdminsList)
      .catch(() => setAdminsList([]));
  }, [canAddAdmins]);

  const fetchMessagesForAdmin = useCallback(async () => {
    if (session?.user?.role !== "admin") return;
    try {
      const [sentRes, fromUsersRes] = await Promise.all([
        fetch("/api/notifications?sent=1", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/messages-from-users", { credentials: "include", cache: "no-store" }),
      ]);
      const sent = sentRes.ok ? await sentRes.json() : [];
      const fromUsers = fromUsersRes.ok ? await fromUsersRes.json() : [];
      setSentMessages(Array.isArray(sent) ? sent : []);
      setMessagesFromUsers(Array.isArray(fromUsers) ? fromUsers : []);
    } catch {
      setSentMessages([]);
      setMessagesFromUsers([]);
    }
  }, [session?.user?.role]);

  useEffect(() => {
    fetchMessagesForAdmin();
  }, [fetchMessagesForAdmin]);

  useEffect(() => {
    if (canAddAdmins && session?.user?.email) {
      setProfileForm((p) => ({ ...p, email: session.user?.email ?? p.email, name: session.user?.name ?? p.name }));
    }
  }, [canAddAdmins, session?.user?.email, session?.user?.name]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.password || !newAdmin.name) {
      toast({ title: "Error", description: "Fill all fields.", variant: "destructive" });
      return;
    }
    if (newAdmin.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setAddingAdmin(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdmin.email,
          password: newAdmin.password,
          name: newAdmin.name,
          canAddAdmins: newAdmin.canAddAdmins ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to add admin.", variant: "destructive" });
        setAddingAdmin(false);
        return;
      }
      toast({ title: "Admin Added", description: `${data.email} is now an admin.` });
      setNewAdmin({ email: "", password: "", name: "", canAddAdmins: 0 });
      setAdminsList((prev) => [...prev, { id: data.id, email: data.email, name: data.name, role: data.role, canAddAdmins: data.canAddAdmins ?? 0 }]);
    } catch {
      toast({ title: "Error", description: "Failed to add admin.", variant: "destructive" });
    }
    setAddingAdmin(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.email?.trim()) {
      toast({ title: "Error", description: "Email is required.", variant: "destructive" });
      return;
    }
    if (profileForm.password && profileForm.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      const body: { email?: string; password?: string; name?: string } = { email: profileForm.email.trim(), name: profileForm.name.trim() };
      if (profileForm.password.trim()) body.password = profileForm.password;
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to update profile.", variant: "destructive" });
        setSavingProfile(false);
        return;
      }
      toast({ title: "Profile updated", description: "Email and password updated. You may need to log in again." });
      setProfileForm((p) => ({ ...p, password: "" }));
    } catch {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
    setSavingProfile(false);
  };

  const handleChangeRole = async (id: string, role: "admin" | "user") => {
    if (updatingRoleId) return;
    setUpdatingRoleId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to update role.", variant: "destructive" });
        setUpdatingRoleId(null);
        return;
      }
      toast({ title: "Role updated", description: `User is now ${role}.` });
      const listRes = await fetch("/api/admin/users", { credentials: "include" });
      if (listRes.ok) setAdminsList(await listRes.json());
    } catch {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    }
    setUpdatingRoleId(null);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setDeletingAdmin(true);
    try {
      const res = await fetch(`/api/admin/users/${adminToDelete.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to delete.", variant: "destructive" });
        setDeletingAdmin(false);
        setAdminToDelete(null);
        return;
      }
      toast({ title: "User deleted", description: `${adminToDelete.email} has been removed.` });
      setAdminsList((prev) => prev.filter((a) => a.id !== adminToDelete.id));
      setAdminToDelete(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
    setDeletingAdmin(false);
  };

  const sendReplyToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyToUserMessage || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: replyToUserMessage.email,
          message: replyText.trim(),
          appointmentId: replyToUserMessage.appointmentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to send reply.", variant: "destructive" });
        setSendingReply(false);
        return;
      }
      toast({ title: "Reply sent", description: "The user will see your message in their notifications." });
      setReplyToUserMessage(null);
      setReplyText("");
    } catch {
      toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
    }
    setSendingReply(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/images", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Upload failed.", variant: "destructive" });
        setUploading(false);
        return;
      }
      toast({ title: "Image Uploaded", description: "Image has been added (max 600×400)." });
      await fetchImages();
    } catch {
      toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDeleteImage = async (url: string) => {
    const filename = url.replace(/^\/uploads\//, "");
    setDeletingId(url);
    try {
      const res = await fetch(`/api/images?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
        setDeletingId(null);
        return;
      }
      toast({ title: "Image Deleted", description: "Image has been removed.", variant: "destructive" });
      await fetchImages();
    } catch {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    }
    setDeletingId(null);
  };

  const handleClinicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setClinicInfo((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveClinicInfo = async () => {
    setSavingClinic(true);
    try {
      const res = await fetch("/api/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicInfo),
      });
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
        setSavingClinic(false);
        return;
      }
      toast({ title: "Saved", description: "Clinic information has been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
    setSavingClinic(false);
  };

  const handleAddService = () => {
    setSelectedService({ id: `s${Date.now()}`, name: "", description: "", icon: "Stethoscope" });
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setServiceDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/services?id=${encodeURIComponent(serviceId)}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
        return;
      }
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      toast({ title: "Service Deleted", description: "The service has been removed.", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    }
  };

  const handleSaveService = async () => {
    if (!selectedService) return;
    const isNew = !services.some((s) => s.id === selectedService.id);
    try {
      const res = await fetch("/api/services", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedService),
      });
      if (!res.ok) {
        toast({ title: "Error", description: "Save failed.", variant: "destructive" });
        return;
      }
      await fetchData();
      setServiceDialogOpen(false);
      setSelectedService(null);
      toast({ title: isNew ? "Service Added" : "Service Updated", description: selectedService.name });
    } catch {
      toast({ title: "Error", description: "Save failed.", variant: "destructive" });
    }
  };

  const handleAddDoctor = () => {
    setSelectedDoctor({
      id: `d${Date.now()}`,
      name: "",
      specialization: "",
      education: "",
      bio: "",
      imageUrl: "https://placehold.co/400x400",
    });
    setDoctorDialogOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDoctorDialogOpen(true);
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      const res = await fetch(`/api/doctors?id=${encodeURIComponent(doctorId)}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
        return;
      }
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
      toast({ title: "Doctor Deleted", description: "The doctor has been removed.", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    }
  };

  const handleSaveDoctor = async () => {
    if (!selectedDoctor) return;
    const isNew = !doctors.some((d) => d.id === selectedDoctor.id);
    try {
      const res = await fetch("/api/doctors", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedDoctor),
      });
      if (!res.ok) {
        toast({ title: "Error", description: "Save failed.", variant: "destructive" });
        return;
      }
      await fetchData();
      setDoctorDialogOpen(false);
      setSelectedDoctor(null);
      toast({ title: isNew ? "Doctor Added" : "Doctor Updated", description: selectedDoctor.name });
    } catch {
      toast({ title: "Error", description: "Save failed.", variant: "destructive" });
    }
  };

  const handleDoctorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedDoctor((prev) =>
            prev ? { ...prev, imageUrl: event.target!.result as string } : null
          );
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const updateAppointment = async (id: number, body: { status?: string; rescheduledDate?: string; rescheduledTime?: string }) => {
    setUpdatingApt(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.error ?? "Failed.", variant: "destructive" });
        setUpdatingApt(false);
        return;
      }
      await fetchData();
      toast({ title: "Updated", description: "Appointment updated." });
    } catch {
      toast({ title: "Error", description: "Failed.", variant: "destructive" });
    }
    setUpdatingApt(false);
  };

  const sendNotification = async (email: string, message: string, appointmentId: number | null) => {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, message, appointmentId }),
    });
    return res.ok;
  };

  const handleAccept = (apt: Appointment) => {
    setAcceptApt(apt);
    setAcceptMessage("");
    setIsAcceptOpen(true);
  };

  const saveAccept = async () => {
    if (!acceptApt) return;
    setUpdatingApt(true);
    try {
      const res = await fetch(`/api/appointments/${acceptApt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
        return;
      }
      const msg = acceptMessage.trim() || "Your appointment has been accepted.";
      await sendNotification(acceptApt.email, msg, acceptApt.id);
      toast({ title: "Accepted", description: "Appointment accepted and client notified." });
      setIsAcceptOpen(false);
      setAcceptApt(null);
      setAcceptMessage("");
      await fetchData();
    } finally {
      setUpdatingApt(false);
    }
  };

  const handleReject = (apt: Appointment) => {
    setRejectApt(apt);
    setRejectMessage("");
    setIsRejectOpen(true);
  };

  const saveReject = async () => {
    if (!rejectApt) return;
    setUpdatingApt(true);
    try {
      const res = await fetch(`/api/appointments/${rejectApt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
        return;
      }
      const msg = rejectMessage.trim() || "Your appointment was rejected.";
      await sendNotification(rejectApt.email, msg, rejectApt.id);
      toast({ title: "Rejected", description: "Appointment rejected and client notified." });
      setIsRejectOpen(false);
      setRejectApt(null);
      setRejectMessage("");
      await fetchData();
    } finally {
      setUpdatingApt(false);
    }
  };

  const openReschedule = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setRescheduleForm({
      date: apt.rescheduledDate ?? apt.preferredDate,
      time: apt.rescheduledTime ?? apt.preferredTime,
      message: "",
    });
    setIsRescheduleOpen(true);
  };

  const saveReschedule = async () => {
    if (!selectedAppointment || !rescheduleForm.date || !rescheduleForm.time) return;
    setUpdatingApt(true);
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rescheduledDate: rescheduleForm.date,
          rescheduledTime: rescheduleForm.time,
        }),
      });
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
        return;
      }
      const msg =
        rescheduleForm.message.trim() ||
        `Your appointment has been rescheduled to ${rescheduleForm.date} at ${rescheduleForm.time}.`;
      await sendNotification(selectedAppointment.email, msg, selectedAppointment.id);
      toast({ title: "Rescheduled", description: "Time updated and client notified." });
      setIsRescheduleOpen(false);
      setSelectedAppointment(null);
      setRescheduleForm({ date: "", time: "", message: "" });
      await fetchData();
    } finally {
      setUpdatingApt(false);
    }
  };

  const openMessage = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setMessageForm("");
    setIsMessageOpen(true);
  };

  const saveMessage = async () => {
    if (!selectedAppointment || !messageForm.trim()) return;
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedAppointment.email,
          message: messageForm.trim(),
          appointmentId: selectedAppointment.id,
        }),
      });
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        return;
      }
      toast({ title: "Message sent", description: "Notification sent to client." });
      setIsMessageOpen(false);
      setSelectedAppointment(null);
      setMessageForm("");
    } catch {
      toast({ title: "Error", description: "Failed to send.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-secondary">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-headline">
            Admin Panel
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage clinic, services, doctors, appointments and images.
          </p>
        </div>

        <Tabs defaultValue="info" onValueChange={(value) => { if (value === "messages-from-users" || value === "sent-messages") fetchMessagesForAdmin(); }}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full max-w-4xl">
            <TabsTrigger value="info">Clinic Info</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            {canAddAdmins && <TabsTrigger value="admins">Admins</TabsTrigger>}
            <TabsTrigger value="sent-messages">Sent messages</TabsTrigger>
            <TabsTrigger value="messages-from-users">Messages from users</TabsTrigger>
            {canAddAdmins && <TabsTrigger value="profile">My profile</TabsTrigger>}
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Clinic Information</CardTitle>
                <CardDescription>Update general information. Data is saved to the database.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name</Label>
                  <Input id="name" value={clinicInfo.name} onChange={handleClinicInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={clinicInfo.address} onChange={handleClinicInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={clinicInfo.phone} onChange={handleClinicInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={clinicInfo.email} onChange={handleClinicInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={clinicInfo.description}
                    onChange={handleClinicInfoChange}
                    className="min-h-24"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveClinicInfo} disabled={savingClinic}>
                  {savingClinic ? "Saving…" : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Medical Services</CardTitle>
                <CardDescription>Manage services offered by the clinic.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>{service.description}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditService(service)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteService(service.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddService}>Add New Service</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="doctors">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Profiles</CardTitle>
                <CardDescription>Manage doctor profiles. Add/Edit form is responsive.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctors.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell>
                            <Image
                              src={doctor.imageUrl}
                              alt={doctor.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover shrink-0"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{doctor.name}</TableCell>
                          <TableCell>{doctor.specialization}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditDoctor(doctor)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteDoctor(doctor.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddDoctor}>Add New Doctor</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointments
                </CardTitle>
                <CardDescription>
                  Accept, reject, reschedule or send message to client.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Date / Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No appointments yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        appointments.map((apt) => {
                          const status = (apt as Appointment & { status?: string }).status ?? "pending";
                          const rescheduledDate = (apt as Appointment & { rescheduledDate?: string | null }).rescheduledDate;
                          const rescheduledTime = (apt as Appointment & { rescheduledTime?: string | null }).rescheduledTime;
                          const displayDate = rescheduledDate ?? apt.preferredDate;
                          const displayTime = rescheduledTime ?? apt.preferredTime;
                          return (
                            <TableRow key={apt.id}>
                              <TableCell className="font-medium">{apt.name}</TableCell>
                              <TableCell>{apt.email}</TableCell>
                              <TableCell>{apt.phone}</TableCell>
                              <TableCell>
                                <span>{displayDate} {displayTime}</span>
                                {(rescheduledDate ?? rescheduledTime) && (
                                  <span className="block text-xs text-muted-foreground">(rescheduled)</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status === "accepted" ? "default" : status === "rejected" ? "destructive" : "secondary"}>
                                  {status}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate" title={apt.message ?? ""}>
                                {apt.message ?? "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                {new Date(apt.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={updatingApt}>
                                      Actions
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {status !== "accepted" && (
                                      <DropdownMenuItem onClick={() => handleAccept(apt)}>
                                        <Check className="mr-2 h-4 w-4" />
                                        Accept
                                      </DropdownMenuItem>
                                    )}
                                    {status !== "rejected" && (
                                      <DropdownMenuItem onClick={() => handleReject(apt)}>
                                        <X className="mr-2 h-4 w-4" />
                                        Reject
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => openReschedule(apt)}>
                                      <Clock className="mr-2 h-4 w-4" />
                                      Change time
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openMessage(apt)}>
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      Send message
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={fetchData}>
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>All Admins</CardTitle>
                <CardDescription>Only main admin sees this list. Add new admin and choose whether they can add other admins.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Can add admins</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminsList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No admins yet.</TableCell>
                        </TableRow>
                      ) : (
                        adminsList.map((a) => {
                          const isMainAdmin = a.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();
                          const isSelf = session?.user?.id === a.id;
                          const canEdit = !isMainAdmin && !isSelf;
                          return (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.name}</TableCell>
                              <TableCell>{a.email}</TableCell>
                              <TableCell>
                                {canEdit ? (
                                  <Select
                                    value={a.role}
                                    onValueChange={(value: "admin" | "user") => handleChangeRole(a.id, value)}
                                    disabled={!!updatingRoleId}
                                  >
                                    <SelectTrigger className="w-[100px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="secondary">{a.role}</Badge>
                                )}
                              </TableCell>
                              <TableCell>{a.canAddAdmins ? "Yes" : "No"}</TableCell>
                              <TableCell className="text-right">
                                {canEdit ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setAdminToDelete({ id: a.id, email: a.email })}
                                    disabled={deletingAdmin}
                                  >
                                    <UserMinus className="mr-1 h-4 w-4" />
                                    Delete
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {isMainAdmin ? "Main admin" : "You"}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <AlertDialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete user?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove {adminToDelete?.email} from the system. They will no longer be able to log in. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {deletingAdmin ? "Deleting…" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Add New Admin</h3>
                  <form onSubmit={handleAddAdmin} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Name</Label>
                      <Input
                        id="admin-name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Admin name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
                        placeholder="admin@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))}
                        placeholder="Min 6 characters"
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="admin-can-add"
                        checked={newAdmin.canAddAdmins === 1}
                        onCheckedChange={(checked) => setNewAdmin((p) => ({ ...p, canAddAdmins: checked ? 1 : 0 }))}
                      />
                      <Label htmlFor="admin-can-add" className="text-sm font-normal">Can add other admins</Label>
                    </div>
                    <Button type="submit" disabled={addingAdmin}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {addingAdmin ? "Adding…" : "Add Admin"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent-messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Sent messages to clients
                </CardTitle>
                <CardDescription>Messages you sent to users (notifications).</CardDescription>
              </CardHeader>
              <CardContent>
                {sentMessages.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No sent messages yet.</p>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <ul className="space-y-3">
                      {sentMessages.map((n) => (
                        <li key={n.id} className="rounded-lg border p-3 text-sm bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">{new Date(n.createdAt).toLocaleString()} · To: {n.email}</p>
                          <p className="whitespace-pre-wrap break-words">{n.message}</p>
                          {n.appointmentId != null && <p className="text-xs text-muted-foreground mt-1">Appointment #{n.appointmentId}</p>}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages-from-users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Messages from users
                </CardTitle>
                <CardDescription>Messages users sent to the clinic (admin).</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="mb-4" onClick={fetchMessagesForAdmin}>
                  Refresh
                </Button>
                {messagesFromUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No messages from users yet.</p>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <ul className="space-y-3">
                      {messagesFromUsers.map((n) => (
                        <li key={n.id} className="rounded-lg border p-3 text-sm bg-primary/5 border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1">{new Date(n.createdAt).toLocaleString()} · From: {n.email}</p>
                          <p className="whitespace-pre-wrap break-words">{n.message}</p>
                          {n.appointmentId != null && <p className="text-xs text-muted-foreground mt-1">Appointment #{n.appointmentId}</p>}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setReplyToUserMessage({ email: n.email, appointmentId: n.appointmentId });
                              setReplyText("");
                            }}
                          >
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Reply
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!replyToUserMessage} onOpenChange={(open) => !open && setReplyToUserMessage(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reply to user</DialogTitle>
                  <DialogDescription>
                    Your message will appear in the user&apos;s notifications. Recipient: {replyToUserMessage?.email}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={sendReplyToUser} className="py-4">
                  <Label>Message</Label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="min-h-24 mt-2"
                    required
                  />
                  <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setReplyToUserMessage(null)}>Cancel</Button>
                    <Button type="submit" disabled={sendingReply || !replyText.trim()}>{sendingReply ? "Sending…" : "Send reply"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  My profile (main admin)
                </CardTitle>
                <CardDescription>Change your email and password. Only main admin can edit this.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="admin@meditrack.clinic"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input
                      id="profile-name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Admin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-password">New password (leave blank to keep current)</Label>
                    <Input
                      id="profile-password"
                      type="password"
                      value={profileForm.password}
                      onChange={(e) => setProfileForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Save profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>
                  Upload images (max size 600×400). Stored in public/uploads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryUpload}
                    disabled={uploading}
                  />
                  <Label htmlFor="gallery-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" disabled={uploading} asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading…" : "Choose image"}
                      </span>
                    </Button>
                  </Label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((url) => (
                    <div key={url} className="relative group rounded-lg overflow-hidden border bg-muted/50">
                      <Image
                        src={url}
                        alt="Gallery"
                        width={160}
                        height={160}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteImage(url)}
                          disabled={deletingId === url}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      <p className="text-xs p-2 truncate text-muted-foreground">{url}</p>
                    </div>
                  ))}
                </div>
                {images.length === 0 && (
                  <p className="text-sm text-muted-foreground">No images yet. Upload one above.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Service Dialog */}
        <Dialog open={isServiceDialogOpen} onOpenChange={setServiceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedService && services.find((s) => s.id === selectedService.id) ? "Edit Service" : "Add Service"}
              </DialogTitle>
              <DialogDescription>Fill in the details for the medical service.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="service-name" className="sm:text-right">Name</Label>
                <Input
                  id="service-name"
                  value={selectedService?.name ?? ""}
                  onChange={(e) => setSelectedService((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="service-description" className="sm:text-right">Description</Label>
                <Textarea
                  id="service-description"
                  value={selectedService?.description ?? ""}
                  onChange={(e) => setSelectedService((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                  className="sm:col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setServiceDialogOpen(false); setSelectedService(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveService}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Doctor Dialog — responsive, scrollable */}
        <Dialog open={isDoctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl max-h-[90vh] flex flex-col p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>
                {selectedDoctor && doctors.find((d) => d.id === selectedDoctor.id) ? "Edit Doctor" : "Add Doctor"}
              </DialogTitle>
              <DialogDescription>Fill in the doctor&apos;s profile. Form adapts to screen size.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="grid gap-4 py-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Profile Image</Label>
                    {selectedDoctor?.imageUrl && (
                      <Image
                        src={selectedDoctor.imageUrl}
                        alt="Doctor profile"
                        width={80}
                        height={80}
                        className="rounded-full object-cover"
                      />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleDoctorImageUpload}
                      className="text-sm w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-name">Name</Label>
                    <Input
                      id="doctor-name"
                      value={selectedDoctor?.name ?? ""}
                      onChange={(e) => setSelectedDoctor((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-specialization">Specialization</Label>
                    <Input
                      id="doctor-specialization"
                      value={selectedDoctor?.specialization ?? ""}
                      onChange={(e) => setSelectedDoctor((prev) => (prev ? { ...prev, specialization: e.target.value } : null))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="doctor-education">Education</Label>
                    <Input
                      id="doctor-education"
                      value={selectedDoctor?.education ?? ""}
                      onChange={(e) => setSelectedDoctor((prev) => (prev ? { ...prev, education: e.target.value } : null))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="doctor-bio">Bio</Label>
                    <Textarea
                      id="doctor-bio"
                      value={selectedDoctor?.bio ?? ""}
                      onChange={(e) => setSelectedDoctor((prev) => (prev ? { ...prev, bio: e.target.value } : null))}
                      className="min-h-20"
                    />
                  </div>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4 shrink-0">
              <Button variant="outline" onClick={() => { setDoctorDialogOpen(false); setSelectedDoctor(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveDoctor}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Accept appointment dialog */}
        <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept appointment</DialogTitle>
              <DialogDescription>
                Client will receive a notification. Add an optional message (e.g. confirmation details).
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Message to client (optional)</Label>
              <Textarea
                value={acceptMessage}
                onChange={(e) => setAcceptMessage(e.target.value)}
                placeholder="Your appointment has been accepted. We look forward to seeing you."
                className="min-h-20 mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAcceptOpen(false)}>Cancel</Button>
              <Button onClick={saveAccept} disabled={updatingApt}>{updatingApt ? "Saving…" : "Accept & notify"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject appointment dialog */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject appointment</DialogTitle>
              <DialogDescription>
                Client will receive a notification. Add an optional message (e.g. reason).
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Message to client (optional)</Label>
              <Textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                placeholder="Your appointment was rejected. Please contact us to reschedule."
                className="min-h-20 mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
              <Button onClick={saveReject} disabled={updatingApt} variant="destructive">{updatingApt ? "Saving…" : "Reject & notify"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule dialog */}
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change appointment time</DialogTitle>
              <DialogDescription>
                New date and time for {selectedAppointment?.name}. Client will receive a notification.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Message to client (optional)</Label>
                <Textarea
                  value={rescheduleForm.message}
                  onChange={(e) => setRescheduleForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Your appointment has been rescheduled to..."
                  className="min-h-16"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>Cancel</Button>
              <Button onClick={saveReschedule} disabled={updatingApt}>{updatingApt ? "Saving…" : "Save & notify"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send message dialog */}
        <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send message to client</DialogTitle>
              <DialogDescription>
                Message will appear in client notifications ({selectedAppointment?.email}).
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Message</Label>
              <Textarea
                value={messageForm}
                onChange={(e) => setMessageForm(e.target.value)}
                placeholder="Your appointment is confirmed for..."
                className="min-h-24 mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
              <Button onClick={saveMessage} disabled={!messageForm.trim()}>Send</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
