import { useEffect, useState } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Truck,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Heart,
  Thermometer,
  Activity,
  DollarSign,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { getLocationWithPermission } from "../lib/location";

export default function CustomerDashboard() {
  const userName = localStorage.getItem("userName") || "Customer";
  const navigate = useNavigate();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);

  useEffect(() => {
    const requestLocationOnFirstLogin = async () => {
      if (locationRequested) return;

      setLocationRequested(true);

      // Check if location permission was already asked
      const permissionStatus = localStorage.getItem("locationPermission");
      if (!permissionStatus) {
        // First time - show dialog and request location
        setShowLocationDialog(true);
      }
    };

    requestLocationOnFirstLogin();
  }, [locationRequested]);

  const handleAllowLocation = async () => {
    try {
      await getLocationWithPermission();
      setShowLocationDialog(false);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const handleDenyLocation = () => {
    localStorage.setItem(
      "locationPermission",
      JSON.stringify({ allowed: false, timestamp: Date.now() }),
    );
    setShowLocationDialog(false);
  };

  const quickActions = [
    {
      title: "Book Appointment",
      description: "Schedule a visit with your doctor",
      icon: Calendar,
      href: "/book-appointment",
      color: "bg-blue-500",
    },
    {
      title: "Request Ambulance",
      description: "Emergency ambulance service",
      icon: Truck,
      href: "/request-ambulance",
      color: "bg-red-500",
    },
    {
      title: "Submit Feedback",
      description: "Share your experience with us",
      icon: MessageSquare,
      href: "/feedback",
      color: "bg-green-500",
    },
    {
      title: "View Reports",
      description: "Access your medical records",
      icon: FileText,
      href: "/medical-reports",
      color: "bg-purple-500",
    },
  ];

  const upcomingAppointments = [
    {
      doctor: "Dr. Sharma",
      specialty: "Cardiologist",
      date: "Today, 2:00 PM",
      status: "confirmed",
    },
    {
      doctor: "Dr. Patel",
      specialty: "General Medicine",
      date: "Tomorrow, 10:30 AM",
      status: "pending",
    },
    {
      doctor: "Dr. Singh",
      specialty: "Orthopedic",
      date: "Dec 28, 3:00 PM",
      status: "confirmed",
    },
  ];

  const healthMetrics = [
    { label: "Blood Pressure", value: "120/80", icon: Heart, status: "normal" },
    {
      label: "Temperature",
      value: "98.6°F",
      icon: Thermometer,
      status: "normal",
    },
    { label: "Heart Rate", value: "72 bpm", icon: Activity, status: "normal" },
  ];

  const recentActivity = [
    {
      type: "appointment",
      message: "Appointment with Dr. Sharma completed",
      time: "2 hours ago",
    },
    {
      type: "payment",
      message: "Payment of ₹500 processed successfully",
      time: "1 day ago",
    },
    {
      type: "report",
      message: "Blood test results uploaded",
      time: "3 days ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-white/90">
            Manage your health appointments, request services, and stay
            connected with your healthcare providers.
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer rounded-2xl shadow-md"
                onClick={() => navigate(action.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center`}
                    >
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Upcoming Appointments</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/book-appointment")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {appointment.doctor}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.specialty}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">
                          {appointment.date}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {upcomingAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No upcoming appointments</p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => navigate("/book-appointment")}
                    >
                      Book Your First Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Health Metrics & Activity */}
          <div className="space-y-6">
            {/* Health Metrics */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>Health Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <metric.icon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        {metric.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metric.value}</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Contact */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">
                  Emergency Services
                </h3>
                <p className="text-red-700">
                  For immediate medical assistance, call 108 or request
                  ambulance service.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => navigate("/request-ambulance")}
              >
                <Truck className="w-4 h-4 mr-2" />
                Request Ambulance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Permission Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <DialogTitle>Location Permission Required</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="space-y-3">
            <div>
              We need your location to provide accurate ambulance emergency
              services.
            </div>
            <div className="text-sm text-gray-600">
              Your location will be shared with emergency response teams to
              ensure quick assistance.
            </div>
          </DialogDescription>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDenyLocation}
              className="flex-1"
            >
              Not Now
            </Button>
            <Button
              onClick={handleAllowLocation}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Allow Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
