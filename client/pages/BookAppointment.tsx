import { useState } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import { Calendar, Clock, User, MapPin, Phone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

export default function BookAppointment() {
  const [formData, setFormData] = useState({
    doctor: "",
    specialty: "",
    date: "",
    time: "",
    reason: "",
    urgency: "normal",
  });

  const doctors = [
    {
      id: "1",
      name: "Dr. Rajesh Sharma",
      specialty: "Cardiologist",
      available: ["10:00 AM", "2:00 PM", "4:00 PM"],
    },
    {
      id: "2",
      name: "Dr. Priya Patel",
      specialty: "General Medicine",
      available: ["9:00 AM", "11:00 AM", "3:00 PM"],
    },
    {
      id: "3",
      name: "Dr. Amit Singh",
      specialty: "Orthopedic",
      available: ["10:30 AM", "1:30 PM", "5:00 PM"],
    },
    {
      id: "4",
      name: "Dr. Sunita Verma",
      specialty: "Gynecologist",
      available: ["9:30 AM", "2:30 PM", "4:30 PM"],
    },
    {
      id: "5",
      name: "Dr. Vikram Joshi",
      specialty: "Pediatrician",
      available: ["10:00 AM", "12:00 PM", "3:30 PM"],
    },
  ];

  const specialties = [
    "General Medicine",
    "Cardiologist",
    "Orthopedic",
    "Gynecologist",
    "Pediatrician",
    "Dermatologist",
    "ENT Specialist",
    "Neurologist",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send to backend
    alert(
      "Appointment request submitted successfully! You will receive confirmation shortly.",
    );
  };

  const selectedDoctor = doctors.find((doc) => doc.id === formData.doctor);

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600 mt-2">
            Schedule a visit with your preferred healthcare provider
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
                <CardDescription>
                  Fill in the details to schedule your appointment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="specialty">Medical Specialty</Label>
                      <Select
                        value={formData.specialty}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            specialty: value,
                            doctor: "",
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map((specialty) => (
                            <SelectItem key={specialty} value={specialty}>
                              {specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="doctor">Preferred Doctor</Label>
                      <Select
                        value={formData.doctor}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, doctor: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors
                            .filter(
                              (doc) =>
                                !formData.specialty ||
                                doc.specialty === formData.specialty,
                            )
                            .map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name} - {doctor.specialty}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Preferred Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="mt-1"
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="time">Preferred Time</Label>
                      <Select
                        value={formData.time}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, time: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedDoctor?.available.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          )) || (
                            <SelectItem value="no-doctor" disabled>
                              Select a doctor first
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="urgency">Urgency Level</Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, urgency: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason for Visit</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please describe your symptoms or reason for the appointment..."
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      className="mt-1"
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      !formData.doctor || !formData.date || !formData.time
                    }
                  >
                    Book Appointment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Doctor Info & Instructions */}
          <div className="space-y-6">
            {selectedDoctor && (
              <Card>
                <CardHeader>
                  <CardTitle>Doctor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedDoctor.name}</div>
                      <div className="text-sm text-gray-600">
                        {selectedDoctor.specialty}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>OPD Block A, 2nd Floor</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>+91 98765 43210</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        Available: {selectedDoctor.available.join(", ")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Arrive 15 minutes before your appointment time</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Bring your previous medical records if any</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Carry a valid ID proof</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>You will receive SMS confirmation</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="text-amber-800 text-sm">
                  <strong>Note:</strong> Appointment requests are subject to
                  doctor availability. You will receive confirmation within 24
                  hours.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
