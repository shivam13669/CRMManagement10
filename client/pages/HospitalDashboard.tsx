import { HospitalLayout } from "../components/HospitalLayout";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Users,
  Package,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  MapPin,
  Phone,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";

export default function HospitalDashboard() {
  const hospitalName = localStorage.getItem("hospitalName") || "Hospital";
  const navigate = useNavigate();
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const fetchHospitalData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/hospital/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHospitalData(data.hospital);
      }
    } catch (error) {
      console.error("Failed to fetch hospital data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Ambulances",
      value: hospitalData?.number_of_ambulances || 0,
      icon: Truck,
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Hospital Beds",
      value: hospitalData?.number_of_beds || 0,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Departments",
      value: hospitalData?.departments
        ? hospitalData.departments.split(",").length
        : 0,
      icon: BarChart3,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Active Status",
      value: "Active",
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
    },
  ];

  const quickActions = [
    {
      title: "View Ambulances",
      description: "Manage ambulances and requests",
      icon: Truck,
      href: "/hospital-ambulances",
      color: "bg-red-500",
    },
    {
      title: "Staff Management",
      description: "Manage hospital staff",
      icon: Users,
      href: "/hospital-staff",
      color: "bg-blue-500",
    },
    {
      title: "Inventory",
      description: "Manage hospital inventory",
      icon: Package,
      href: "/hospital-inventory",
      color: "bg-green-500",
    },
    {
      title: "Reports",
      description: "View hospital reports",
      icon: BarChart3,
      href: "/hospital-reports",
      color: "bg-purple-500",
    },
  ];

  return (
    <HospitalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {hospitalName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your hospital operations efficiently
          </p>
        </div>

        {/* Hospital Info Card */}
        {hospitalData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Hospital Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Hospital Name</p>
                  <p className="text-lg font-semibold">
                    {hospitalData.hospital_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hospital Type</p>
                  <p className="text-lg font-semibold">
                    {hospitalData.hospital_type || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-lg font-semibold">
                    {hospitalData.address}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {hospitalData.phone_number || "Not provided"}
                    </p>
                  </div>
                  {hospitalData.google_map_enabled &&
                    hospitalData.google_map_link && (
                      <Button
                        onClick={() =>
                          window.open(hospitalData.google_map_link, "_blank")
                        }
                        variant="outline"
                        size="sm"
                        className="mt-6"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View Map
                      </Button>
                    )}
                </div>
                {hospitalData.license_number && (
                  <div>
                    <p className="text-sm text-gray-500">License Number</p>
                    <p className="text-lg font-semibold">
                      {hospitalData.license_number}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <Card key={stat.title} className="rounded-2xl shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full ${stat.color}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Card
                  key={action.href}
                  className="hover:shadow-lg transition-shadow cursor-pointer rounded-2xl"
                  onClick={() => navigate(action.href)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full ${action.color} text-white mb-3`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Section */}
        <Card className="rounded-2xl shadow-md bg-white">
          <CardHeader>
            <CardTitle>Hospital Status</CardTitle>
            <CardDescription>
              Overview of your hospital operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">System Status</p>
                    <p className="text-sm text-gray-600">
                      All systems operational
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {hospitalData?.updated_at
                        ? new Date(hospitalData.updated_at).toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
