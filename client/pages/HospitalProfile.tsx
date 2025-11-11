import { HospitalLayout } from "../components/HospitalLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { User, MapPin, Phone, FileText } from "lucide-react";
import { useState, useEffect } from "react";

export default function HospitalProfile() {
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

  if (loading) {
    return (
      <HospitalLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading hospital profile...</p>
        </div>
      </HospitalLayout>
    );
  }

  return (
    <HospitalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Profile</h1>
          <p className="text-gray-600 mt-2">
            View and manage your hospital information
          </p>
        </div>

        {hospitalData && (
          <>
            {/* Hospital Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Hospital Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hospital Name</p>
                    <p className="text-lg font-semibold">
                      {hospitalData.hospital_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hospital Type</p>
                    <p className="text-lg font-semibold">
                      {hospitalData.hospital_type || "Not specified"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="text-lg font-semibold">{hospitalData.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Contact Phone</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {hospitalData.phone_number || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">License Number</p>
                    <p className="text-lg font-semibold">
                      {hospitalData.license_number || "Not provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Hospital Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ambulances</p>
                    <p className="text-3xl font-bold text-red-600">
                      {hospitalData.number_of_ambulances || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Beds</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {hospitalData.number_of_beds || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className="text-lg font-semibold">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm ${
                          hospitalData.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {hospitalData.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Departments */}
            {hospitalData.departments && (
              <Card>
                <CardHeader>
                  <CardTitle>Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hospitalData.departments
                      .split(",")
                      .map((dept: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {dept.trim()}
                        </span>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Google Map */}
            {hospitalData.google_map_enabled && hospitalData.google_map_link && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Hospital location is available on Google Maps. Click below to
                    view the location.
                  </p>
                  <button
                    onClick={() =>
                      window.open(hospitalData.google_map_link, "_blank")
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View on Google Maps
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Account Created */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created On</p>
                    <p className="text-lg font-semibold">
                      {hospitalData.created_at
                        ? new Date(hospitalData.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                    <p className="text-lg font-semibold">
                      {hospitalData.updated_at
                        ? new Date(hospitalData.updated_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </HospitalLayout>
  );
}
