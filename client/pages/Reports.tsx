import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import {
  BarChart3,
  Users,
  UserCheck,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  FileText,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
} from "lucide-react";

interface DashboardStats {
  totalCustomers: number;
  totalDoctors: number;
  totalAppointments: number;
  totalComplaints: number;
  totalFeedback: number;
  revenueThisMonth: number;
  activeUsers: number;
  pendingRegistrations: number;
}

interface CustomerGrowth {
  month: string;
  customers: number;
  doctors: number;
}

interface AppointmentStats {
  status: string;
  count: number;
  percentage: number;
}

interface ComplaintStats {
  type: string;
  count: number;
  avgRating: number;
  resolvedPercentage: number;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - In a real app, this would come from APIs
  const customerGrowth: CustomerGrowth[] = [
    { month: "Jan", customers: 120, doctors: 15 },
    { month: "Feb", customers: 135, doctors: 16 },
    { month: "Mar", customers: 148, doctors: 18 },
    { month: "Apr", customers: 162, doctors: 19 },
    { month: "May", customers: 178, doctors: 20 },
    { month: "Jun", customers: 195, doctors: 22 },
  ];

  const appointmentStats: AppointmentStats[] = [
    { status: "Completed", count: 245, percentage: 68 },
    { status: "Pending", count: 58, percentage: 16 },
    { status: "Confirmed", count: 42, percentage: 12 },
    { status: "Cancelled", count: 15, percentage: 4 },
  ];

  const complaintStats: ComplaintStats[] = [
    { type: "Service", count: 23, avgRating: 4.2, resolvedPercentage: 87 },
    { type: "Facility", count: 18, avgRating: 3.8, resolvedPercentage: 94 },
    { type: "Staff", count: 12, avgRating: 4.1, resolvedPercentage: 92 },
    { type: "Doctor", count: 8, avgRating: 4.5, resolvedPercentage: 100 },
    { type: "Billing", count: 15, avgRating: 3.9, resolvedPercentage: 80 },
  ];

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, selectedPeriod]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStats({
        totalCustomers: 195,
        totalDoctors: 22,
        totalAppointments: 360,
        totalComplaints: 76,
        totalFeedback: 142,
        revenueThisMonth: 45600,
        activeUsers: 198,
        pendingRegistrations: 5,
      });
    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportsData();
    setRefreshing(false);
  };

  const exportReport = (type: string) => {
    // Mock export functionality
    console.log(`Exporting ${type} report...`);
    // In a real app, this would generate and download a file
  };

  if (loading && !stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading reports data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights into your healthcare management system
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-w-[100px]"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>

            <Button onClick={() => exportReport("summary")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalCustomers || 0}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Doctors
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalDoctors || 0}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2 new this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Appointments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalAppointments || 0}
                  </p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -5% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Revenue (MTD)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{stats?.revenueThisMonth?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +8% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
            <TabsTrigger value="feedback">Feedback & Complaints</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer & Doctor Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Growth Trends
                  </CardTitle>
                  <CardDescription>
                    Customer and doctor registration trends over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Customers
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Doctors
                      </span>
                    </div>
                    {/* Simple text-based chart */}
                    <div className="space-y-2">
                      {customerGrowth.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="w-12">{item.month}</span>
                          <div className="flex-1 flex items-center gap-4 ml-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 bg-blue-500 rounded"
                                style={{
                                  width: `${(item.customers / 200) * 100}px`,
                                }}
                              ></div>
                              <span className="text-xs text-gray-600">
                                {item.customers}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 bg-green-500 rounded"
                                style={{
                                  width: `${(item.doctors / 25) * 100}px`,
                                }}
                              ></div>
                              <span className="text-xs text-gray-600">
                                {item.doctors}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Health
                  </CardTitle>
                  <CardDescription>
                    Current system status and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Active Users
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {stats?.activeUsers} Online
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Pending Registrations
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-yellow-600 border-yellow-200"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {stats?.pendingRegistrations} Pending
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Database Status
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Healthy
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Server Uptime
                      </span>
                      <span className="text-sm font-medium">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Status Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of appointments by status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointmentStats.map((stat, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              stat.status === "Completed" && "bg-green-500",
                              stat.status === "Pending" && "bg-yellow-500",
                              stat.status === "Confirmed" && "bg-blue-500",
                              stat.status === "Cancelled" && "bg-red-500",
                            )}
                          ></div>
                          <span className="text-sm font-medium">
                            {stat.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {stat.count}
                          </span>
                          <Badge variant="secondary">{stat.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Appointment Trends</CardTitle>
                  <CardDescription>
                    Daily appointment bookings this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day, index) => {
                      const count = Math.floor(Math.random() * 20) + 5;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium w-20">
                            {day}
                          </span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(count / 25) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customer Analytics Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Age 18-30</span>
                        <span>35%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: "35%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Age 31-50</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: "45%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Age 51+</span>
                        <span>20%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: "20%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { condition: "Hypertension", count: 45 },
                      { condition: "Diabetes", count: 38 },
                      { condition: "Allergies", count: 29 },
                      { condition: "Asthma", count: 22 },
                      { condition: "Heart Disease", count: 15 },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{item.condition}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-green-600">
                        4.6
                      </div>
                      <div className="flex justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-4 h-4",
                              star <= 4.6
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300",
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Average Rating
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      Based on {stats?.totalFeedback} reviews
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feedback & Complaints Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feedback & Complaint Analysis</CardTitle>
                <CardDescription>
                  Detailed breakdown of customer feedback and complaints by
                  category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaintStats.map((stat, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{stat.type}</h4>
                        <Badge variant="outline">{stat.count} cases</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Average Rating:</span>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="font-medium">
                              {stat.avgRating}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "w-3 h-3",
                                    star <= stat.avgRating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300",
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-600">
                            Resolution Rate:
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-medium">
                              {stat.resolvedPercentage}%
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${stat.resolvedPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-600">Status:</span>
                          <div className="mt-1">
                            <Badge
                              variant={
                                stat.resolvedPercentage >= 90
                                  ? "default"
                                  : "secondary"
                              }
                              className={cn(
                                stat.resolvedPercentage >= 90
                                  ? "bg-green-600"
                                  : "bg-yellow-600",
                              )}
                            >
                              {stat.resolvedPercentage >= 90
                                ? "Excellent"
                                : "Needs Attention"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Monthly revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Consultation Fees
                      </span>
                      <span className="font-medium">₹32,400</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Emergency Services
                      </span>
                      <span className="font-medium">₹8,900</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Ambulance Services
                      </span>
                      <span className="font-medium">₹4,300</span>
                    </div>
                    <hr />
                    <div className="flex items-center justify-between font-medium">
                      <span>Total Revenue</span>
                      <span className="text-green-600">₹45,600</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Distribution of payment methods used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        method: "Credit/Debit Card",
                        percentage: 45,
                        amount: "₹20,520",
                      },
                      {
                        method: "UPI/Digital Wallet",
                        percentage: 35,
                        amount: "₹15,960",
                      },
                      { method: "Cash", percentage: 15, amount: "���6,840" },
                      { method: "Insurance", percentage: 5, amount: "₹2,280" },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{item.method}</span>
                          <span className="font-medium">{item.amount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.percentage}% of total
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Reports
            </CardTitle>
            <CardDescription>
              Download detailed reports in various formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => exportReport("patients")}
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Customer Report (PDF)
              </Button>
              <Button
                variant="outline"
                onClick={() => exportReport("appointments")}
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Appointments Report (Excel)
              </Button>
              <Button
                variant="outline"
                onClick={() => exportReport("financial")}
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Financial Report (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
