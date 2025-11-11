import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  UserCheck,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Stethoscope,
  Activity,
  DollarSign,
  Clock,
  Award,
  Plus
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "../hooks/use-toast";

interface Doctor {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
  created_at: string;
}

export default function DoctorsManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    experience_years: "",
    consultation_fee: "",
    available_days: "",
    bio: ""
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      } else {
        console.error('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingDoctor(true);

    try {
      const response = await fetch('/api/admin/add-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...doctorForm,
          experience_years: doctorForm.experience_years ? parseInt(doctorForm.experience_years) : null,
          consultation_fee: doctorForm.consultation_fee ? parseFloat(doctorForm.consultation_fee) : null
        })
      });

      // Parse response once
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        responseData = {};
      }

      if (response.ok) {
        toast({
          title: "Success",
          description: "Doctor added successfully and account activated.",
        });

        // Reset form
        setDoctorForm({
          full_name: "",
          email: "",
          password: "",
          phone: "",
          specialization: "",
          experience_years: "",
          consultation_fee: "",
          available_days: "",
          bio: ""
        });
        setShowAddForm(false);

        // Refresh doctors list
        fetchDoctors();
      } else {
        toast({
          title: "Error",
          description: responseData.error || responseData.message || "Failed to add doctor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast({
        title: "Error",
        description: "An error occurred while adding the doctor",
        variant: "destructive",
      });
    } finally {
      setAddingDoctor(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.phone && doctor.phone.includes(searchTerm)) ||
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialization = filterSpecialization === "all" || 
      (doctor.specialization && doctor.specialization.toLowerCase().includes(filterSpecialization.toLowerCase()));
    
    return matchesSearch && matchesSpecialization;
  });

  const getSpecializationIcon = (specialization?: string) => {
    if (!specialization) return '🩺';
    const spec = specialization.toLowerCase();
    if (spec.includes('cardio')) return '❤️';
    if (spec.includes('neuro')) return '🧠';
    if (spec.includes('ortho')) return '🦴';
    if (spec.includes('pediatric')) return '👶';
    if (spec.includes('dermat')) return '🧴';
    if (spec.includes('eye') || spec.includes('ophthal')) return '👁️';
    if (spec.includes('dental')) return '🦷';
    if (spec.includes('ent')) return '👂';
    return '🩺';
  };

  const getExperienceLevel = (years?: number) => {
    if (!years) return 'New';
    if (years < 3) return 'Junior';
    if (years < 8) return 'Mid-level';
    if (years < 15) return 'Senior';
    return 'Expert';
  };

  const getExperienceColor = (years?: number) => {
    if (!years) return 'bg-gray-100 text-gray-800';
    if (years < 3) return 'bg-blue-100 text-blue-800';
    if (years < 8) return 'bg-green-100 text-green-800';
    if (years < 15) return 'bg-orange-100 text-orange-800';
    return 'bg-purple-100 text-purple-800';
  };

  const getAvailabilityStatus = (availableDays?: string) => {
    if (!availableDays) return 'Not Set';
    const days = availableDays.split(',').length;
    if (days >= 6) return 'Full Time';
    if (days >= 4) return 'Part Time';
    return 'Limited';
  };

  const getAvailabilityColor = (availableDays?: string) => {
    const status = getAvailabilityStatus(availableDays);
    switch (status) {
      case 'Full Time':
        return 'bg-green-100 text-green-800';
      case 'Part Time':
        return 'bg-yellow-100 text-yellow-800';
      case 'Limited':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const specializationsList = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const stats = {
    total: doctors.length,
    active: doctors.filter(d => d.available_days).length,
    newThisMonth: doctors.filter(d => {
      const created = new Date(d.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
    averageFee: doctors.length > 0 
      ? Math.round(doctors.reduce((sum, d) => sum + (d.consultation_fee || 0), 0) / doctors.length)
      : 0
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Doctors Management</h1>
            <p className="text-gray-600 mt-2">
              Manage doctor profiles, schedules, and specializations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export List
            </Button>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Doctor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>
                    Add a doctor directly to the system. The account will be activated immediately.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddDoctor} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={doctorForm.full_name}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={doctorForm.email}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="doctor@hospital.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={doctorForm.password}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Secure password"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={doctorForm.phone}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter 10 digit mobile number"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        minLength={10}
                        onInput={(e) => {
                          // Only allow numeric input
                          const input = e.target as HTMLInputElement;
                          input.value = input.value.replace(/[^0-9]/g, '');
                          if (input.value.length > 10) {
                            input.value = input.value.slice(0, 10);
                          }
                          setDoctorForm(prev => ({ ...prev, phone: input.value }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Select
                        value={doctorForm.specialization}
                        onValueChange={(value) => setDoctorForm(prev => ({ ...prev, specialization: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cardiology">Cardiology</SelectItem>
                          <SelectItem value="Dermatology">Dermatology</SelectItem>
                          <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                          <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                          <SelectItem value="General Medicine">General Medicine</SelectItem>
                          <SelectItem value="Neurology">Neurology</SelectItem>
                          <SelectItem value="Oncology">Oncology</SelectItem>
                          <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                          <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                          <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                          <SelectItem value="Radiology">Radiology</SelectItem>
                          <SelectItem value="Surgery">Surgery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="experience_years">Experience (Years)</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        value={doctorForm.experience_years}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, experience_years: e.target.value }))}
                        placeholder="5"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consultation_fee">Consultation Fee (₹)</Label>
                      <Input
                        id="consultation_fee"
                        type="number"
                        value={doctorForm.consultation_fee}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, consultation_fee: e.target.value }))}
                        placeholder="500"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="available_days">Available Days</Label>
                      <Input
                        id="available_days"
                        value={doctorForm.available_days}
                        onChange={(e) => setDoctorForm(prev => ({ ...prev, available_days: e.target.value }))}
                        placeholder="Mon-Fri, 9AM-5PM"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio/Description</Label>
                    <Textarea
                      id="bio"
                      value={doctorForm.bio}
                      onChange={(e) => setDoctorForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Brief description about the doctor..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      disabled={addingDoctor}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addingDoctor}
                      className="min-w-[100px]"
                    >
                      {addingDoctor ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </div>
                      ) : (
                        "Add Doctor"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Doctors</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.active}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Active Doctors</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">+{stats.newThisMonth}</div>
                  <div className="text-xs sm:text-sm text-gray-600">New This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">₹{stats.averageFee}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Avg. Consultation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, phone, or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specializationsList.map((spec) => (
                      <SelectItem key={spec} value={spec!}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctors List */}
        <Card>
          <CardHeader>
            <CardTitle>All Doctors</CardTitle>
            <CardDescription>
              Showing {filteredDoctors.length} of {doctors.length} doctors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.user_id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{getSpecializationIcon(doctor.specialization)}</span>
                            <h3 className="font-semibold text-lg text-gray-900">
                              Dr. {doctor.full_name}
                            </h3>
                          </div>
                          <Badge className={getExperienceColor(doctor.experience_years)}>
                            {getExperienceLevel(doctor.experience_years)}
                          </Badge>
                          <Badge className={getAvailabilityColor(doctor.available_days)}>
                            {getAvailabilityStatus(doctor.available_days)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{doctor.email}</span>
                          </div>
                          {doctor.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{doctor.phone}</span>
                            </div>
                          )}
                          {doctor.specialization && (
                            <div className="flex items-center space-x-2">
                              <Stethoscope className="w-4 h-4" />
                              <span>{doctor.specialization}</span>
                            </div>
                          )}
                          {doctor.experience_years && (
                            <div className="flex items-center space-x-2">
                              <Award className="w-4 h-4" />
                              <span>{doctor.experience_years} years exp.</span>
                            </div>
                          )}
                        </div>
                        
                        {doctor.consultation_fee && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-green-600">
                              ₹{doctor.consultation_fee} consultation fee
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDoctor(doctor)}
                              className="w-full sm:w-auto"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Doctor Profile</DialogTitle>
                              <DialogDescription>
                                Complete information about Dr. {selectedDoctor?.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedDoctor && (
                              <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-medium mb-2">Personal Information</h3>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span>Dr. {selectedDoctor.full_name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span>{selectedDoctor.email}</span>
                                      </div>
                                      {selectedDoctor.phone && (
                                        <div className="flex items-center space-x-2">
                                          <Phone className="w-4 h-4 text-gray-400" />
                                          <span>{selectedDoctor.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-medium mb-2">Professional Details</h3>
                                    <div className="space-y-2 text-sm">
                                      {selectedDoctor.specialization && (
                                        <div className="flex items-center space-x-2">
                                          <Stethoscope className="w-4 h-4 text-gray-400" />
                                          <span>{selectedDoctor.specialization}</span>
                                        </div>
                                      )}
                                      {selectedDoctor.experience_years && (
                                        <div className="flex items-center space-x-2">
                                          <Award className="w-4 h-4 text-gray-400" />
                                          <span>{selectedDoctor.experience_years} years experience</span>
                                        </div>
                                      )}
                                      {selectedDoctor.consultation_fee && (
                                        <div className="flex items-center space-x-2">
                                          <DollarSign className="w-4 h-4 text-gray-400" />
                                          <span>₹{selectedDoctor.consultation_fee} consultation fee</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Availability */}
                                {selectedDoctor.available_days && (
                                  <div>
                                    <h3 className="font-medium mb-2">Availability</h3>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm">
                                        Available: {selectedDoctor.available_days}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Account Info */}
                                <div>
                                  <h3 className="font-medium mb-2">Account Information</h3>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">
                                      Joined: {new Date(selectedDoctor.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 pt-4">
                                  <Button size="sm" className="flex-1 sm:flex-none">
                                    Edit Profile
                                  </Button>
                                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                    View Schedule
                                  </Button>
                                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                    View Appointments
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || filterSpecialization !== "all" 
                      ? "No doctors found matching your criteria" 
                      : "No doctors registered yet"
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
