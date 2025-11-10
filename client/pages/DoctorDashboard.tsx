import { DoctorLayout } from "../components/DoctorLayout";
import {
  Users,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Activity,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function DoctorDashboard() {
  const userName = localStorage.getItem("userName") || "Doctor";

  const stats = [
    {
      title: "Total Customers",
      value: "156",
      change: "+8",
      color: "bg-blue-500",
      icon: Users,
    },
    {
      title: "Today's Appointments",
      value: "12",
      change: "+2",
      color: "bg-green-500",
      icon: Calendar,
    },
    {
      title: "Pending Reports",
      value: "7",
      change: "-3",
      color: "bg-orange-500",
      icon: FileText,
    },
    {
      title: "Messages",
      value: "23",
      change: "+5",
      color: "bg-purple-500",
      icon: MessageSquare,
    },
  ];

  const todayAppointments = [
    {
      customer: "John Smith",
      time: "9:00 AM",
      type: "Consultation",
      status: "confirmed",
    },
    {
      customer: "Sarah Wilson",
      time: "10:30 AM",
      type: "Follow-up",
      status: "confirmed",
    },
    {
      customer: "Mike Johnson",
      time: "2:00 PM",
      type: "Check-up",
      status: "pending",
    },
    {
      customer: "Lisa Davis",
      time: "3:30 PM",
      type: "Consultation",
      status: "confirmed",
    },
    {
      customer: "Tom Brown",
      time: "4:00 PM",
      type: "Follow-up",
      status: "confirmed",
    },
  ];

  const recentMessages = [
    {
      customer: "John Smith",
      message: "Experiencing mild pain after medication",
      time: "2 hours ago",
      unread: true,
    },
    {
      customer: "Sarah Wilson",
      message: "Thank you for the treatment",
      time: "5 hours ago",
      unread: false,
    },
    {
      customer: "Mike Johnson",
      message: "Question about diet restrictions",
      time: "1 day ago",
      unread: true,
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
    <DoctorLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, Dr. {userName}!
          </h1>
          <p className="text-blue-100">
            Manage your customers, review appointments, and provide excellent
            healthcare services.
          </p>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow rounded-2xl shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.title}</div>
                    <div className="text-xs text-green-600 font-medium">
                      {stat.change} from yesterday
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Today's Appointments</span>
                  </span>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {appointment.customer}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.type}
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
              </CardContent>
            </Card>
          </div>

          {/* Messages & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Messages */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Recent Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg ${message.unread ? "bg-blue-50 border-blue-200" : "bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {message.customer}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.message}</p>
                    {message.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  View All Messages
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">
                    Add Customer Notes
                  </div>
                  <div className="text-sm text-gray-500">
                    Update customer records
                  </div>
                </button>
                <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">
                    Schedule Follow-up
                  </div>
                  <div className="text-sm text-gray-500">
                    Book next appointment
                  </div>
                </button>
                <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">
                    Generate Report
                  </div>
                  <div className="text-sm text-gray-500">
                    Create medical report
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Summary */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>This Week's Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">42</div>
                <div className="text-sm text-gray-500">Customers Served</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">38</div>
                <div className="text-sm text-gray-500">Reports Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">15</div>
                <div className="text-sm text-gray-500">Follow-ups</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">95%</div>
                <div className="text-sm text-gray-500">
                  Customer Satisfaction
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DoctorLayout>
  );
}
