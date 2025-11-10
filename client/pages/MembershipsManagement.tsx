import { useState } from "react";
import { Layout } from "../components/Layout";
import {
  CreditCard,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Star,
  Gift,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export default function MembershipsManagement() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for demonstration
  const membershipStats = {
    totalMembers: 1250,
    activeMembers: 1120,
    newThisMonth: 45,
    revenue: 125000,
    premiumMembers: 320,
    basicMembers: 800,
    familyMembers: 130,
  };

  const membershipPlans = [
    {
      id: 1,
      name: "Basic Plan",
      price: 299,
      duration: "Monthly",
      features: [
        "General Consultation",
        "Basic Health Checkup",
        "Prescription Management",
        "Emergency Support",
      ],
      members: 800,
      status: "active",
      color: "blue",
    },
    {
      id: 2,
      name: "Premium Plan",
      price: 599,
      duration: "Monthly",
      features: [
        "All Basic Features",
        "Specialist Consultation",
        "Advanced Diagnostics",
        "Priority Booking",
        "Home Visits",
      ],
      members: 320,
      status: "active",
      color: "purple",
    },
    {
      id: 3,
      name: "Family Plan",
      price: 999,
      duration: "Monthly",
      features: [
        "All Premium Features",
        "Up to 6 Family Members",
        "Health Insurance Support",
        "Annual Health Package",
        "24/7 Doctor Availability",
      ],
      members: 130,
      status: "active",
      color: "green",
    },
  ];

  const recentMembers = [
    {
      id: 1,
      name: "Rajesh Kumar",
      email: "rajesh@email.com",
      plan: "Premium Plan",
      joinDate: "2024-01-15",
      status: "active",
      amount: 599,
    },
    {
      id: 2,
      name: "Priya Sharma",
      email: "priya@email.com",
      plan: "Basic Plan",
      joinDate: "2024-01-14",
      status: "active",
      amount: 299,
    },
    {
      id: 3,
      name: "Amit Patel",
      email: "amit@email.com",
      plan: "Family Plan",
      joinDate: "2024-01-13",
      status: "pending",
      amount: 999,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanColor = (color: string) => {
    const colors = {
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      green: "bg-green-500",
    };
    return colors[color as keyof typeof colors] || "bg-blue-500";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Memberships Management</h1>
            <p className="text-gray-600 mt-2">
              Manage member plans, subscriptions, and payments
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              Export Report
            </Button>
            <Button className="w-full sm:w-auto">
              Add New Plan
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {membershipStats.totalMembers.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Members</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {membershipStats.activeMembers.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Active Members</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    +{membershipStats.newThisMonth}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">New This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₹{membershipStats.revenue.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Monthly Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 lg:w-fit lg:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">Membership Plans</TabsTrigger>
            <TabsTrigger value="members">Recent Members</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Plan Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of membership plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm font-medium">Basic Plan</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {membershipStats.basicMembers} members
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-sm font-medium">Premium Plan</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {membershipStats.premiumMembers} members
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm font-medium">Family Plan</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {membershipStats.familyMembers} members
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Insights</CardTitle>
                  <CardDescription>
                    Monthly revenue breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Basic Plans</span>
                      <span className="text-sm text-gray-600">
                        ₹{(membershipStats.basicMembers * 299).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Premium Plans</span>
                      <span className="text-sm text-gray-600">
                        ₹{(membershipStats.premiumMembers * 599).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Family Plans</span>
                      <span className="text-sm text-gray-600">
                        ₹{(membershipStats.familyMembers * 999).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total Revenue</span>
                        <span>₹{membershipStats.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {membershipPlans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getPlanColor(plan.color)}`}></div>
                        <span>{plan.name}</span>
                      </CardTitle>
                      {plan.name === "Premium Plan" && (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <CardDescription>
                      {plan.members} active members
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">₹{plan.price}</div>
                      <div className="text-sm text-gray-600">per {plan.duration.toLowerCase()}</div>
                    </div>
                    
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit Plan
                      </Button>
                      <Button size="sm" className="flex-1">
                        View Members
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Member Registrations</CardTitle>
                <CardDescription>
                  Latest members who joined the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium">{member.name}</h3>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Email: {member.email}</p>
                          <p>Plan: {member.plan}</p>
                          <p>Joined: {new Date(member.joinDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className="text-lg font-bold">₹{member.amount}</div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
