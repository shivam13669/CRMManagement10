import { useState, useEffect } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import { Layout } from "../components/Layout";
import { DoctorLayout } from "../components/DoctorLayout";
import { StaffLayout } from "../components/StaffLayout";
import { Truck, Phone, Clock, MapPin, AlertTriangle } from "lucide-react";
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

export default function Ambulance() {
  const [userRole, setUserRole] = useState<string>("");
  const [formData, setFormData] = useState({
    emergencyType: "",
    patientName: "",
    age: "",
    gender: "",
    contactNumber: "",
    pickupAddress: "",
    destinationAddress: "",
    patientCondition: "",
    priority: "normal",
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    setUserRole(role);
  }, []);

  const emergencyTypes = [
    "Heart Attack",
    "Stroke",
    "Accident",
    "Breathing Difficulty",
    "Severe Bleeding",
    "Unconscious",
    "Burns",
    "Poisoning",
    "Fracture",
    "Other Emergency",
  ];

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.emergencyType ||
      !formData.patientName ||
      !formData.age ||
      !formData.gender ||
      !formData.contactNumber ||
      !formData.pickupAddress ||
      !formData.patientCondition
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("You must be logged in to request ambulance service");
        return;
      }

      const response = await fetch("/api/ambulance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup_address: formData.pickupAddress,
          destination_address:
            formData.destinationAddress || "Emergency Hospital",
          emergency_type: formData.emergencyType,
          patient_condition: `Patient: ${formData.patientName}, Age: ${formData.age}, Gender: ${formData.gender}. Condition: ${formData.patientCondition}`,
          contact_number: formData.contactNumber,
          priority: formData.priority,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Emergency ambulance request submitted successfully! Request ID: ${data.requestId}. Our team will respond immediately. Please keep the patient calm and stay on the line.`,
        );

        // Reset form
        setFormData({
          emergencyType: "",
          patientName: "",
          age: "",
          gender: "",
          contactNumber: "",
          pickupAddress: "",
          destinationAddress: "",
          patientCondition: "",
          priority: "normal",
        });

        // Redirect to My Ambulance Requests for customers
        if (userRole === "customer") {
          setTimeout(() => {
            window.location.href = "/my-ambulance-requests";
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to submit ambulance request: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error submitting ambulance request:", error);
      alert("Failed to submit ambulance request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getLayoutComponent = () => {
    switch (userRole) {
      case "admin":
        return Layout;
      case "doctor":
        return DoctorLayout;
      case "staff":
        return StaffLayout;
      case "customer":
      default:
        return CustomerLayout;
    }
  };

  const LayoutComponent = getLayoutComponent();

  return (
    <LayoutComponent>
      <div className="space-y-6">
        {/* Emergency Header */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-red-800">
                Emergency Ambulance Service
              </h1>
              <p className="text-red-700 mt-1">
                For life-threatening emergencies, call 108 immediately
              </p>
            </div>
            <Button
              variant="destructive"
              className="ml-auto bg-red-600 hover:bg-red-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call 108
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ambulance Request Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ambulance Request Form</CardTitle>
                <CardDescription>
                  Please fill in all details for quick response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="emergencyType">Type of Emergency</Label>
                    <Select
                      value={formData.emergencyType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          emergencyType: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select emergency type" />
                      </SelectTrigger>
                      <SelectContent>
                        {emergencyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        value={formData.patientName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patientName: e.target.value,
                          }))
                        }
                        className="mt-1"
                        placeholder="Full name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            age: e.target.value,
                          }))
                        }
                        className="mt-1"
                        placeholder="Age"
                        min="0"
                        max="150"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, gender: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactNumber: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Enter 10 digit mobile number"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      minLength={10}
                      onInput={(e) => {
                        const input = e.target as HTMLInputElement;
                        input.value = input.value.replace(/[^0-9]/g, "");
                        if (input.value.length > 10) {
                          input.value = input.value.slice(0, 10);
                        }
                        setFormData((prev) => ({
                          ...prev,
                          contactNumber: input.value,
                        }));
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="pickupAddress">Complete Address</Label>
                    <Textarea
                      id="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pickupAddress: e.target.value,
                        }))
                      }
                      className="mt-1"
                      rows={3}
                      placeholder="House number, street, area, city, pincode"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="patientCondition">Patient Condition</Label>
                    <Textarea
                      id="patientCondition"
                      value={formData.patientCondition}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          patientCondition: e.target.value,
                        }))
                      }
                      className="mt-1"
                      rows={3}
                      placeholder="Describe the current condition, symptoms, or what happened..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <Truck className="w-5 h-5 mr-2" />
                        Request Ambulance Now
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Numbers & Instructions */}
          <div className="space-y-6">
            {/* Emergency Numbers */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">
                  Emergency Numbers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <div className="font-semibold text-red-800">
                      National Emergency
                    </div>
                    <div className="text-sm text-red-600">All emergencies</div>
                  </div>
                  <div className="text-xl font-bold text-red-600">108</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <div className="font-semibold text-red-800">Police</div>
                    <div className="text-sm text-red-600">Crime & Safety</div>
                  </div>
                  <div className="text-xl font-bold text-red-600">100</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <div className="font-semibold text-red-800">
                      Fire Brigade
                    </div>
                    <div className="text-sm text-red-600">Fire emergencies</div>
                  </div>
                  <div className="text-xl font-bold text-red-600">101</div>
                </div>
              </CardContent>
            </Card>

            {/* While You Wait Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>While You Wait</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Keep the patient calm and comfortable</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Do not move the patient unless necessary</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Gather important medical documents</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Stay with the patient until help arrives</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Have someone wait outside to guide the ambulance</span>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-800">
                      Average Response Time
                    </div>
                    <div className="text-sm text-blue-600">
                      8-12 minutes in city limits
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
}
