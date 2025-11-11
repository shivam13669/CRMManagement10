import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Activity, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { authApi, authUtils } from "../lib/api";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState<
    "unknown" | "granted" | "denied" | "prompt"
  >("unknown");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    agreeToTerms: false,
    // Signup captured location (for customers)
    signup_address: "",
    signup_lat: "",
    signup_lng: "",
    // Doctor specific fields
    specialization: "",
    licenseNumber: "",
    experienceYears: "",
    consultationFee: "",
  });

  // Reverse geocode helper (OpenStreetMap Nominatim)
  const reverseGeocode = async (lat: string, lng: string) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat,
      )}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return data.display_name || null;
    } catch (err) {
      console.error("Reverse geocode failed", err);
      return null;
    }
  };

  // Request location when role set to customer
  useEffect(() => {
    let permWatcher: any = null;
    const requestLocation = async () => {
      if (!("geolocation" in navigator)) {
        setLocationStatus("denied");
        return;
      }

      // Prefer Permissions API to check state first
      try {
        if (
          (navigator as any).permissions &&
          (navigator as any).permissions.query
        ) {
          const p = await (navigator as any).permissions.query({
            name: "geolocation",
          });
          setLocationStatus(p.state || "unknown");

          const handlePosSuccess = async (pos: GeolocationPosition) => {
            const lat = pos.coords.latitude.toString();
            const lng = pos.coords.longitude.toString();
            const address = await reverseGeocode(lat, lng);
            setFormData((prev) => ({
              ...prev,
              signup_lat: lat,
              signup_lng: lng,
              signup_address: address || `${lat},${lng}`,
            }));
            setLocationStatus("granted");
          };

          const handlePosError = (err: GeolocationPositionError) => {
            console.warn("Geolocation permission denied or failed", err);
            setLocationStatus("denied");
            setFormData((prev) => ({
              ...prev,
              signup_lat: "",
              signup_lng: "",
              signup_address: "",
            }));
          };

          if (p.state === "granted") {
            navigator.geolocation.getCurrentPosition(
              handlePosSuccess,
              handlePosError,
              { enableHighAccuracy: true, timeout: 10000 },
            );
          } else if (p.state === "prompt") {
            // Trigger prompt
            navigator.geolocation.getCurrentPosition(
              handlePosSuccess,
              handlePosError,
              { enableHighAccuracy: true, timeout: 10000 },
            );
          } else {
            // denied
            setLocationStatus("denied");
            setFormData((prev) => ({
              ...prev,
              signup_lat: "",
              signup_lng: "",
              signup_address: "",
            }));
          }

          permWatcher = () => setLocationStatus((p as any).state || "unknown");
          // some browsers expose onchange handler
          if (typeof p.onchange === "function")
            p.onchange = () => setLocationStatus((p as any).state || "unknown");
        } else {
          // Fallback: directly prompt
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude.toString();
              const lng = pos.coords.longitude.toString();
              const address = await reverseGeocode(lat, lng);
              setFormData((prev) => ({
                ...prev,
                signup_lat: lat,
                signup_lng: lng,
                signup_address: address || `${lat},${lng}`,
              }));
              setLocationStatus("granted");
            },
            (err) => {
              console.warn("Geolocation permission denied or failed", err);
              setLocationStatus("denied");
              setFormData((prev) => ({
                ...prev,
                signup_lat: "",
                signup_lng: "",
                signup_address: "",
              }));
            },
            { enableHighAccuracy: true, timeout: 10000 },
          );
        }
      } catch (e) {
        // If permissions API throws, fallback to direct prompt
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude.toString();
            const lng = pos.coords.longitude.toString();
            const address = await reverseGeocode(lat, lng);
            setFormData((prev) => ({
              ...prev,
              signup_lat: lat,
              signup_lng: lng,
              signup_address: address || `${lat},${lng}`,
            }));
            setLocationStatus("granted");
          },
          (err) => {
            console.warn("Geolocation permission denied or failed", err);
            setLocationStatus("denied");
            setFormData((prev) => ({
              ...prev,
              signup_lat: "",
              signup_lng: "",
              signup_address: "",
            }));
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
    };

    if (formData.role === "customer") {
      requestLocation();
    } else {
      // Clear any captured location when role changes away from customer
      setLocationStatus("unknown");
      setFormData((prev) => ({
        ...prev,
        signup_lat: "",
        signup_lng: "",
        signup_address: "",
      }));
    }

    return () => {
      // cleanup if needed
      permWatcher = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.role]);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (!formData.role) {
      setError("Please select your role");
      setLoading(false);
      return;
    }
    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions");
      setLoading(false);
      return;
    }

    // If customer role, ensure location was captured (user granted permission)
    if (formData.role === "customer" && !formData.signup_address) {
      setError(
        "Location permission is required for customer accounts. Please enable location access.",
      );
      setLoading(false);
      return;
    }

    // Validate doctor specific fields
    if (formData.role === "doctor") {
      if (
        !formData.specialization ||
        !formData.licenseNumber ||
        !formData.experienceYears ||
        !formData.consultationFee
      ) {
        setError("Please fill all doctor specific fields");
        setLoading(false);
        return;
      }
      if (
        isNaN(Number(formData.experienceYears)) ||
        Number(formData.experienceYears) < 0
      ) {
        setError("Experience years must be a valid number");
        setLoading(false);
        return;
      }
      if (
        isNaN(Number(formData.consultationFee)) ||
        Number(formData.consultationFee) <= 0
      ) {
        setError("Consultation fee must be a valid amount");
        setLoading(false);
        return;
      }
    }

    try {
      const registrationData: any = {
        username: formData.email.split("@")[0], // Use email prefix as username
        email: formData.email,
        password: formData.password,
        role: formData.role as "admin" | "doctor" | "customer" | "staff",
        full_name: formData.name,
        phone: formData.phone,
        // If customer and address captured, include it
        ...(formData.role === "customer" &&
          formData.signup_address && {
            address: formData.signup_address,
            signup_lat: formData.signup_lat,
            signup_lng: formData.signup_lng,
          }),
        // Doctor specific fields
        ...(formData.role === "doctor" && {
          specialization: formData.specialization,
          license_number: formData.licenseNumber,
          experience_years: Number(formData.experienceYears),
          consultation_fee: Number(formData.consultationFee),
        }),
      };

      const response = await authApi.register(registrationData);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        if (response.data.requiresApproval) {
          // Show approval message for doctors/staff
          alert(
            `Registration request submitted successfully! Your ${response.data.role} account will be activated after admin approval. You will receive notification once approved.`,
          );
          navigate("/login");
        } else {
          // Direct login for customers
          authUtils.setAuthData(response.data.token, response.data.user);

          // Navigate based on role
          switch (response.data.user.role) {
            case "customer":
              navigate("/customer-dashboard");
              break;
            default:
              navigate("/dashboard");
          }
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const features = [
    "Patient Management System",
    "Appointment Scheduling",
    "Medical Records Storage",
    "Billing & Payments",
    "Analytics & Reports",
    "24/7 Support",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">
              ML Support
            </span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-gray-600">
              Start managing your healthcare operations today
            </p>

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
                {(error.includes("already exists") ||
                  error.includes("already in use")) &&
                  import.meta.env.DEV && (
                    <button
                      type="button"
                      onClick={async () => {
                        const { debugApi } = await import("../lib/debug");
                        const result = await debugApi.resetDatabase();
                        if ("message" in result) {
                          alert(
                            "Database reset! Please restart server and try again.",
                          );
                        } else {
                          alert("Reset failed: " + result.error);
                        }
                      }}
                      className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      🔄 Reset Database (Dev Only)
                    </button>
                  )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                I am a
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">
                    Customer - Book appointments, request services
                  </SelectItem>
                  <SelectItem value="doctor">
                    Doctor - Manage customers and reports
                  </SelectItem>
                  <SelectItem value="staff">
                    Staff - Handle ambulance and complaints
                  </SelectItem>
                </SelectContent>
              </Select>
              {formData.role === "customer" && locationStatus === "denied" && (
                <p className="mt-2 text-sm text-red-600">
                  Location permission denied. Please enable location access in
                  your browser to create a customer account.
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="Enter 10 digit mobile number"
                pattern="[0-9]{10}"
                maxLength={10}
                minLength={10}
                onInput={(e) => {
                  // Only allow numeric input
                  const input = e.target as HTMLInputElement;
                  input.value = input.value.replace(/[^0-9]/g, "");
                  if (input.value.length > 10) {
                    input.value = input.value.slice(0, 10);
                  }
                  handleInputChange(e as React.ChangeEvent<HTMLInputElement>);
                }}
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="Enter your email"
              />
            </div>

            {/* Doctor Specific Fields */}
            {formData.role === "doctor" && (
              <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-blue-900">
                    Doctor Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="specialization"
                      className="text-sm font-medium text-gray-700"
                    >
                      Specialization *
                    </Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      type="text"
                      required
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="e.g., Cardiology, Neurology"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="licenseNumber"
                      className="text-sm font-medium text-gray-700"
                    >
                      License Number *
                    </Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Medical license number"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="experienceYears"
                      className="text-sm font-medium text-gray-700"
                    >
                      Experience (Years) *
                    </Label>
                    <Input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      min="0"
                      max="50"
                      required
                      value={formData.experienceYears}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Years of practice"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="consultationFee"
                      className="text-sm font-medium text-gray-700"
                    >
                      Consultation Fee (₹) *
                    </Label>
                    <Input
                      id="consultationFee"
                      name="consultationFee"
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={formData.consultationFee}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Fee per consultation"
                    />
                  </div>
                </div>

                <div className="bg-blue-100 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your doctor registration will be
                    reviewed by our admin team. You'll receive an email
                    notification once your account is approved.
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, agreeToTerms: !!checked }))
                }
                className="mt-1"
              />
              <Label
                htmlFor="agreeToTerms"
                className="text-sm text-gray-600 leading-relaxed"
              >
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                loading ||
                !formData.agreeToTerms ||
                (formData.role === "customer" && !formData.signup_address)
              }
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Features banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary to-accent relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold">ML Support</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Everything you need to manage healthcare
            </h1>
            <p className="text-xl text-white/90 leading-relaxed mb-8">
              Join thousands of healthcare providers who trust ML Support for
              their daily operations.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-white" />
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="text-lg font-semibold mb-2">Free 30-day trial</div>
            <div className="text-white/80">
              No credit card required. Start managing your healthcare operations
              immediately.
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
}
