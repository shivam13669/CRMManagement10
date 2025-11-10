import { useState, useEffect } from "react";
import { StaffLayout } from "../components/StaffLayout";
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
  Briefcase,
  Clock,
  Award,
  Shield,
  Settings,
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

export default function StaffProfile() {
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
    
    // Fields that will be empty initially (not asked during signup for staff)
    dateOfBirth: "",
    gender: "",
    address: "",
    employeeId: "",
    department: "",
    position: "",
    joiningDate: "",
    shift: "",
    supervisor: "",
    workLocation: "",
    extensionNumber: "",
    qualification: "",
    certifications: "",
    specialSkills: "",
    emergencyContact: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    bloodGroup: "",
    nationality: "",
    maritalStatus: "",
    languages: "",
    previousExperience: "",
    performanceRating: "",
    lastPromotion: "",
    contractType: "",
    salaryGrade: "",
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

  const departments = [
    "Emergency Services",
    "Patient Care",
    "Administration", 
    "Pharmacy",
    "Laboratory",
    "Radiology",
    "IT Support",
    "Security",
    "Housekeeping",
    "Finance"
  ];

  const shifts = [
    "Morning (7 AM - 3 PM)",
    "Evening (3 PM - 11 PM)",
    "Night (11 PM - 7 AM)",
    "Rotating",
    "Flexible"
  ];

  const contractTypes = ["Permanent", "Contract", "Part-time", "Intern"];
  const genders = ["male", "female", "other"];
  const maritalStatuses = ["single", "married", "divorced", "widowed"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const relations = ["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"];

  // Calculate years of service
  const yearsOfService = profileData.joiningDate 
    ? new Date().getFullYear() - new Date(profileData.joiningDate).getFullYear()
    : 0;

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
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
                  <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-16 h-16 text-white" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
                      <Camera className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profileData.name || "Staff Member"}
                </h2>
                <p className="text-green-600 font-medium">{profileData.position || "Staff Member"}</p>
                <p className="text-gray-600 text-sm">{profileData.department || "Department not specified"}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {profileData.employeeId && (
                    <div className="flex items-center justify-center space-x-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span>ID: {profileData.employeeId}</span>
                    </div>
                  )}
                  {profileData.phone && (
                    <div className="flex items-center justify-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}
                  {profileData.joiningDate && (
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{yearsOfService} years of service</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Work Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Work Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Department</span>
                  <span className="font-medium text-sm">{profileData.department || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shift</span>
                  <span className="font-medium text-sm">{profileData.shift || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Performance</span>
                  {profileData.performanceRating ? (
                    <Badge variant={profileData.performanceRating === "Excellent" ? "default" : "secondary"}>
                      {profileData.performanceRating}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">Not rated</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract</span>
                  {profileData.contractType ? (
                    <Badge variant="outline">{profileData.contractType}</Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">Not specified</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  View Certifications
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Attendance Records
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Settings
                </Button>
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
                        setProfileData((prev) => ({ ...prev, maritalStatus: value }))
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
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={profileData.bloodGroup}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({ ...prev, bloodGroup: value }))
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

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Employment Information
                </CardTitle>
                <CardDescription>
                  Work-related details and responsibilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={profileData.employeeId}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          employeeId: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter employee ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={profileData.department}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({ ...prev, department: value }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter job position"
                    />
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={profileData.joiningDate}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          joiningDate: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shift">Work Shift</Label>
                    <Select
                      value={profileData.shift}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({ ...prev, shift: value }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select work shift" />
                      </SelectTrigger>
                      <SelectContent>
                        {shifts.map((shift) => (
                          <SelectItem key={shift} value={shift}>
                            {shift}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <Input
                      id="supervisor"
                      value={profileData.supervisor}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          supervisor: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter supervisor name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workLocation">Work Location</Label>
                    <Input
                      id="workLocation"
                      value={profileData.workLocation}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          workLocation: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter work location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="extensionNumber">Extension Number</Label>
                    <Input
                      id="extensionNumber"
                      value={profileData.extensionNumber}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          extensionNumber: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter extension number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractType">Contract Type</Label>
                    <Select
                      value={profileData.contractType}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({ ...prev, contractType: value }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select contract type" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salaryGrade">Salary Grade</Label>
                    <Input
                      id="salaryGrade"
                      value={profileData.salaryGrade}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          salaryGrade: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter salary grade"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Qualifications & Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Qualifications & Skills
                </CardTitle>
                <CardDescription>
                  Educational background and professional skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="qualification">Educational Qualification</Label>
                  <Input
                    id="qualification"
                    value={profileData.qualification}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        qualification: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="Enter educational qualification"
                  />
                </div>
                <div>
                  <Label htmlFor="certifications">Certifications</Label>
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
                    rows={2}
                    placeholder="List your professional certifications..."
                  />
                </div>
                <div>
                  <Label htmlFor="specialSkills">Special Skills</Label>
                  <Textarea
                    id="specialSkills"
                    value={profileData.specialSkills}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        specialSkills: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    rows={2}
                    placeholder="Describe your special skills and expertise..."
                  />
                </div>
                <div>
                  <Label htmlFor="previousExperience">Previous Experience</Label>
                  <Textarea
                    id="previousExperience"
                    value={profileData.previousExperience}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        previousExperience: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                    rows={2}
                    placeholder="Describe your previous work experience..."
                  />
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
                    <Label htmlFor="emergencyContactRelation">Relationship</Label>
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
          </div>
        </div>

        {/* Important Notice */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-green-600 mt-0.5">ℹ️</div>
              <div className="text-green-800 text-sm">
                <strong>Note:</strong> Please keep your profile information up to date.
                Any changes to employment details require approval from your supervisor.
                Contact HR department for assistance with sensitive information updates.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
