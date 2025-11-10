import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  Truck,
  Clock,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  FileText,
  Search,
  Filter,
  Users,
  Activity,
  X,
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
  DialogTrigger,
} from "../components/ui/dialog";

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
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  assigned_staff_name: string;
  assigned_staff_phone?: string;
}

export default function AmbulanceManagement() {
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AmbulanceRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] =
    useState<AmbulanceRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Cache for resolved addresses when pickup_address contains lat,lng
  const [resolvedAddresses, setResolvedAddresses] = useState<
    Record<number, string>
  >({});
  const [resolvingIds, setResolvingIds] = useState<Record<number, boolean>>({});

  const latLngRegex = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;

  const reverseGeocode = async (lat: string, lng: string) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat,
      )}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return data.display_name || null;
    } catch (err) {
      console.error("Reverse geocode failed", err);
      return null;
    }
  };

  const resolveAddressForRequest = async (request: AmbulanceRequest) => {
    if (!request || !request.pickup_address) return;
    if (!latLngRegex.test(request.pickup_address)) return;
    if (resolvedAddresses[request.id] || resolvingIds[request.id]) return;

    setResolvingIds((s) => ({ ...s, [request.id]: true }));

    const [lat, lng] = request.pickup_address.split(",").map((v) => v.trim());
    const address = await reverseGeocode(lat, lng);

    if (address) {
      setResolvedAddresses((s) => ({ ...s, [request.id]: address }));
    }

    setResolvingIds((s) => {
      const copy = { ...s };
      delete copy[request.id];
      return copy;
    });
  };

  const fetchRequests = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch("/api/ambulance", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setFilteredRequests(data.requests || []);
      } else {
        console.error("Failed to fetch ambulance requests:", response.status);
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

  // Filter requests based on search term, status, and priority
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
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.priority === priorityFilter,
      );
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, priorityFilter]);

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

  // Get summary statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    assigned: requests.filter((r) => r.status === "assigned").length,
    onTheWay: requests.filter((r) => r.status === "on_the_way").length,
    completed: requests.filter((r) => r.status === "completed").length,
    critical: requests.filter((r) => r.priority === "critical").length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">
            Loading ambulance requests...
          </span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Ambulance Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor all emergency ambulance requests
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.assigned}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    On The Way
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.onTheWay}
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
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed}
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
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="on_the_way">On The Way</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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

        {/* Requests List - Grid of Boxes */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {requests.length === 0
                  ? "No Ambulance Requests"
                  : "No Matching Requests"}
              </h3>
              <p className="text-gray-600">
                {requests.length === 0
                  ? "No ambulance requests have been submitted yet."
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
                  // resolve address when opening details
                  resolveAddressForRequest(request);
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
                      {getStatusBadge(request.status)}
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
                      {latLngRegex.test(request.pickup_address)
                        ? resolvedAddresses[request.id] ||
                          request.pickup_address
                        : request.pickup_address}
                    </span>
                    {latLngRegex.test(request.pickup_address) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          request.pickup_address,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Google Maps
                      </a>
                    )}
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

        {/* Modal for Request Details */}
        <Dialog
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedRequest(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Manage and view details for the selected request
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              {selectedRequest && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      Request #{selectedRequest.id} -{" "}
                      {selectedRequest.emergency_type}
                    </h3>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(selectedRequest.status)}
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
                      {getStatusBadge(selectedRequest.status)}
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
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          Pickup Address
                        </span>
                      </div>
                      <div className="ml-6">
                        <p className="text-gray-600">
                          {latLngRegex.test(selectedRequest.pickup_address)
                            ? resolvedAddresses[selectedRequest.id] ||
                              selectedRequest.pickup_address
                            : selectedRequest.pickup_address}
                        </p>
                        {latLngRegex.test(selectedRequest.pickup_address) && (
                          <div className="mt-2 flex items-center space-x-3">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                selectedRequest.pickup_address,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Open in Google Maps
                            </a>
                            {resolvingIds[selectedRequest.id] ? (
                              <span className="text-sm text-gray-500">
                                Resolving address...
                              </span>
                            ) : null}
                          </div>
                        )}

                        {/* Show customer's signup captured address (if any) */}
                        {selectedRequest.customer_signup_address && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-900">
                              Signup Address
                            </p>
                            <p className="text-gray-600">
                              {selectedRequest.customer_signup_address}
                            </p>
                            <a
                              href={
                                selectedRequest.customer_signup_lat &&
                                selectedRequest.customer_signup_lng
                                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      `${selectedRequest.customer_signup_lat},${selectedRequest.customer_signup_lng}`,
                                    )}`
                                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      selectedRequest.customer_signup_address,
                                    )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                              Open Signup Address in Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedRequest.destination_address && (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-900">
                            Destination
                          </span>
                        </div>
                        <p className="text-gray-600 ml-6">
                          {selectedRequest.destination_address}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Assigned Staff */}
                  {selectedRequest.assigned_staff_name && (
                    <>
                      <Separator />
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <User className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-900">
                            Assigned Staff
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-green-800">
                              Name:{" "}
                            </span>
                            <span className="text-green-700">
                              {selectedRequest.assigned_staff_name}
                            </span>
                          </div>
                          {selectedRequest.assigned_staff_phone && (
                            <div>
                              <span className="font-medium text-green-800">
                                Phone:{" "}
                              </span>
                              <span className="text-green-700">
                                {selectedRequest.assigned_staff_phone}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs ml-2"
                                onClick={() =>
                                  window.open(
                                    `tel:${selectedRequest.assigned_staff_phone}`,
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

                  {/* Notes */}
                  {selectedRequest.notes && (
                    <>
                      <Separator />
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <span className="font-semibold text-gray-900">
                            Staff Notes
                          </span>
                        </div>
                        <p className="text-gray-700">{selectedRequest.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Status Progress */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 block mb-3">
                      Status Progress
                    </span>
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex items-center space-x-2 ${["pending", "assigned", "on_the_way", "completed"].includes(selectedRequest.status) ? "text-blue-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${selectedRequest.status === "pending" || selectedRequest.status === "assigned" || selectedRequest.status === "on_the_way" || selectedRequest.status === "completed" ? "bg-blue-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">Requested</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 ${["assigned", "on_the_way", "completed"].includes(selectedRequest.status) ? "text-blue-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${selectedRequest.status === "assigned" || selectedRequest.status === "on_the_way" || selectedRequest.status === "completed" ? "bg-blue-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">Assigned</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 ${["on_the_way", "completed"].includes(selectedRequest.status) ? "text-orange-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${selectedRequest.status === "on_the_way" || selectedRequest.status === "completed" ? "bg-orange-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">On The Way</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 ${selectedRequest.status === "completed" ? "text-green-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${selectedRequest.status === "completed" ? "bg-green-600" : "bg-gray-300"}`}
                        ></div>
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    </div>
                  </div>
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
      </div>
    </Layout>
  );
}
