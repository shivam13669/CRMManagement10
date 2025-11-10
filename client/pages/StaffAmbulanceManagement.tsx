import { useState, useEffect } from "react";
import { StaffLayout } from "../components/StaffLayout";
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
  UserPlus,
  Navigation,
  Edit
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
import { Textarea } from "../components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";

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

export default function StaffAmbulanceManagement() {
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigningRequests, setAssigningRequests] = useState<Set<number>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set());
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AmbulanceRequest | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");

  const fetchRequests = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('/api/ambulance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setFilteredRequests(data.requests || []);
      } else {
        console.error('Failed to fetch ambulance requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching ambulance requests:', error);
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
      filtered = filtered.filter(request =>
        request.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.emergency_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  const assignToMe = async (requestId: number) => {
    try {
      setAssigningRequests(prev => new Set([...prev, requestId]));
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('You must be logged in to assign requests');
        return;
      }

      const response = await fetch(`/api/ambulance/${requestId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchRequests(); // Refresh the list
        alert('Successfully assigned to you!');
      } else {
        const errorData = await response.json();
        alert(`Failed to assign request: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error assigning request:', error);
      alert('Failed to assign request. Please try again.');
    } finally {
      setAssigningRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const updateRequestStatus = async () => {
    if (!selectedRequest) return;

    try {
      setUpdatingStatus(prev => new Set([...prev, selectedRequest.id]));
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('You must be logged in to update requests');
        return;
      }

      const response = await fetch(`/api/ambulance/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes
        })
      });

      if (response.ok) {
        await fetchRequests(); // Refresh the list
        setUpdateDialogOpen(false);
        setSelectedRequest(null);
        setNewStatus("");
        setNotes("");
        alert('Status updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update status: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedRequest.id);
        return newSet;
      });
    }
  };

  const openUpdateDialog = (request: AmbulanceRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setNotes(request.notes || "");
    setUpdateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'assigned':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Assigned</Badge>;
      case 'on_the_way':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">On The Way</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">High</Badge>;
      case 'normal':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Normal</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'assigned':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'on_the_way':
        return <Truck className="w-4 h-4 text-orange-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Get summary statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    assigned: requests.filter(r => r.status === 'assigned').length,
    onTheWay: requests.filter(r => r.status === 'on_the_way').length,
    completed: requests.filter(r => r.status === 'completed').length,
    critical: requests.filter(r => r.priority === 'critical').length
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading ambulance requests...</span>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ambulance Management</h1>
            <p className="text-gray-600 mt-1">Respond to and manage emergency ambulance requests</p>
          </div>
          <Button
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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
                  <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">On The Way</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.onTheWay}</p>
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
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
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
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
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
                {requests.length === 0 ? "No Ambulance Requests" : "No Matching Requests"}
              </h3>
              <p className="text-gray-600">
                {requests.length === 0 
                  ? "No ambulance requests have been submitted yet." 
                  : "No requests match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <CardTitle className="text-lg">
                          Request #{request.id} - {request.emergency_type}
                        </CardTitle>
                        <CardDescription>
                          {formatDateTime(request.created_at)} • {getTimeAgo(request.created_at)}
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
                  {/* Patient Information */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Patient Information</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium text-blue-800">Name: </span>
                        <span className="text-blue-700">{request.patient_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Contact: </span>
                        <span className="text-blue-700">{request.contact_number}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs ml-2"
                          onClick={() => window.open(`tel:${request.contact_number}`)}
                        >
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Details */}
                  {request.patient_condition && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Patient Condition</span>
                      </div>
                      <p className="text-gray-700 text-sm">{request.patient_condition}</p>
                    </div>
                  )}

                  {/* Pickup Address */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Pickup Address</div>
                      <div className="text-gray-600 text-sm">{request.pickup_address}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs mt-2"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(request.pickup_address)}`, '_blank')}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Open in Maps
                      </Button>
                    </div>
                  </div>

                  {/* Assigned Staff (if available) */}
                  {request.assigned_staff_name && (
                    <>
                      <Separator />
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-900">Assigned Staff</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Name: </span>
                          <span className="text-green-700">{request.assigned_staff_name}</span>
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
                          <span className="font-medium text-gray-900">Staff Notes</span>
                        </div>
                        <p className="text-gray-700 text-sm">{request.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {request.status === 'pending' && !request.assigned_staff_name && (
                      <Button
                        onClick={() => assignToMe(request.id)}
                        disabled={assigningRequests.has(request.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {assigningRequests.has(request.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign to Me
                          </>
                        )}
                      </Button>
                    )}

                    {(request.status === 'assigned' || request.status === 'on_the_way') && request.assigned_staff_name && (
                      <Button
                        onClick={() => openUpdateDialog(request)}
                        variant="outline"
                        disabled={updatingStatus.has(request.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Status
                      </Button>
                    )}

                    {request.status === 'assigned' && request.assigned_staff_name && (
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setNewStatus('on_the_way');
                          setNotes(request.notes || '');
                          updateRequestStatus();
                        }}
                        disabled={updatingStatus.has(request.id)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Mark On The Way
                      </Button>
                    )}

                    {request.status === 'on_the_way' && request.assigned_staff_name && (
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setNewStatus('completed');
                          setNotes(request.notes || '');
                          updateRequestStatus();
                        }}
                        disabled={updatingStatus.has(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Completed
                      </Button>
                    )}
                  </div>

                  {/* Status Progress */}
                  <div className="mt-4">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 ${['pending', 'assigned', 'on_the_way', 'completed'].includes(request.status) ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${request.status === 'pending' || request.status === 'assigned' || request.status === 'on_the_way' || request.status === 'completed' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-medium">Requested</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${['assigned', 'on_the_way', 'completed'].includes(request.status) ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${request.status === 'assigned' || request.status === 'on_the_way' || request.status === 'completed' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-medium">Assigned</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${['on_the_way', 'completed'].includes(request.status) ? 'text-orange-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${request.status === 'on_the_way' || request.status === 'completed' ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-medium">On The Way</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${request.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${request.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Update Status Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Request Status</DialogTitle>
              <DialogDescription>
                Update the status and add notes for Request #{selectedRequest?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="on_the_way">On The Way</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or updates..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={updateRequestStatus}
                disabled={!newStatus || updatingStatus.has(selectedRequest?.id || 0)}
              >
                {updatingStatus.has(selectedRequest?.id || 0) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StaffLayout>
  );
}
