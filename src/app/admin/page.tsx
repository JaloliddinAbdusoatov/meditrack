
"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { clinicInfo as initialClinicInfo, doctors as initialDoctors, services as initialServices, type ClinicInfo, type Doctor, type Service } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";
import Image from "next/image";

export default function AdminPage() {
  const { toast } = useToast();

  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(initialClinicInfo);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setServiceDialogOpen] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDoctorDialogOpen, setDoctorDialogOpen] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
        const storedClinicInfo = localStorage.getItem('clinicInfo');
        if (storedClinicInfo) setClinicInfo(JSON.parse(storedClinicInfo));

        const storedServices = localStorage.getItem('services');
        if (storedServices) setServices(JSON.parse(storedServices));

        const storedDoctors = localStorage.getItem('doctors');
        if (storedDoctors) setDoctors(JSON.parse(storedDoctors));
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        toast({
            title: "Error",
            description: "Could not load saved data. Using default values.",
            variant: "destructive"
        });
    }
  }, [toast]);
  
  const handleClinicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setClinicInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveClinicInfo = () => {
    localStorage.setItem('clinicInfo', JSON.stringify(clinicInfo));
    toast({
      title: "Success!",
      description: "Clinic information has been updated.",
    });
  };

  // --- Service Handlers ---
  const handleAddService = () => {
    setSelectedService({ id: `s${Date.now()}`, name: "", description: "", icon: "Stethoscope" });
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setServiceDialogOpen(true);
  };

  const handleDeleteService = (serviceId: string) => {
    const updatedServices = services.filter(s => s.id !== serviceId);
    setServices(updatedServices);
    localStorage.setItem('services', JSON.stringify(updatedServices));
    toast({
      title: "Service Deleted",
      description: "The service has been removed.",
      variant: "destructive"
    });
  };
  
  const handleSaveService = () => {
    if (!selectedService) return;
    let updatedServices;
    const isNew = !services.some(s => s.id === selectedService.id);
    if (isNew) {
        updatedServices = [...services, selectedService];
        toast({ title: "Service Added", description: `${selectedService.name} has been added.` });
    } else {
        updatedServices = services.map(s => s.id === selectedService.id ? selectedService : s);
        toast({ title: "Service Updated", description: `${selectedService.name} has been updated.` });
    }
    setServices(updatedServices);
    localStorage.setItem('services', JSON.stringify(updatedServices));
    setServiceDialogOpen(false);
    setSelectedService(null);
  };

  // --- Doctor Handlers ---
  const handleAddDoctor = () => {
    setSelectedDoctor({ id: `d${Date.now()}`, name: "", specialization: "", education: "", bio: "", imageUrl: "https://placehold.co/400x400" });
    setDoctorDialogOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDoctorDialogOpen(true);
  };

  const handleDeleteDoctor = (doctorId: string) => {
    const updatedDoctors = doctors.filter(d => d.id !== doctorId);
    setDoctors(updatedDoctors);
    localStorage.setItem('doctors', JSON.stringify(updatedDoctors));
    toast({
      title: "Doctor Deleted",
      description: "The doctor has been removed.",
      variant: "destructive"
    });
  };

  const handleSaveDoctor = () => {
    if (!selectedDoctor) return;
    let updatedDoctors;
    const isNew = !doctors.some(d => d.id === selectedDoctor.id);
    if (isNew) {
        updatedDoctors = [...doctors, selectedDoctor];
        toast({ title: "Doctor Added", description: `${selectedDoctor.name} has been added.` });
    } else {
        updatedDoctors = doctors.map(d => d.id === selectedDoctor.id ? selectedDoctor : d);
        toast({ title: "Doctor Updated", description: `${selectedDoctor.name} has been updated.` });
    }
    setDoctors(updatedDoctors);
    localStorage.setItem('doctors', JSON.stringify(updatedDoctors));
    setDoctorDialogOpen(false);
    setSelectedDoctor(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
            setSelectedDoctor(prev => prev ? { ...prev, imageUrl: event.target!.result as string } : null);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-headline">Admin Panel</h1>
            <p className="mt-2 text-lg text-muted-foreground">Manage clinic information, services, and doctors.</p>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Clinic Info</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Clinic Information</CardTitle>
                <CardDescription>Update general information about the clinic. Click save when you're done.</CardDescription>
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
                  <Textarea id="description" value={clinicInfo.description} onChange={handleClinicInfoChange} className="min-h-24"/>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveClinicInfo}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Medical Services</CardTitle>
                <CardDescription>Manage the list of services offered by the clinic.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map(service => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>{service.description}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="icon" onClick={() => handleEditService(service)}><Edit className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteService(service.id)}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
                <CardDescription>Manage the profiles of the doctors at the clinic.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {doctors.map(doctor => (
                            <TableRow key={doctor.id}>
                                <TableCell>
                                    <Image src={doctor.imageUrl} alt={doctor.name} width={40} height={40} className="rounded-full object-cover" />
                                </TableCell>
                                <TableCell className="font-medium">{doctor.name}</TableCell>
                                <TableCell>{doctor.specialization}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="icon" onClick={() => handleEditDoctor(doctor)}><Edit className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteDoctor(doctor.id)}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddDoctor}>Add New Doctor</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedService && services.find(s => s.id === selectedService.id) ? 'Edit Service' : 'Add Service'}</DialogTitle>
            <DialogDescription>
              Fill in the details for the medical service.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-name" className="text-right">
                Name
              </Label>
              <Input
                id="service-name"
                value={selectedService?.name || ''}
                onChange={(e) => setSelectedService(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="service-description"
                value={selectedService?.description || ''}
                onChange={(e) => setSelectedService(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setServiceDialogOpen(false); setSelectedService(null); }}>Cancel</Button>
            <Button onClick={handleSaveService}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Doctor Dialog */}
      <Dialog open={isDoctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDoctor && doctors.find(d => d.id === selectedDoctor.id) ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
            <DialogDescription>
                Fill in the details for the doctor's profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label>Profile Image</Label>
                {selectedDoctor?.imageUrl && <Image src={selectedDoctor.imageUrl} alt="Doctor profile" width={80} height={80} className="rounded-full object-cover"/>}
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="doctor-name">Name</Label>
                <Input id="doctor-name" value={selectedDoctor?.name || ''} onChange={(e) => setSelectedDoctor(prev => prev ? { ...prev, name: e.target.value } : null)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="doctor-specialization">Specialization</Label>
                <Input id="doctor-specialization" value={selectedDoctor?.specialization || ''} onChange={(e) => setSelectedDoctor(prev => prev ? { ...prev, specialization: e.target.value } : null)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="doctor-education">Education</Label>
                <Input id="doctor-education" value={selectedDoctor?.education || ''} onChange={(e) => setSelectedDoctor(prev => prev ? { ...prev, education: e.target.value } : null)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="doctor-bio">Bio</Label>
                <Textarea id="doctor-bio" value={selectedDoctor?.bio || ''} onChange={(e) => setSelectedDoctor(prev => prev ? { ...prev, bio: e.target.value } : null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDoctorDialogOpen(false); setSelectedDoctor(null); }}>Cancel</Button>
            <Button onClick={handleSaveDoctor}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    