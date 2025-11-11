import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
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

interface Appointment {
  id: number;
  patient_name: string;
  patient_email: string;
  patient_phone?: string;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  reason?: string;
  symptoms?: string;
  notes?: string;
  created_at: string;
}

export default function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: number, status: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchAppointments();
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === "all" || appointment.status === filter;
    const matchesSearch = 
      appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments Management</h1>
            <p className="text-gray-600 mt-2">
              Manage all patient appointments and schedules
            </p>
          </div>
          <Button onClick={fetchAppointments} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Pending</div>
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
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.confirmed}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Confirmed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completed}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.cancelled}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Cancelled</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by patient name, doctor, or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Appointments</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle>All Appointments</CardTitle>
            <CardDescription>
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            #{appointment.id}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="font-medium">{appointment.patient_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{appointment.appointment_time}</span>
                          </div>
                          {appointment.doctor_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>Dr. {appointment.doctor_name}</span>
                            </div>
                          )}
                        </div>
                        
                        {appointment.reason && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-600">{appointment.reason}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAppointment(appointment)}
                              className="w-full sm:w-auto"
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Appointment Details</DialogTitle>
                              <DialogDescription>
                                Manage this appointment
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedAppointment && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-medium mb-2">Patient Information:</h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <p>Name: {selectedAppointment.patient_name}</p>
                                      <p>Email: {selectedAppointment.patient_email}</p>
                                      {selectedAppointment.patient_phone && (
                                        <p>Phone: {selectedAppointment.patient_phone}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-medium mb-2">Appointment Details:</h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <p>Date: {new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                                      <p>Time: {selectedAppointment.appointment_time}</p>
                                      <p>Status: <Badge className={getStatusColor(selectedAppointment.status)}>{selectedAppointment.status}</Badge></p>
                                    </div>
                                  </div>
                                </div>
                                
                                {selectedAppointment.reason && (
                                  <div>
                                    <h3 className="font-medium mb-2">Reason for Visit:</h3>
                                    <p className="text-sm text-gray-600">{selectedAppointment.reason}</p>
                                  </div>
                                )}
                                
                                {selectedAppointment.symptoms && (
                                  <div>
                                    <h3 className="font-medium mb-2">Symptoms:</h3>
                                    <p className="text-sm text-gray-600">{selectedAppointment.symptoms}</p>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-2 pt-4">
                                  {selectedAppointment.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'confirmed')}
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                      >
                                        Confirm
                                      </Button>
                                      <Button
                                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'cancelled')}
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  )}
                                  {selectedAppointment.status === 'confirmed' && (
                                    <Button
                                      onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                                      size="sm"
                                      className="flex-1 sm:flex-none"
                                    >
                                      Mark Complete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
