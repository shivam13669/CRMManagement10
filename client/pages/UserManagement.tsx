import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldOff,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  UserCheck,
  UserX,
  Eye,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setAlert({ type: "error", message: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: number, userName: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        setAlert({
          type: "success",
          message: `${userName} has been suspended`,
        });
        fetchUsers(); // Refresh the list
      } else {
        throw new Error("Failed to suspend user");
      }
    } catch (error) {
      console.error("Error suspending user:", error);
      setAlert({ type: "error", message: "Failed to suspend user" });
    }
  };

  const handleReactivateUser = async (userId: number, userName: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        setAlert({
          type: "success",
          message: `${userName} has been reactivated`,
        });
        fetchUsers(); // Refresh the list
      } else {
        throw new Error("Failed to reactivate user");
      }
    } catch (error) {
      console.error("Error reactivating user:", error);
      setAlert({ type: "error", message: "Failed to reactivate user" });
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        setAlert({
          type: "success",
          message: `${userName} has been deleted permanently`,
        });
        fetchUsers(); // Refresh the list
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setAlert({ type: "error", message: "Failed to delete user" });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "doctor":
        return <UserCheck className="h-4 w-4" />;
      case "patient":
        return <User className="h-4 w-4" />;
      case "staff":
        return <UserX className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "doctor":
        return "bg-blue-100 text-blue-800";
      case "patient":
        return "bg-green-100 text-green-800";
      case "staff":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage user accounts - suspend, reactivate, or delete users
            </p>
          </div>
          <Button onClick={fetchUsers} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Alert */}
        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            {alert.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Doctors
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "doctor").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "customer").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Staff
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "staff").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.status === "suspended").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              Search and filter users, manage their account status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="doctor">Doctors</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-medium text-gray-900">
                        User
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Role
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Status
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Joined
                      </th>
                      <th className="text-right p-4 font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                                {user.phone && (
                                  <div className="text-xs text-gray-400">
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit`}
                            >
                              {getRoleIcon(user.role)}
                              {user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-4">{getStatusBadge(user.status)}</td>
                          <td className="p-4">
                            <div className="text-sm text-gray-900">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(user.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          setSelectedUser(user);
                                        }}
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>User Details</DialogTitle>
                                        <DialogDescription>
                                          Complete information about{" "}
                                          {selectedUser?.full_name}
                                        </DialogDescription>
                                      </DialogHeader>

                                      {selectedUser && (
                                        <div className="space-y-6">
                                          {/* Basic Info */}
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                              <h3 className="font-medium mb-2">
                                                Personal Information
                                              </h3>
                                              <div className="space-y-2 text-sm">
                                                <div className="flex items-center space-x-2">
                                                  <User className="w-4 h-4 text-gray-400" />
                                                  <span>
                                                    {selectedUser.full_name}
                                                  </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <User className="w-4 h-4 text-gray-400" />
                                                  <span>
                                                    @{selectedUser.username}
                                                  </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <User className="w-4 h-4 text-gray-400" />
                                                  <span>
                                                    {selectedUser.email}
                                                  </span>
                                                </div>
                                                {selectedUser.phone && (
                                                  <div className="flex items-center space-x-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                      {selectedUser.phone}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div>
                                              <h3 className="font-medium mb-2">
                                                Account Details
                                              </h3>
                                              <div className="space-y-2 text-sm">
                                                <div className="flex items-center space-x-2">
                                                  <div className="w-4 h-4 flex items-center justify-center">
                                                    {getRoleIcon(
                                                      selectedUser.role,
                                                    )}
                                                  </div>
                                                  <span>
                                                    Role:{" "}
                                                    {selectedUser.role
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                      selectedUser.role.slice(
                                                        1,
                                                      )}
                                                  </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  {selectedUser.status ===
                                                  "active" ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                  ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                  )}
                                                  <span>
                                                    Status:{" "}
                                                    {selectedUser.status
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                      selectedUser.status.slice(
                                                        1,
                                                      )}
                                                  </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <User className="w-4 h-4 text-gray-400" />
                                                  <span>
                                                    User ID: #{selectedUser.id}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Timestamps */}
                                          <div>
                                            <h3 className="font-medium mb-2">
                                              Account Timeline
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                              <div className="flex items-center space-x-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>
                                                  Created:{" "}
                                                  {new Date(
                                                    selectedUser.created_at,
                                                  ).toLocaleDateString()}{" "}
                                                  at{" "}
                                                  {new Date(
                                                    selectedUser.created_at,
                                                  ).toLocaleTimeString()}
                                                </span>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>
                                                  Updated:{" "}
                                                  {new Date(
                                                    selectedUser.updated_at,
                                                  ).toLocaleDateString()}{" "}
                                                  at{" "}
                                                  {new Date(
                                                    selectedUser.updated_at,
                                                  ).toLocaleTimeString()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="flex flex-wrap gap-2 pt-4">
                                            {selectedUser.status ===
                                            "active" ? (
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 sm:flex-none"
                                                  >
                                                    <ShieldOff className="w-4 h-4 mr-2" />
                                                    Suspend User
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                      Suspend User
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Are you sure you want to
                                                      suspend{" "}
                                                      {selectedUser.full_name}?
                                                      They will not be able to
                                                      access their account until
                                                      reactivated.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                      Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                      onClick={() =>
                                                        handleSuspendUser(
                                                          selectedUser.id,
                                                          selectedUser.full_name,
                                                        )
                                                      }
                                                      className="bg-orange-600 hover:bg-orange-700"
                                                    >
                                                      Suspend
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            ) : (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleReactivateUser(
                                                    selectedUser.id,
                                                    selectedUser.full_name,
                                                  )
                                                }
                                                className="flex-1 sm:flex-none"
                                              >
                                                <Shield className="w-4 h-4 mr-2" />
                                                Reactivate User
                                              </Button>
                                            )}

                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="destructive"
                                                  size="sm"
                                                  className="flex-1 sm:flex-none"
                                                >
                                                  <Trash2 className="w-4 h-4 mr-2" />
                                                  Delete User
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                                    Delete User
                                                  </AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    <strong>Warning:</strong>{" "}
                                                    This action cannot be
                                                    undone. This will
                                                    permanently delete{" "}
                                                    {selectedUser.full_name}'s
                                                    account and remove all of
                                                    their data from our servers.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>
                                                    Cancel
                                                  </AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() =>
                                                      handleDeleteUser(
                                                        selectedUser.id,
                                                        selectedUser.full_name,
                                                      )
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                  >
                                                    Delete Permanently
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                  <DropdownMenuSeparator />
                                  {user.status === "active" ? (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <ShieldOff className="w-4 h-4 mr-2" />
                                          Suspend User
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Suspend User
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to suspend{" "}
                                            {user.full_name}? They will not be
                                            able to access their account until
                                            reactivated.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleSuspendUser(
                                                user.id,
                                                user.full_name,
                                              )
                                            }
                                            className="bg-orange-600 hover:bg-orange-700"
                                          >
                                            Suspend
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleReactivateUser(
                                          user.id,
                                          user.full_name,
                                        )
                                      }
                                    >
                                      <Shield className="w-4 h-4 mr-2" />
                                      Reactivate User
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                          <AlertTriangle className="w-5 h-5 text-red-500" />
                                          Delete User
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          <strong>Warning:</strong> This action
                                          cannot be undone. This will
                                          permanently delete {user.full_name}'s
                                          account and remove all of their data
                                          from our servers.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteUser(
                                              user.id,
                                              user.full_name,
                                            )
                                          }
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Permanently
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-gray-500"
                        >
                          No users found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
