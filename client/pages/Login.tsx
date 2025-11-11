import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Activity, ShieldOff, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { authApi, authUtils } from "../lib/api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<
    "default" | "suspended" | "pending" | "rejected"
  >("default");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorType("default");

    try {
      const loginData = {
        email: formData.email,
        password: formData.password,
      };

      // Try regular login first
      let response = await authApi.login(loginData);

      // If regular login fails, try hospital login
      if (
        response.error &&
        response.error.includes("Invalid email or password")
      ) {
        response = await authApi.hospitalLogin(loginData);
      }

      if (response.error) {
        setError(response.error);

        // Check for specific error types from response data
        if (
          response.data?.type === "account_suspended" ||
          response.data?.status === "suspended"
        ) {
          setErrorType("suspended");
        } else if (response.data?.status === "pending_approval") {
          setErrorType("pending");
        } else if (response.data?.status === "rejected") {
          setErrorType("rejected");
        } else {
          setErrorType("default");
        }
        return;
      }

      if (response.data) {
        // Store auth data
        authUtils.setAuthData(response.data.token, response.data.user);

        // Store hospital name if hospital login
        if (response.data.hospital) {
          localStorage.setItem(
            "hospitalName",
            response.data.hospital.hospital_name,
          );
        }

        // Navigate based on role
        switch (response.data.user.role) {
          case "customer":
            navigate("/customer-dashboard");
            break;
          case "doctor":
            navigate("/doctor-dashboard");
            break;
          case "staff":
            navigate("/staff-dashboard");
            break;
          case "admin":
            navigate("/admin-dashboard");
            break;
          case "hospital":
            navigate("/hospital-dashboard");
            break;
          default:
            navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorType("default");
      if (error instanceof Error) {
        setError(`Network error: ${error.message}`);
      } else {
        setError("An error occurred during login. Please try again.");
      }
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

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold">ML Support</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Revolutionizing Healthcare Management
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Streamline your healthcare operations with our comprehensive CRM
              solution. Manage patients, appointments, and medical records all
              in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-2xl font-bold mb-2">10,000+</div>
              <div className="text-white/80">Patients Managed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-2xl font-bold mb-2">500+</div>
              <div className="text-white/80">Healthcare Providers</div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Right side - Login form */}
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
              Welcome back
            </h2>
            <p className="text-gray-600">Sign in to your account to continue</p>

            {/* Demo accounts info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Demo Info:</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <div>
                  Create an account first via Sign up, or use demo accounts if
                  available
                </div>
                <div className="mt-2 text-blue-600">
                  Real authentication now active!
                </div>
              </div>
            </div>

            {error && (
              <div
                className={`mt-4 p-4 rounded-lg border ${
                  errorType === "suspended"
                    ? "bg-orange-50 border-orange-200"
                    : errorType === "pending"
                      ? "bg-blue-50 border-blue-200"
                      : errorType === "rejected"
                        ? "bg-red-50 border-red-200"
                        : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {errorType === "suspended" ? (
                      <ShieldOff className={`w-5 h-5 text-orange-600`} />
                    ) : errorType === "pending" ? (
                      <Activity className={`w-5 h-5 text-blue-600`} />
                    ) : (
                      <AlertCircle className={`w-5 h-5 text-red-600`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-medium ${
                        errorType === "suspended"
                          ? "text-orange-800"
                          : errorType === "pending"
                            ? "text-blue-800"
                            : errorType === "rejected"
                              ? "text-red-800"
                              : "text-red-800"
                      }`}
                    >
                      {errorType === "suspended"
                        ? "Account Suspended"
                        : errorType === "pending"
                          ? "Account Pending Approval"
                          : errorType === "rejected"
                            ? "Registration Rejected"
                            : "Login Failed"}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        errorType === "suspended"
                          ? "text-orange-700"
                          : errorType === "pending"
                            ? "text-blue-700"
                            : errorType === "rejected"
                              ? "text-red-700"
                              : "text-red-700"
                      }`}
                    >
                      {error}
                    </p>
                    {errorType === "suspended" && (
                      <div className="mt-3 text-sm text-orange-600">
                        <strong>Need help?</strong> Contact support at
                        support@mlsupport.com or call +91-8000-000-000
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, rememberMe: !!checked }))
                  }
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <Link
                to="/signup"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign up
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:text-primary/80">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-primary hover:text-primary/80"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
