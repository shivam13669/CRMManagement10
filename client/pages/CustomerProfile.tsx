import { useState, useEffect } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
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
  Heart,
  Activity,
  Shield,
  FileText,
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
import { Badge } from "../components/ui/badge";
import { authApi } from "../lib/api";

export default function PatientProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get basic data from localStorage, rest will be empty until user fills them
  const userName = localStorage.getItem("userName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userPhone = localStorage.getItem("userPhone") || "";

  const [profileData, setProfileData] = useState({
    // Basic info from signup - these will be populated
    name: userName,
    email: userEmail,
    phone: userPhone,

    // Fields that will be empty initially (not asked during signup)
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    allergies: "",
    medicalConditions: "",
    currentMedications: "",
    insurance: "",
    insurancePolicyNumber: "",
    occupation: "",
    height: "",
    weight: "",
    maritalStatus: "",
    nationality: "",
    preferredLanguage: "",
    smokingStatus: "never",
    alcoholConsumption: "never",
    exerciseFrequency: "",
    dietaryPreferences: "",
    previousSurgeries: "",
    familyMedicalHistory: "",
    primaryPhysician: "",
    preferredHospital: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.data?.user) {
        const user = response.data.user;
        setProfileData((prev) => ({
          ...prev,
          name: user.full_name || userName,
          email: user.email || userEmail,
          phone: user.phone || userPhone,
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
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

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genders = ["male", "female", "other"];
  const maritalStatuses = ["single", "married", "divorced", "widowed"];
  const relations = ["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"];
  const smokingStatuses = ["never", "former", "current"];
  const alcoholOptions = ["never", "rarely", "occasional", "regular"];
  const exerciseOptions = [
    "sedentary",
    "1-2 times a week",
    "3-4 times a week",
    "daily",
    "multiple times daily",
  ];

  // Calculate BMI
  const bmi =
    profileData.height && profileData.weight
      ? (
          parseInt(profileData.weight) /
          Math.pow(parseInt(profileData.height) / 100, 2)
        ).toFixed(1)
      : "N/A";

  // Calculate age
  const age = profileData.dateOfBirth
    ? new Date().getFullYear() - new Date(profileData.dateOfBirth).getFullYear()
    : "N/A";

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your personal and medical information
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
                  <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mx-auto">
                    <User className="w-16 h-16 text-white" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
                      <Camera className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profileData.name || "Patient"}
                </h2>
                <p className="text-primary font-medium">Patient</p>
                <p className="text-gray-600 text-sm">{profileData.email}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {profileData.phone && (
                    <div className="flex items-center justify-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}
                  {profileData.dateOfBirth && (
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Age: {age} years</span>
                    </div>
                  )}
                  {profileData.bloodGroup && (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="w-4 h-4 text-center">🩸</span>
                      <span>{profileData.bloodGroup}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Health Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Health Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Height</span>
                  <span className="font-medium">
                    {profileData.height
                      ? `${profileData.height} cm`
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight</span>
                  <span className="font-medium">
                    {profileData.weight
                      ? `${profileData.weight} kg`
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BMI</span>
                  <span className="font-medium">{bmi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blood Group</span>
                  {profileData.bloodGroup ? (
                    <Badge variant="outline">{profileData.bloodGroup}</Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">Not provided</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Lifestyle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exercise</span>
                  <span className="font-medium text-sm">
                    {profileData.exerciseFrequency || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Diet</span>
                  <span className="font-medium text-sm">
                    {profileData.dietaryPreferences || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Smoking</span>
                  <Badge
                    variant={
                      profileData.smokingStatus === "never"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {profileData.smokingStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
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
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={profileData.maritalStatus}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          maritalStatus: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        {maritalStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={profileData.nationality}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          nationality: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter nationality"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredLanguage">
                      Preferred Language
                    </Label>
                    <Input
                      id="preferredLanguage"
                      value={profileData.preferredLanguage}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          preferredLanguage: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter preferred language"
                    />
                  </div>
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={profileData.occupation}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          occupation: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter occupation"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        value={profileData.height}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            height: e.target.value,
                          }))
                        }
                        disabled={!isEditing}
                        className="mt-1"
                        placeholder="Height"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        value={profileData.weight}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            weight: e.target.value,
                          }))
                        }
                        disabled={!isEditing}
                        className="mt-1"
                        placeholder="Weight"
                      />
                    </div>
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

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Medical Information
                </CardTitle>
                <CardDescription>
                  Important medical history and health information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={profileData.bloodGroup}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          bloodGroup: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="primaryPhysician">Primary Physician</Label>
                    <Input
                      id="primaryPhysician"
                      value={profileData.primaryPhysician}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          primaryPhysician: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter primary physician name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={profileData.allergies}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        allergies: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="List any known allergies..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="medicalConditions">Chronic Conditions</Label>
                  <Textarea
                    id="medicalConditions"
                    value={profileData.medicalConditions}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        medicalConditions: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="List any chronic conditions or ongoing medical issues..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="currentMedications">
                    Current Medications
                  </Label>
                  <Textarea
                    id="currentMedications"
                    value={profileData.currentMedications}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        currentMedications: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="List all current medications with dosage..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="previousSurgeries">Previous Surgeries</Label>
                  <Textarea
                    id="previousSurgeries"
                    value={profileData.previousSurgeries}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        previousSurgeries: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="List any previous surgeries with dates..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="familyMedicalHistory">
                    Family Medical History
                  </Label>
                  <Textarea
                    id="familyMedicalHistory"
                    value={profileData.familyMedicalHistory}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        familyMedicalHistory: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="Describe relevant family medical history..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Lifestyle & Habits
                </CardTitle>
                <CardDescription>
                  Information about your lifestyle and health habits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smokingStatus">Smoking Status</Label>
                    <Select
                      value={profileData.smokingStatus}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          smokingStatus: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {smokingStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="alcoholConsumption">
                      Alcohol Consumption
                    </Label>
                    <Select
                      value={profileData.alcoholConsumption}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          alcoholConsumption: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {alcoholOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="exerciseFrequency">
                      Exercise Frequency
                    </Label>
                    <Select
                      value={profileData.exerciseFrequency}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          exerciseFrequency: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select exercise frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {exerciseOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dietaryPreferences">
                      Dietary Preferences
                    </Label>
                    <Input
                      id="dietaryPreferences"
                      value={profileData.dietaryPreferences}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          dietaryPreferences: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="e.g., Vegetarian, Vegan, etc."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Emergency Contact
                </CardTitle>
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
                    <Label htmlFor="emergencyContactRelation">
                      Relationship
                    </Label>
                    <Select
                      value={profileData.emergencyContactRelation}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          emergencyContactRelation: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {relations.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Insurance Information
                </CardTitle>
                <CardDescription>Health insurance details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance">Insurance Provider</Label>
                    <Input
                      id="insurance"
                      value={profileData.insurance}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          insurance: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter insurance provider"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                    <Input
                      id="insurancePolicyNumber"
                      value={profileData.insurancePolicyNumber}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          insurancePolicyNumber: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter policy number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredHospital">
                      Preferred Hospital
                    </Label>
                    <Input
                      id="preferredHospital"
                      value={profileData.preferredHospital}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          preferredHospital: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter preferred hospital"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-amber-600 mt-0.5">⚠️</div>
              <div className="text-amber-800 text-sm">
                <strong>Important:</strong> Please keep your profile information
                up to date. Accurate medical information is crucial for
                providing you with the best possible care. Contact our support
                team if you need assistance updating sensitive medical
                information.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
