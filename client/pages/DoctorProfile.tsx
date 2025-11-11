import { useState, useEffect } from "react";
import { DoctorLayout } from "../components/DoctorLayout";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  GraduationCap,
  Stethoscope,
  Award,
  Clock,
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
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { authApi } from "../lib/api";

export default function DoctorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Get basic data from localStorage, rest will be empty until user fills them
  const userName = localStorage.getItem('userName') || '';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userPhone = localStorage.getItem('userPhone') || '';
  
  const [profileData, setProfileData] = useState({
    // Basic info from signup - these will be populated
    name: userName,
    email: userEmail,
    phone: userPhone,
    
    // Doctor specific fields from signup - these should be populated if available
    specialization: "",
    licenseNumber: "",
    experienceYears: "",
    consultationFee: "",
    
    // Fields that will be empty initially (not asked during signup)
    dateOfBirth: "",
    gender: "",
    address: "",
    subSpecialty: "",
    medicalDegree: "",
    institution: "",
    graduationYear: "",
    certifications: "",
    languages: "",
    availability: "",
    emergencyContact: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    bio: "",
    hospitalAffiliations: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.data?.user) {
        const user = response.data.user;
        setProfileData(prev => ({
          ...prev,
          name: user.full_name || userName,
          email: user.email || userEmail,
          phone: user.phone || userPhone,
          // Add doctor-specific fields if they exist in user data
          specialization: user.specialization || "",
          licenseNumber: user.license_number || "",
          experienceYears: user.experience_years?.toString() || "",
          consultationFee: user.consultation_fee?.toString() || "",
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    alert("Profile updated successfully!");
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  const specializations = [
    "Cardiology",
    "Neurology", 
    "Oncology",
    "Pediatrics",
    "Orthopedics",
    "Dermatology",
    "Psychiatry",
    "Radiology",
    "Emergency Medicine",
    "Internal Medicine",
    "Surgery",
    "Obstetrics & Gynecology"
  ];

  const genders = ["male", "female", "other"];

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your professional and personal information
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-16 h-16 text-white" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
                      <Camera className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profileData.name || "Doctor"}
                </h2>
                <p className="text-blue-600 font-medium">{profileData.specialization || "Specialization not specified"}</p>
                <p className="text-gray-600 text-sm">{profileData.email}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {profileData.phone && (
                    <div className="flex items-center justify-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}
                  {profileData.experienceYears && (
                    <div className="flex items-center justify-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <span>{profileData.experienceYears} years experience</span>
                    </div>
                  )}
                  {profileData.licenseNumber && (
                    <div className="flex items-center justify-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                      <span>License: {profileData.licenseNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Professional Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultation Fee</span>
                  <span className="font-medium">
                    {profileData.consultationFee ? `₹${profileData.consultationFee}` : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium">
                    {profileData.experienceYears ? `${profileData.experienceYears} years` : "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Specialization</span>
                  <span className="font-medium">{profileData.specialization || "Not specified"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Basic personal and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          dateOfBirth: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={profileData.gender}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({ ...prev, gender: value }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="languages">Languages</Label>
                    <Input
                      id="languages"
                      value={profileData.languages}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          languages: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="English, Hindi, etc."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    rows={3}
                    placeholder="Enter your address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>
                  Medical qualifications and practice details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">Medical License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          licenseNumber: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select
                      value={profileData.specialization}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          specialization: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subSpecialty">Sub-Specialty</Label>
                    <Input
                      id="subSpecialty"
                      value={profileData.subSpecialty}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          subSpecialty: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter sub-specialty"
                    />
                  </div>
                  <div>
                    <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                    <Input
                      id="consultationFee"
                      value={profileData.consultationFee}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          consultationFee: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      value={profileData.experienceYears}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          experienceYears: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      value={profileData.graduationYear}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          graduationYear: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter graduation year"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="medicalDegree">Medical Degree</Label>
                  <Input
                    id="medicalDegree"
                    value={profileData.medicalDegree}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        medicalDegree: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="MBBS, MD, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={profileData.institution}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        institution: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="Enter institution name"
                  />
                </div>
                <div>
                  <Label htmlFor="certifications">Certifications & Awards</Label>
                  <Textarea
                    id="certifications"
                    value={profileData.certifications}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        certifications: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    rows={3}
                    placeholder="List your certifications, awards, and recognitions..."
                  />
                </div>
                <div>
                  <Label htmlFor="hospitalAffiliations">Hospital Affiliations</Label>
                  <Textarea
                    id="hospitalAffiliations"
                    value={profileData.hospitalAffiliations}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        hospitalAffiliations: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    rows={2}
                    placeholder="List hospitals where you practice..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Practice Information */}
            <Card>
              <CardHeader>
                <CardTitle>Practice Information</CardTitle>
                <CardDescription>
                  Consultation and availability details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    value={profileData.availability}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        availability: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="Monday to Friday, 9:00 AM - 5:00 PM"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    rows={4}
                    placeholder="Write a brief professional biography..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>
                  Person to contact in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={profileData.emergencyContactName}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          emergencyContactName: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContact">Phone Number</Label>
                    <Input
                      id="emergencyContact"
                      value={profileData.emergencyContact}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          emergencyContact: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter emergency contact number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelation">Relationship</Label>
                    <Input
                      id="emergencyContactRelation"
                      value={profileData.emergencyContactRelation}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          emergencyContactRelation: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter relationship"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
              <div className="text-blue-800 text-sm">
                <strong>Important:</strong> Please keep your professional profile information
                up to date. Accurate credentials and contact information are essential for
                patient trust and regulatory compliance. Contact the medical board if you need
                to update your license information.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DoctorLayout>
  );
}
