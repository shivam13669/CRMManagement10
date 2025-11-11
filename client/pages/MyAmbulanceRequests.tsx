import { useState, useEffect } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import {
  Truck,
  Clock,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  FileText,
  Hospital,
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
import { Separator } from "../components/ui/separator";

interface AmbulanceRequest {
  id: number;
  pickup_address: string;
  destination_address: string;
  emergency_type: string;
  patient_condition: string;
  contact_number: string;
  status: string;
  priority: string;
  notes: string;
  is_read?: number;
  forwarded_to_hospital_id?: number;
  hospital_response?: string;
  hospital_response_notes?: string;
  hospital_response_date?: string;
  assigned_ambulance_id?: number;
  ambulance_registration?: string;
  ambulance_type?: string;
  ambulance_driver_name?: string;
  ambulance_driver_phone?: string;
  created_at: string;
  assigned_staff_name: string;
  assigned_staff_phone?: string;
}

export default function MyAmbulanceRequests() {
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState<boolean>(false);

  const fetchRequests = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No token found - user needs to log in");
        setAuthError(true);
        setRequests([]);
        return;
      }

      setAuthError(false);
      const response = await fetch("/api/ambulance/customer", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else if (response.status === 401 || response.status === 403) {
        // Authentication/authorization error
        setAuthError(true);
        setRequests([]);
      } else {
        console.error("Failed to fetch ambulance requests:", response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
      }
    } catch (error) {
      console.error("Error fetching ambulance requests:", error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle authentication error by redirecting to login
  useEffect(() => {
    if (authError) {
      // Clear any invalid tokens
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
    }
  }, [authError]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "assigned":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Assigned
          </Badge>
        );
      case "forwarded_to_hospital":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Forwarded to Hospital
          </Badge>
        );
      case "hospital_accepted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Hospital Accepted
          </Badge>
        );
      case "hospital_rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Hospital Rejected
          </Badge>
        );
      case "on_the_way":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            On The Way
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            High
          </Badge>
        );
      case "normal":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Normal
          </Badge>
        );
      case "low":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Low
          </Badge>
        );
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "assigned":
        return <User className="w-4 h-4 text-blue-600" />;
      case "forwarded_to_hospital":
        return <Hospital className="w-4 h-4 text-purple-600" />;
      case "hospital_accepted":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "hospital_rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "on_the_way":
        return <Truck className="w-4 h-4 text-orange-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - past.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">
            Loading your ambulance requests...
          </span>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Ambulance Requests
            </h1>
            <p className="text-gray-600 mt-1">
              Track your emergency ambulance service requests
            </p>
          </div>
          <Button
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Authentication Error */}
        {authError && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">
                  Authentication Required
                </h3>
                <p className="text-yellow-700 mt-1">
                  Please log out and log back in to access your ambulance
                  requests.
                </p>
              </div>
              <Button
                onClick={() => (window.location.href = "/login")}
                className="ml-auto"
              >
                Go to Login
              </Button>
            </div>
          </div>
        )}

        {/* Emergency Contact Banner */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Emergency Contact
              </h3>
              <p className="text-red-700">
                For urgent emergencies, call 108 immediately
              </p>
            </div>
            <Button
              variant="destructive"
              className="ml-auto bg-red-600 hover:bg-red-700"
              onClick={() => window.open("tel:108")}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call 108
            </Button>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Ambulance Requests
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't made any ambulance requests yet.
              </p>
              <Button
                onClick={() => (window.location.href = "/request-ambulance")}
              >
                <Truck className="w-4 h-4 mr-2" />
                Request Ambulance
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <CardTitle className="text-lg">
                          {request.emergency_type}
                        </CardTitle>
                        <CardDescription>
                          Request #{request.id} •{" "}
                          {formatDateTime(request.created_at)} •{" "}
                          {getTimeAgo(request.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Patient Condition */}
                  {request.patient_condition && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          Patient Condition
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        {request.patient_condition}
                      </p>
                    </div>
                  )}

                  {/* Pickup Address */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Pickup Address
                      </div>
                      <div className="text-gray-600 text-sm">
                        {request.pickup_address}
                      </div>
                    </div>
                  </div>

                  {/* Destination (if available) */}
                  {request.destination_address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">
                          Destination
                        </div>
                        <div className="text-gray-600 text-sm">
                          {request.destination_address}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Number */}
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900">
                        Contact:{" "}
                      </span>
                      <span className="text-gray-600">
                        {request.contact_number}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Staff (if available) */}
                  {request.assigned_staff_name && (
                    <>
                      <Separator />
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            Assigned Staff
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-blue-800 font-medium">
                            {request.assigned_staff_name}
                          </div>
                          {request.assigned_staff_phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3 h-3 text-blue-600" />
                              <span className="text-blue-700 text-sm">
                                {request.assigned_staff_phone}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() =>
                                  window.open(
                                    `tel:${request.assigned_staff_phone}`,
                                  )
                                }
                              >
                                Call
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes (if available) */}
                  {request.notes && (
                    <>
                      <Separator />
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            Staff Notes
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{request.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Hospital Response (if available) */}
                  {request.hospital_response && (
                    <>
                      <Separator />
                      <div
                        className={`p-3 rounded-lg ${
                          request.hospital_response === "accepted"
                            ? "bg-green-50"
                            : request.hospital_response === "rejected"
                              ? "bg-red-50"
                              : "bg-yellow-50"
                        }`}
                      >
                        <div
                          className={`flex items-center space-x-2 mb-2 ${
                            request.hospital_response === "accepted"
                              ? "text-green-900"
                              : request.hospital_response === "rejected"
                                ? "text-red-900"
                                : "text-yellow-900"
                          }`}
                        >
                          {request.hospital_response === "accepted" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : request.hospital_response === "rejected" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          <span className="font-semibold">
                            Hospital Response:{" "}
                            <span className="capitalize">
                              {request.hospital_response}
                            </span>
                          </span>
                        </div>
                        {request.hospital_response_notes && (
                          <p
                            className={`text-sm ${
                              request.hospital_response === "accepted"
                                ? "text-green-800"
                                : request.hospital_response === "rejected"
                                  ? "text-red-800"
                                  : "text-yellow-800"
                            }`}
                          >
                            {request.hospital_response_notes}
                          </p>
                        )}
                        {request.hospital_response_date && (
                          <p
                            className={`text-xs mt-2 ${
                              request.hospital_response === "accepted"
                                ? "text-green-700"
                                : request.hospital_response === "rejected"
                                  ? "text-red-700"
                                  : "text-yellow-700"
                            }`}
                          >
                            {new Date(
                              request.hospital_response_date,
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Assigned Ambulance (if available) */}
                  {request.ambulance_registration && (
                    <>
                      <Separator />
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Truck className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-900">
                            Assigned Ambulance
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-red-800">
                              Registration:{" "}
                            </span>
                            <span className="text-red-700">
                              {request.ambulance_registration}
                            </span>
                          </div>
                          {request.ambulance_type && (
                            <div>
                              <span className="font-medium text-red-800">
                                Type:{" "}
                              </span>
                              <span className="text-red-700">
                                {request.ambulance_type}
                              </span>
                            </div>
                          )}
                          {request.ambulance_driver_name && (
                            <div>
                              <span className="font-medium text-red-800">
                                Driver:{" "}
                              </span>
                              <span className="text-red-700">
                                {request.ambulance_driver_name}
                              </span>
                            </div>
                          )}
                          {request.ambulance_driver_phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3 h-3 text-red-600" />
                              <span className="text-red-700 text-sm">
                                {request.ambulance_driver_phone}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() =>
                                  window.open(
                                    `tel:${request.ambulance_driver_phone}`,
                                  )
                                }
                              >
                                Call
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Status Progress */}
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={`flex items-center space-x-2 ${["pending", "assigned", "forwarded_to_hospital", "hospital_accepted", "hospital_rejected", "on_the_way", "completed"].includes(request.status) ? "text-blue-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${["pending", "assigned", "forwarded_to_hospital", "hospital_accepted", "hospital_rejected", "on_the_way", "completed"].includes(request.status) ? "bg-blue-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">Requested</span>
                      </div>
                      <div className="text-gray-300">→</div>
                      <div
                        className={`flex items-center space-x-2 ${["assigned", "forwarded_to_hospital", "hospital_accepted", "hospital_rejected", "on_the_way", "completed"].includes(request.status) ? "text-blue-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${["assigned", "forwarded_to_hospital", "hospital_accepted", "hospital_rejected", "on_the_way", "completed"].includes(request.status) ? "bg-blue-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">Assigned</span>
                      </div>
                      <div className="text-gray-300">→</div>
                      <div
                        className={`flex items-center space-x-2 ${["forwarded_to_hospital", "hospital_accepted", "hospital_rejected", "on_the_way", "completed"].includes(request.status) ? "text-purple-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${["forwarded_to_hospital", "hospital_accepted", "hospital_rejected", "on_the_way", "completed"].includes(request.status) ? "bg-purple-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">Hospital</span>
                      </div>
                      <div className="text-gray-300">→</div>
                      <div
                        className={`flex items-center space-x-2 ${["on_the_way", "completed"].includes(request.status) ? "text-orange-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${["on_the_way", "completed"].includes(request.status) ? "bg-orange-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">En Route</span>
                      </div>
                      <div className="text-gray-300">→</div>
                      <div
                        className={`flex items-center space-x-2 ${request.status === "completed" ? "text-green-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${request.status === "completed" ? "bg-green-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
