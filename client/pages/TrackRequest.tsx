import { useState, useEffect } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import {
  Truck,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
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
  created_at: string;
  forwarded_to_hospital_id?: number;
  hospital_response?: string;
  hospital_response_notes?: string;
  hospital_response_date?: string;
}

const statusSteps = [
  { key: "pending", label: "Request Received", icon: CheckCircle },
  {
    key: "forwarded_to_hospital",
    label: "Forwarded to Hospital",
    icon: Hospital,
  },
  { key: "hospital_accepted", label: "Hospital Accepted", icon: CheckCircle },
  { key: "hospital_rejected", label: "Hospital Rejected", icon: AlertCircle },
  { key: "on_the_way", label: "Ambulance On The Way", icon: Truck },
  { key: "completed", label: "Request Completed", icon: CheckCircle },
];

export default function TrackRequest() {
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<AmbulanceRequest | null>(null);

  const fetchRequests = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch("/api/ambulance/customer", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        console.error("Failed to fetch requests:", response.status);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Check if there's a requestId in the URL query params
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");

    if (requestId) {
      // When requests are loaded, find and select the specific request
      setTimeout(() => {
        const foundRequest = requests.find((r) => r.id === parseInt(requestId));
        if (foundRequest) {
          setSelectedRequest(foundRequest);
        }
      }, 500);
    }

    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "forwarded_to_hospital":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Forwarded
          </Badge>
        );
      case "hospital_accepted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Accepted
          </Badge>
        );
      case "hospital_rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Rejected
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
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
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

  const getStatusProgress = (status: string) => {
    const statusIndex = statusSteps.findIndex((step) => step.key === status);
    return statusIndex >= 0 ? statusIndex + 1 : 1;
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

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading your requests...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Track Request</h1>
            <p className="text-gray-600 mt-1">
              Live tracking of your ambulance requests
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

        {/* No requests */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Ambulance Requests
              </h3>
              <p className="text-gray-600">
                You haven't made any ambulance requests yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Request #{request.id}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatDateTime(request.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Emergency Type and Condition */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {request.emergency_type}
                    </h3>
                    {request.patient_condition && (
                      <p className="text-sm text-gray-600">
                        {request.patient_condition}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Location Information */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Pickup Location
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.pickup_address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Destination
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.destination_address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Contact Number
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.contact_number}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Status Timeline */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Status Timeline
                    </h3>
                    <div className="space-y-3">
                      {statusSteps.map((step, index) => {
                        const isCompleted =
                          getStatusProgress(request.status) > index;
                        const isCurrent = request.status === step.key;
                        const isRejected =
                          request.status === "hospital_rejected";

                        // Hide "On The Way" and "Completed" if request was rejected
                        if (
                          isRejected &&
                          (step.key === "on_the_way" ||
                            step.key === "completed")
                        ) {
                          return null;
                        }

                        return (
                          <div
                            key={step.key}
                            className="flex items-center space-x-3"
                          >
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted || isCurrent
                                  ? step.key === "hospital_rejected"
                                    ? "bg-red-100"
                                    : "bg-green-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <step.icon
                                className={`w-4 h-4 ${
                                  isCompleted || isCurrent
                                    ? step.key === "hospital_rejected"
                                      ? "text-red-600"
                                      : "text-green-600"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  isCurrent
                                    ? "text-gray-900"
                                    : isCompleted
                                      ? "text-gray-700"
                                      : "text-gray-500"
                                }`}
                              >
                                {step.label}
                              </p>
                              {isCurrent && (
                                <p className="text-xs text-blue-600">
                                  Current Status
                                </p>
                              )}
                              {request.hospital_response_date &&
                                step.key === request.status && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDateTime(
                                      request.hospital_response_date,
                                    )}
                                  </p>
                                )}
                              {request.hospital_response_notes &&
                                step.key === request.status &&
                                request.hospital_response && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {request.hospital_response_notes}
                                  </p>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rejection Message */}
                  {request.status === "hospital_rejected" &&
                    request.hospital_response_notes && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">
                              Request Rejected
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              {request.hospital_response_notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Acceptance Message */}
                  {request.status === "hospital_accepted" &&
                    request.hospital_response_notes && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Request Accepted
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              {request.hospital_response_notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
