import { useState, useEffect } from "react";
import { StaffLayout } from "../components/StaffLayout";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Clock,
  AlertCircle,
  Activity,
  CheckCircle,
  XCircle,
  Phone,
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

interface StaffDashboardData {
  ambulanceRequests: any[];
  stats: {
    totalRequests: number;
    pendingRequests: number;
    completedToday: number;
    assignedToMe: number;
  };
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem('userName') || 'Staff';

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const ambulanceRes = await fetch('/api/ambulance', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      const ambulanceRequests = ambulanceRes.ok ? (await ambulanceRes.json()).requests : [];

      const today = new Date().toISOString().split('T')[0];
      const pendingRequests = ambulanceRequests.filter((req: any) => req.status === 'pending').length;
      const completedToday = ambulanceRequests.filter((req: any) => 
        req.status === 'completed' && req.updated_at?.startsWith(today)
      ).length;

      // Assuming staff can be assigned to requests (would need user ID matching)
      const assignedToMe = ambulanceRequests.filter((req: any) => 
        req.assigned_staff_id === parseInt(localStorage.getItem('userId') || '0')
      ).length;

      setData({
        ambulanceRequests,
        stats: {
          totalRequests: ambulanceRequests.length,
          pendingRequests,
          completedToday,
          assignedToMe
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </StaffLayout>
    );
  }

  const stats = [
    {
      title: "Total Requests",
      value: data?.stats.totalRequests.toString() || "0",
      change: "All time",
      changeType: "positive" as const,
      icon: Truck,
      description: "Ambulance requests",
      onClick: () => navigate("/ambulance")
    },
    {
      title: "Pending Requests",
      value: data?.stats.pendingRequests.toString() || "0",
      change: "Need attention",
      changeType: data?.stats.pendingRequests ? "negative" : "positive" as const,
      icon: Clock,
      description: "Waiting for response",
      onClick: () => navigate("/ambulance")
    },
    {
      title: "Completed Today",
      value: data?.stats.completedToday.toString() || "0",
      change: "Today's work",
      changeType: "positive" as const,
      icon: CheckCircle,
      description: "Successfully handled",
      onClick: () => navigate("/ambulance")
    },
    {
      title: "Assigned to Me",
      value: data?.stats.assignedToMe.toString() || "0",
      change: "My tasks",
      changeType: data?.stats.assignedToMe ? "neutral" : "positive" as const,
      icon: Activity,
      description: "Your active cases",
      onClick: () => navigate("/ambulance")
    },
  ];

  const recentRequests = data?.ambulanceRequests.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "assigned":
      case "on_way":
        return "bg-blue-100 text-blue-800";
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
    <StaffLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-green-100">
            Manage ambulance services and emergency responses for our healthcare system.
          </p>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-blue-600"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Emergency Requests */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Recent Emergency Requests</span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => navigate("/ambulance")}>
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>
                  Latest ambulance service requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRequests.length > 0 ? (
                    recentRequests.map((request, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-gray-900">
                            {request.patient_name}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}
                            >
                              {request.priority}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}
                            >
                              {request.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Emergency:</span> {request.emergency_type}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{request.contact_number}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{request.pickup_address}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(request.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">No emergency requests</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button 
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => navigate("/ambulance")}
                >
                  <div className="font-medium text-gray-900">View All Requests</div>
                  <div className="text-sm text-gray-500">Manage ambulance requests</div>
                </button>
                <button 
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => navigate("/ambulance")}
                >
                  <div className="font-medium text-gray-900">Update Request Status</div>
                  <div className="text-sm text-gray-500">Mark requests as completed</div>
                </button>
                <button 
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => navigate("/feedback")}
                >
                  <div className="font-medium text-gray-900">Contact Patients</div>
                  <div className="text-sm text-gray-500">Communicate with patients</div>
                </button>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Today's Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {data?.stats.completedToday || 0}
                    </div>
                    <div className="text-sm text-gray-500">Completed Today</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {data?.stats.pendingRequests || 0}
                    </div>
                    <div className="text-sm text-gray-500">Pending Requests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {data?.stats.assignedToMe || 0}
                    </div>
                    <div className="text-sm text-gray-500">Assigned to You</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
