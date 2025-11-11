import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Truck,
  UserPlus,
  Clock,
  AlertCircle,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Stethoscope,
  Building2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { dataApi } from "../lib/api";
import { fetchWithAuth } from "../lib/fetchWithAuth";

interface DashboardData {
  customers: any[];
  doctors: any[];
  staff: any[];
  appointments: any[];
  ambulanceRequests: any[];
  feedback: any[];
  stats: {
    totalCustomers: number;
    totalDoctors: number;
    totalStaff: number;
    todayAppointments: number;
    pendingAmbulanceRequests: number;
    pendingFeedback: number;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        customersRes,
        doctorsRes,
        staffRes,
        appointmentsRes,
        ambulanceRes,
        feedbackRes,
      ] = await Promise.all([
        fetchWithAuth("/api/customers", {}),
        fetchWithAuth("/api/doctors", {}),
        fetchWithAuth("/api/admin/users/staff", {}),
        fetchWithAuth("/api/appointments", {}),
        fetchWithAuth("/api/ambulance", {}),
        fetchWithAuth("/api/admin/feedback", {}),
      ]);

      const customers = customersRes.ok
        ? (await customersRes.json()).customers
        : [];
      const doctors = doctorsRes.ok ? (await doctorsRes.json()).doctors : [];
      const staff = staffRes.ok ? (await staffRes.json()).users : [];
      const appointments = appointmentsRes.ok
        ? (await appointmentsRes.json()).appointments
        : [];
      const ambulanceRequests = ambulanceRes.ok
        ? (await ambulanceRes.json()).requests
        : [];
      const feedback = feedbackRes.ok
        ? (await feedbackRes.json()).feedback
        : [];

      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = appointments.filter(
        (apt: any) => apt.appointment_date === today,
      ).length;

      const pendingAmbulanceRequests = ambulanceRequests.filter(
        (req: any) => req.status === "pending",
      ).length;

      const pendingFeedback = feedback.filter(
        (fb: any) => fb.status === "pending",
      ).length;

      setData({
        customers,
        doctors,
        staff,
        appointments,
        ambulanceRequests,
        feedback,
        stats: {
          totalCustomers: customers.length,
          totalDoctors: doctors.length,
          totalStaff: staff.length,
          todayAppointments,
          pendingAmbulanceRequests,
          pendingFeedback,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
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

  const stats = [
    {
      title: "Total Customers",
      value: data?.stats.totalCustomers.toString() || "0",
      change: "+New signups",
      changeType: "positive" as const,
      icon: Users,
      description: "Registered customers",
      onClick: () => navigate("/customers"),
    },
    {
      title: "Total Doctors",
      value: data?.stats.totalDoctors.toString() || "0",
      change: "Active doctors",
      changeType: "positive" as const,
      icon: Stethoscope,
      description: "Healthcare providers",
      onClick: () => navigate("/doctors"),
    },
    {
      title: "Staff Members",
      value: data?.stats.totalStaff.toString() || "0",
      change: "Support team",
      changeType: "positive" as const,
      icon: UserPlus,
      description: "Active staff",
      onClick: () => navigate("/staff"),
    },
    {
      title: "Hospitals",
      value: "0",
      change: "Manage hospitals",
      changeType: "positive" as const,
      icon: Building2,
      description: "Hospital accounts",
      onClick: () => navigate("/hospital-management"),
    },
    {
      title: "Today's Appointments",
      value: data?.stats.todayAppointments.toString() || "0",
      change: "Scheduled today",
      changeType: "positive" as const,
      icon: Calendar,
      description: "Appointments for today",
      onClick: () => navigate("/appointments"),
    },
    {
      title: "Pending Ambulance",
      value: data?.stats.pendingAmbulanceRequests.toString() || "0",
      change: "Need attention",
      changeType: data?.stats.pendingAmbulanceRequests
        ? "negative"
        : ("positive" as const),
      icon: Truck,
      description: "Emergency requests",
      onClick: () => navigate("/ambulance"),
    },
    {
      title: "Pending Feedback",
      value: data?.stats.pendingFeedback.toString() || "0",
      change: "Need review",
      changeType: data?.stats.pendingFeedback
        ? "negative"
        : ("positive" as const),
      icon: AlertCircle,
      description: "Feedback & complaints",
      onClick: () => navigate("/feedback-management"),
    },
  ];

  const recentPatients = data?.customers.slice(0, 5) || [];
  const recentDoctors = data?.doctors.slice(0, 5) || [];
  const recentStaff = data?.staff.slice(0, 5) || [];
  const recentAppointments = data?.appointments.slice(0, 5) || [];
  const recentAmbulanceRequests = data?.ambulanceRequests.slice(0, 3) || [];
  // Get only the latest feedback (most recent one)
  const latestFeedback = data?.feedback.length ? [data.feedback[0]] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Complete overview of your healthcare system operations
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Activity className="w-4 h-4" />
            <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
          </button>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer rounded-2xl shadow-md"
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* First Row - Customers, Doctors, Staff */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Customers */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Recent Customers</span>
              </CardTitle>
              <CardDescription>Newly registered customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPatients.length > 0 ? (
                  recentPatients.map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {customer.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.email}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No customers registered yet
                  </p>
                )}
              </div>
              <div className="mt-4 text-center">
                <button
                  className="text-primary hover:text-primary/80 font-medium text-sm"
                  onClick={() => navigate("/customers")}
                >
                  View all customers →
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Doctors */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5" />
                <span>Recent Doctors</span>
              </CardTitle>
              <CardDescription>Healthcare providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDoctors.length > 0 ? (
                  recentDoctors.map((doctor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Dr. {doctor.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doctor.specialization}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        ₹{doctor.consultation_fee}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No doctors registered yet
                  </p>
                )}
              </div>
              <div className="mt-4 text-center">
                <button
                  className="text-primary hover:text-primary/80 font-medium text-sm"
                  onClick={() => navigate("/doctors")}
                >
                  View all doctors →
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Staff */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Staff Members</span>
              </CardTitle>
              <CardDescription>Support team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStaff.length > 0 ? (
                  recentStaff.map((staff, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {staff.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {staff.email}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {staff.status === "active" ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No staff members yet
                  </p>
                )}
              </div>
              <div className="mt-4 text-center">
                <button
                  className="text-primary hover:text-primary/80 font-medium text-sm"
                  onClick={() => navigate("/staff")}
                >
                  Manage staff →
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Appointments, Ambulance, Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Appointments</span>
              </CardTitle>
              <CardDescription>Latest appointment bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {appointment.patient_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.appointment_date} at{" "}
                          {appointment.appointment_time}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No appointments booked yet
                  </p>
                )}
              </div>
              <div className="mt-4 text-center">
                <button
                  className="text-primary hover:text-primary/80 font-medium text-sm"
                  onClick={() => navigate("/appointments")}
                >
                  View all appointments →
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Requests */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Emergency Requests</span>
              </CardTitle>
              <CardDescription>Ambulance service requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAmbulanceRequests.length > 0 ? (
                  recentAmbulanceRequests.map((request, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {request.patient_name}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}
                        >
                          {request.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.emergency_type}
                      </div>
                      {request.ambulance_registration && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          🚑 {request.ambulance_registration} (
                          {request.ambulance_type})
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No emergency requests
                  </p>
                )}
              </div>
              <div className="mt-4 text-center">
                <button
                  className="text-primary hover:text-primary/80 font-medium text-sm"
                  onClick={() => navigate("/ambulance")}
                >
                  View all requests →
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Recent Feedback</span>
              </CardTitle>
              <CardDescription>
                Most recent customer feedback or complaint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestFeedback.length > 0 ? (
                  latestFeedback.map((feedback, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {feedback.patient_name}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              feedback.type === "complaint"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {feedback.type}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}
                          >
                            {feedback.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {feedback.subject}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {feedback.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(feedback.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      No feedback received yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      The latest customer feedback will appear here
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <div className="flex gap-2">
                  <button
                    className="text-primary hover:text-primary/80 font-medium text-sm"
                    onClick={() => navigate("/feedback-management")}
                  >
                    View all feedback →
                  </button>
                  <button
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    onClick={() => navigate("/complaint-feedback-management")}
                  >
                    Response Ratings →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Overview */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Overview</span>
            </CardTitle>
            <CardDescription>
              Real-time healthcare system metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {data?.customers.length || 0}
                </div>
                <div className="text-sm text-gray-500">Total Customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">
                  {data?.doctors.length || 0}
                </div>
                <div className="text-sm text-gray-500">
                  Healthcare Providers
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {data?.staff.length || 0}
                </div>
                <div className="text-sm text-gray-500">Staff Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {data?.appointments.filter(
                    (apt) => apt.status === "confirmed",
                  ).length || 0}
                </div>
                <div className="text-sm text-gray-500">
                  Confirmed Appointments
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {data?.ambulanceRequests.filter(
                    (req) => req.status === "pending",
                  ).length || 0}
                </div>
                <div className="text-sm text-gray-500">Pending Emergencies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {data?.feedback.filter((fb) => fb.status === "pending")
                    .length || 0}
                </div>
                <div className="text-sm text-gray-500">Pending Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
