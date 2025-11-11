import { useState, useEffect } from "react";
import { HospitalLayout } from "../components/HospitalLayout";
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
  FileText,
  Search,
  Filter,
  Users,
  Activity,
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
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "../components/ui/textarea";

interface ForwardedRequest {
  id: number;
  pickup_address: string;
  emergency_type: string;
  patient_condition: string;
  contact_number: string;
  status: string;
  priority: string;
  hospital_response: string;
  hospital_response_notes: string;
  hospital_response_date: string;
  created_at: string;
  updated_at: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
}

export default function HospitalServiceRequests() {
  const [requests, setRequests] = useState<ForwardedRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ForwardedRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] =
    useState<ForwardedRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseType, setResponseType] = useState<"accepted" | "rejected">(
    "accepted",
  );
  const [responseNotes, setResponseNotes] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [availableAmbulances, setAvailableAmbulances] = useState<any[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<number | null>(
    null,
  );
  const [ambulanceSelectionOpen, setAmbulanceSelectionOpen] = useState(false);
  const [loadingAmbulances, setLoadingAmbulances] = useState(false);

  const fetchRequests = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch(
        "/api/ambulance/hospital/forwarded-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setFilteredRequests(data.requests || []);
      } else {
        console.error("Failed to fetch forwarded requests:", response.status);
      }
    } catch (error) {
      console.error("Error fetching forwarded requests:", error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  const fetchAvailableAmbulances = async () => {
    try {
      setLoadingAmbulances(true);
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/hospital/ambulances/available", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableAmbulances(data.ambulances || []);
      } else {
        console.error("Failed to fetch ambulances:", response.status);
        toast.error("Failed to load available ambulances");
      }
    } catch (error) {
      console.error("Error fetching ambulances:", error);
      toast.error("Error loading ambulances");
    } finally {
      setLoadingAmbulances(false);
    }
  };

  const submitResponse = async () => {
    if (!selectedRequest) return;

    // If accepting, require ambulance selection
    if (responseType === "accepted" && !selectedAmbulance) {
      toast.error("Please select an ambulance to accept this request");
      return;
    }

    try {
      setSubmittingResponse(true);
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // First, submit the hospital response
      const response = await fetch(
        `/api/ambulance/${selectedRequest.id}/hospital-response`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            response: responseType,
            notes: responseNotes,
          }),
        },
      );

      if (!response.ok) {
        toast.error("Failed to submit response");
        setSubmittingResponse(false);
        return;
      }

      // If accepted, assign the ambulance
      if (responseType === "accepted" && selectedAmbulance) {
        const assignResponse = await fetch(
          `/api/hospital/ambulances/${selectedAmbulance}/assign/${selectedRequest.id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!assignResponse.ok) {
          toast.error("Failed to assign ambulance to request");
          setSubmittingResponse(false);
          return;
        }
      }

      toast.success(
        `Request ${responseType} successfully. Notifications sent to customer and admin.`,
      );
      setResponseModalOpen(false);
      setAmbulanceSelectionOpen(false);
      setResponseNotes("");
      setSelectedAmbulance(null);
      fetchRequests();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Error submitting response");
    } finally {
      setSubmittingResponse(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter requests
  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.patient_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.emergency_type
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.pickup_address
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.id.toString().includes(searchTerm),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.hospital_response === statusFilter,
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.priority === priorityFilter,
      );
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  const getResponseBadge = (response: string) => {
    switch (response) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending Response
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Rejected
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

  // Get summary statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.hospital_response === "pending").length,
    accepted: requests.filter((r) => r.hospital_response === "accepted").length,
    rejected: requests.filter((r) => r.hospital_response === "rejected").length,
    critical: requests.filter((r) => r.priority === "critical").length,
  };

  if (loading) {
    return (
      <HospitalLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">
            Loading service requests...
          </span>
        </div>
      </HospitalLayout>
    );
  }

  return (
    <HospitalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Service Requests
            </h1>
            <p className="text-gray-600 mt-1">
              Manage ambulance requests forwarded by admin
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.accepted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.critical}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by patient name, emergency type, or request ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by response" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Responses</SelectItem>
                  <SelectItem value="pending">Pending Response</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {requests.length === 0
                  ? "No Service Requests"
                  : "No Matching Requests"}
              </h3>
              <p className="text-gray-600">
                {requests.length === 0
                  ? "No ambulance requests have been forwarded to your hospital yet."
                  : "No requests match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => {
                  setSelectedRequest(request);
                  setModalOpen(true);
                }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Request #{request.id}
                    </h3>
                    <div className="flex gap-2">
                      {getPriorityBadge(request.priority)}
                      {getResponseBadge(request.hospital_response)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {request.emergency_type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(request.created_at)}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 truncate">
                      {request.patient_name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      {request.contact_number}
                    </span>
                  </div>

                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 line-clamp-2">
                      {request.pickup_address}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {formatDateTime(request.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        <Dialog
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedRequest(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Service Request Details</DialogTitle>
              <DialogDescription>
                View request details and submit your response
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {selectedRequest && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      Request #{selectedRequest.id} -{" "}
                      {selectedRequest.emergency_type}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">
                        {formatDateTime(selectedRequest.created_at)}
                      </span>
                      <span className="text-gray-500 text-sm">•</span>
                      <span className="text-gray-600">
                        {getTimeAgo(selectedRequest.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {getPriorityBadge(selectedRequest.priority)}
                      {getResponseBadge(selectedRequest.hospital_response)}
                    </div>
                  </div>

                  <Separator />

                  {/* Patient Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        Patient Information
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-blue-800">
                          Name:{" "}
                        </span>
                        <span className="text-blue-700">
                          {selectedRequest.patient_name}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">
                          Email:{" "}
                        </span>
                        <span className="text-blue-700">
                          {selectedRequest.patient_email}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">
                          Phone:{" "}
                        </span>
                        <span className="text-blue-700">
                          {selectedRequest.patient_phone}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">
                          Contact:{" "}
                        </span>
                        <span className="text-blue-700">
                          {selectedRequest.contact_number}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs ml-2"
                          onClick={() =>
                            window.open(`tel:${selectedRequest.contact_number}`)
                          }
                        >
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Patient Condition */}
                  {selectedRequest.patient_condition && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">
                          Patient Condition
                        </span>
                      </div>
                      <p className="text-gray-700">
                        {selectedRequest.patient_condition}
                      </p>
                    </div>
                  )}

                  {/* Location Info */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        Pickup Address
                      </span>
                    </div>
                    <div className="ml-6">
                      <p className="text-gray-600">
                        {selectedRequest.pickup_address}
                      </p>
                    </div>
                  </div>

                  {/* Current Response */}
                  {selectedRequest.hospital_response === "pending" ? (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-700 font-medium">
                        Your response is pending
                      </p>
                      <p className="text-yellow-600 text-sm mt-1">
                        Please accept or reject this request below
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-800">
                            Your Response:{" "}
                          </span>
                          <span className="text-gray-700 capitalize font-semibold">
                            {selectedRequest.hospital_response}
                          </span>
                        </div>
                        {selectedRequest.hospital_response_date && (
                          <div>
                            <span className="font-medium text-gray-800">
                              Response Date:{" "}
                            </span>
                            <span className="text-gray-700">
                              {formatDateTime(
                                selectedRequest.hospital_response_date,
                              )}
                            </span>
                          </div>
                        )}
                        {selectedRequest.hospital_response_notes && (
                          <div>
                            <span className="font-medium text-gray-800">
                              Notes:{" "}
                            </span>
                            <p className="text-gray-700 mt-1">
                              {selectedRequest.hospital_response_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Response Actions */}
                  {selectedRequest.hospital_response === "pending" && (
                    <div className="space-y-3">
                      <Button
                        onClick={async () => {
                          setResponseType("accepted");
                          await fetchAvailableAmbulances();
                          setAmbulanceSelectionOpen(true);
                        }}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept Request
                      </Button>
                      <Button
                        onClick={() => {
                          setResponseType("rejected");
                          setResponseModalOpen(true);
                        }}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Request
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedRequest(null);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ambulance Selection Modal */}
        <Dialog
          open={ambulanceSelectionOpen}
          onOpenChange={setAmbulanceSelectionOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Ambulance</DialogTitle>
              <DialogDescription>
                Choose an ambulance to assign to this service request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {loadingAmbulances ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-gray-600">
                    Loading available ambulances...
                  </span>
                </div>
              ) : availableAmbulances.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-900 font-semibold">
                    No Available Ambulances
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    All ambulances are currently assigned to service requests.
                    Please park an ambulance to accept this request.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                  {availableAmbulances.map((ambulance) => (
                    <div
                      key={ambulance.id}
                      onClick={() => setSelectedAmbulance(ambulance.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAmbulance === ambulance.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {ambulance.registration_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            {ambulance.ambulance_type}
                          </p>
                          {ambulance.driver_name && (
                            <p className="text-sm text-gray-600 mt-1">
                              Driver: {ambulance.driver_name}
                            </p>
                          )}
                          {ambulance.current_location && (
                            <p className="text-xs text-gray-500 mt-1">
                              Location: {ambulance.current_location}
                            </p>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            selectedAmbulance === ambulance.id
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedAmbulance === ambulance.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableAmbulances.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Enter any special instructions or notes..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAmbulanceSelectionOpen(false);
                  setSelectedAmbulance(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitResponse}
                disabled={
                  submittingResponse ||
                  loadingAmbulances ||
                  !selectedAmbulance ||
                  availableAmbulances.length === 0
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {submittingResponse ? "Accepting..." : "Accept with Selected Ambulance"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Response Modal */}
        <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {responseType === "accepted"
                  ? "Accept Request"
                  : "Reject Request"}
              </DialogTitle>
              <DialogDescription>
                {responseType === "accepted"
                  ? "Confirm that your hospital will handle this ambulance request"
                  : "Explain why your hospital cannot handle this request"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <Textarea
                  placeholder={
                    responseType === "accepted"
                      ? "Enter any special instructions or notes..."
                      : "Enter reason for rejection..."
                  }
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  className="mt-2 min-h-[120px]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setResponseModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitResponse}
                disabled={submittingResponse}
                className={
                  responseType === "accepted"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                {submittingResponse ? "Submitting..." : "Submit Response"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </HospitalLayout>
  );
}
