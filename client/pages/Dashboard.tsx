import { Layout } from "../components/Layout";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Customers",
      value: "2,543",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      description: "Active customers in system",
    },
    {
      title: "Appointments Today",
      value: "47",
      change: "+3",
      changeType: "positive" as const,
      icon: Calendar,
      description: "Scheduled for today",
    },
    {
      title: "Active Memberships",
      value: "1,891",
      change: "+23%",
      changeType: "positive" as const,
      icon: CreditCard,
      description: "Current active members",
    },
    {
      title: "Pending Payments",
      value: "$12,450",
      change: "-8%",
      changeType: "negative" as const,
      icon: DollarSign,
      description: "Outstanding payments",
    },
  ];

  const recentAppointments = [
    {
      customer: "Sarah Johnson",
      doctor: "Dr. Smith",
      time: "9:00 AM",
      status: "confirmed",
    },
    {
      customer: "Michael Brown",
      doctor: "Dr. Wilson",
      time: "10:30 AM",
      status: "pending",
    },
    {
      customer: "Emily Davis",
      doctor: "Dr. Jones",
      time: "2:00 PM",
      status: "confirmed",
    },
    {
      customer: "James Miller",
      doctor: "Dr. Taylor",
      time: "3:30 PM",
      status: "cancelled",
    },
    {
      customer: "Lisa Garcia",
      doctor: "Dr. Anderson",
      time: "4:00 PM",
      status: "confirmed",
    },
  ];

  const alerts = [
    {
      type: "critical",
      message: "Medicine stock running low: Paracetamol (12 units left)",
    },
    { type: "warning", message: "3 appointments require confirmation" },
    { type: "info", message: "Monthly report is ready for review" },
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

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50 text-red-800";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-800";
      default:
        return "border-gray-200 bg-gray-50 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening with your healthcare
            operations.
          </p>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
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
                  <span className="text-sm text-gray-500">from last month</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Today's Appointments</span>
                </CardTitle>
                <CardDescription>
                  Upcoming appointments scheduled for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAppointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {appointment.customer}
                        </div>
                        <div className="text-sm text-gray-500">
                          with {appointment.doctor}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">
                          {appointment.time}
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
          </div>

          {/* Alerts and Quick Actions */}
          <div className="space-y-6">
            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>System Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg text-sm ${getAlertColor(alert.type)}`}
                  >
                    {alert.message}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => navigate("/customers")}
                >
                  <div className="font-medium text-gray-900">
                    Add New Customer
                  </div>
                  <div className="text-sm text-gray-500">
                    Register a new customer
                  </div>
                </button>
                <button
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => navigate("/appointments")}
                >
                  <div className="font-medium text-gray-900">
                    Schedule Appointment
                  </div>
                  <div className="text-sm text-gray-500">
                    Book a new appointment
                  </div>
                </button>
                <button
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => navigate("/ambulance")}
                >
                  <div className="font-medium text-gray-900">
                    Emergency Call
                  </div>
                  <div className="text-sm text-gray-500">
                    Request ambulance service
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Overview</span>
            </CardTitle>
            <CardDescription>Key metrics from the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">94%</div>
                <div className="text-sm text-gray-500">
                  Customer Satisfaction
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">87%</div>
                <div className="text-sm text-gray-500">
                  Appointment Completion
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">12 min</div>
                <div className="text-sm text-gray-500">Avg. Wait Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">$45,230</div>
                <div className="text-sm text-gray-500">Monthly Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
