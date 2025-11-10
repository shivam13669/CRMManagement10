import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Shield,
  Activity
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

interface StaffMember {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/admin/users/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStaff(data.users || []);
      } else {
        setError('Failed to fetch staff members');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm));

    const matchesStatus =
      statusFilter === "all" ? true : member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-2">
              Manage hospital staff members and their information
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={fetchStaff} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{staff.length}</div>
                  <div className="text-sm text-gray-600">Total Staff</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {staff.filter(s => s.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Staff</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {staff.filter(s => s.status === 'suspended').length}
                  </div>
                  <div className="text-sm text-gray-600">Suspended</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search staff by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              {filteredStaff.length === 0 && searchTerm
                ? `No staff found matching "${searchTerm}"`
                : `Showing ${filteredStaff.length} of ${staff.length} staff members`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">{error}</div>
                <Button onClick={fetchStaff} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No staff found' : 'No staff members'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Try adjusting your search criteria'
                    : 'Staff members will appear here once they are registered'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStaff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{member.full_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Joined {formatDate(member.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStaff(member)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Staff Member Details</DialogTitle>
                            <DialogDescription>
                              Detailed information about {member.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedStaff && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                                  <p className="text-sm text-gray-900">{selectedStaff.full_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Username</label>
                                  <p className="text-sm text-gray-900">{selectedStaff.username}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Email</label>
                                  <p className="text-sm text-gray-900">{selectedStaff.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Phone</label>
                                  <p className="text-sm text-gray-900">{selectedStaff.phone || 'Not provided'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Status</label>
                                  <p className={`text-sm font-medium ${
                                    selectedStaff.status === 'active' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {selectedStaff.status.charAt(0).toUpperCase() + selectedStaff.status.slice(1)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Role</label>
                                  <p className="text-sm text-gray-900 capitalize">{selectedStaff.role}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Joined Date</label>
                                  <p className="text-sm text-gray-900">{formatDate(selectedStaff.created_at)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                                  <p className="text-sm text-gray-900">{formatDate(selectedStaff.updated_at)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
