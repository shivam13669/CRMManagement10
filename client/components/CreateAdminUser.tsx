import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "../hooks/use-toast";
import statesDistrictsData from "../../shared/india-states-districts.json";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";

interface CreateAdminUserProps {
  onSuccess?: () => void;
}

export function CreateAdminUser({ onSuccess }: CreateAdminUserProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [adminType, setAdminType] = useState<"system" | "state">("state");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    state: "",
    district: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available states
  const states = statesDistrictsData.states;
  const selectedState = states.find((s) => s.name === formData.state);
  const districts = selectedState?.districts || [];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (adminType === "state") {
      if (!formData.state) {
        newErrors.state = "State is required";
      }

      if (!formData.district) {
        newErrors.district = "District is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          admin_type: adminType,
          state: adminType === "state" ? formData.state : null,
          district: adminType === "state" ? formData.district : null,
        }),
      });

      let responseData: any;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (response.ok && responseData) {
        setShowSuccess(true);
        setFormData({
          full_name: "",
          email: "",
          password: "",
          confirmPassword: "",
          state: "",
          district: "",
        });
        setErrors({});

        toast({
          title: "Success",
          description: `Admin user ${responseData.user.full_name} created successfully!`,
        });

        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorMessage =
          responseData?.error || "Failed to create admin user";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating the admin user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <Card className="border-green-200 bg-green-50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Admin user created successfully!</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Admin User
          </CardTitle>
          <CardDescription>
            Create a new administrator user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Admin Type Selection */}
            <div>
              <Label htmlFor="admin_type" className="text-sm font-medium">
                Admin Type
              </Label>
              <Select value={adminType} onValueChange={(value: any) => setAdminType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admin type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Admin</SelectItem>
                  <SelectItem value="state">State Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name Field */}
            <div>
              <Label htmlFor="full_name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="full_name"
                placeholder="Enter admin name"
                value={formData.full_name}
                onChange={(e) => {
                  setFormData({ ...formData, full_name: e.target.value });
                  if (errors.full_name) {
                    setErrors({ ...errors, full_name: "" });
                  }
                }}
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) {
                    setErrors({ ...errors, email: "" });
                  }
                }}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* State Field - Only for State Admins */}
            {adminType === "state" && (
              <div>
                <Label htmlFor="state" className="text-sm font-medium">
                  State
                </Label>
                <Select value={formData.state} onValueChange={(value) => {
                  setFormData({ ...formData, state: value, district: "" });
                  if (errors.state) {
                    setErrors({ ...errors, state: "" });
                  }
                }}>
                  <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.name} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.state}
                  </p>
                )}
              </div>
            )}

            {/* District Field - Only for State Admins */}
            {adminType === "state" && (
              <div>
                <Label htmlFor="district" className="text-sm font-medium">
                  District
                </Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => {
                    setFormData({ ...formData, district: value });
                    if (errors.district) {
                      setErrors({ ...errors, district: "" });
                    }
                  }}
                  disabled={!formData.state}
                >
                  <SelectTrigger className={errors.district ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.district && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.district}
                  </p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) {
                    setErrors({ ...errors, password: "" });
                  }
                }}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: "" });
                  }
                }}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Creating..." : "Create Admin User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
