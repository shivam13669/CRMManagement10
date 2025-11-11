import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  Stethoscope,
  Users,
  AlertCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

interface PendingRegistration {
  id: number;
  username: string;
  email: string;
  role: 'doctor' | 'staff';
  full_name: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  department?: string;
  employee_id?: string;
  created_at: string;
  admin_notes?: string;
  approved_by_name?: string;
}

export default function PendingRegistrations() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/pending-registrations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || []);
      } else {
        console.error('Failed to fetch pending registrations');
      }
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/pending-registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ adminNotes })
      });

      if (response.ok) {
        await fetchPendingRegistrations(); // Refresh the list
        setAdminNotes("");
        alert('Registration approved successfully!');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (registrationId: number) => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/pending-registrations/${registrationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ adminNotes })
      });

      if (response.ok) {
        await fetchPendingRegistrations(); // Refresh the list
        setAdminNotes("");
        alert('Registration rejected successfully!');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'doctor' ? Stethoscope : Users;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Pending Registrations</h1>
            <p className="text-gray-600 mt-2">
              Review and approve doctor/staff registration requests
            </p>
          </div>
          <Button onClick={fetchPendingRegistrations} variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registrations List */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Requests</CardTitle>
            <CardDescription>
              Review doctor and staff registration requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registrations.length > 0 ? (
              <div className="space-y-4">
                {registrations.map((registration) => {
                  const RoleIcon = getRoleIcon(registration.role);
                  
                  return (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <RoleIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{registration.full_name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {registration.email}
                            </div>
                            {registration.phone && (
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                {registration.phone}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(registration.created_at)}
                            </div>
                          </div>
                          {registration.specialization && (
                            <div className="text-sm text-blue-600 mt-1">
                              Specialization: {registration.specialization}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {registration.role}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                          {registration.status}
                        </span>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRegistration(registration)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <RoleIcon className="w-6 h-6" />
                                <span>{selectedRegistration?.full_name}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRegistration?.status || '')}`}>
                                  {selectedRegistration?.status}
                                </span>
                              </DialogTitle>
                              <DialogDescription>
                                Review {selectedRegistration?.role} registration request
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedRegistration && (
                              <div className="space-y-6 mt-4">
                                {/* Personal Information */}
                                <div>
                                  <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Personal Information</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-500">Full Name</p>
                                      <p className="font-medium">{selectedRegistration.full_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Email</p>
                                      <p className="font-medium">{selectedRegistration.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Phone</p>
                                      <p className="font-medium">{selectedRegistration.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Role</p>
                                      <p className="font-medium capitalize">{selectedRegistration.role}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Professional Information */}
                                {selectedRegistration.role === 'doctor' && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Professional Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Specialization</p>
                                        <p className="font-medium">{selectedRegistration.specialization || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">License Number</p>
                                        <p className="font-medium">{selectedRegistration.license_number || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Experience</p>
                                        <p className="font-medium">{selectedRegistration.experience_years || 'N/A'} years</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Consultation Fee</p>
                                        <p className="font-medium">₹{selectedRegistration.consultation_fee || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Admin Actions */}
                                {selectedRegistration.status === 'pending' && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Admin Action</h3>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Notes (Optional)
                                        </label>
                                        <Textarea
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                          placeholder="Add notes about your decision..."
                                          rows={3}
                                        />
                                      </div>
                                      
                                      <div className="flex space-x-3">
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button className="flex-1" disabled={actionLoading}>
                                              <CheckCircle className="w-4 h-4 mr-2" />
                                              Approve
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Approve Registration</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will create a user account for {selectedRegistration.full_name} and they will be able to sign in immediately.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction 
                                                onClick={() => handleApprove(selectedRegistration.id)}
                                                disabled={actionLoading}
                                              >
                                                {actionLoading ? 'Approving...' : 'Approve'}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                        
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="flex-1" disabled={actionLoading}>
                                              <XCircle className="w-4 h-4 mr-2" />
                                              Reject
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Reject Registration</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will reject the registration request. The user will not be able to sign in. Please provide a reason in the notes.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction 
                                                onClick={() => handleReject(selectedRegistration.id)}
                                                disabled={actionLoading || !adminNotes.trim()}
                                              >
                                                {actionLoading ? 'Rejecting...' : 'Reject'}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Admin Notes Display */}
                                {selectedRegistration.admin_notes && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Admin Notes</h3>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-sm">{selectedRegistration.admin_notes}</p>
                                      {selectedRegistration.approved_by_name && (
                                        <p className="text-xs text-gray-500 mt-2">
                                          By: {selectedRegistration.approved_by_name}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No registration requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No doctor or staff registration requests have been submitted yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
