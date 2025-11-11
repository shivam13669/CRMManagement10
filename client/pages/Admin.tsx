import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { CreateAdminUser } from "../components/CreateAdminUser";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Alert, AlertDescription } from "../components/ui/alert";
import { authUtils } from "../lib/api";
import { fetchWithAuth } from "../lib/fetchWithAuth";
import {
  Users,
  UserCheck,
  Eye,
  MoreVertical,
  ShieldOff,
  Shield,
  Trash2,
  KeyRound,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Filter,
  Plus,
  LayoutList,
  MapPin,
} from "lucide-react";

interface AdminUser {
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

export default function AdminPage() {
  const currentUser = authUtils.getCurrentUser();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"create" | "manage">("manage");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/admin-users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.users || []);
      }
    } catch (e) {
      console.error("Failed to load admins", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return admins.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ? true : u.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [admins, search, statusFilter]);

  const exportAdminsCSV = (items: AdminUser[]) => {
    if (!items || items.length === 0) return;
    const headers = [
      "id",
      "full_name",
      "username",
      "email",
      "status",
      "created_at",
    ];
    const rows = items.map((it) => [
      it.id,
      it.full_name,
      it.username,
      it.email,
      it.status,
      it.created_at,
    ]);
    const csvContent = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admins_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (currentUser?.role !== "admin") {
    return (
      <Layout>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              This page is only accessible to administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              You do not have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Management
            </h1>
            <p className="text-gray-600 mt-2">Create and manage admin users</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => exportAdminsCSV(filtered)}>
              <Download className="w-4 h-4 mr-2" /> Export List
            </Button>
            <Button variant="outline" onClick={fetchAdmins}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "create"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Admin
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "manage"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutList className="w-4 h-4 inline mr-2" />
            Manage Admins
          </button>
        </div>

        {/* Create Admin Tab */}
        {activeTab === "create" && <CreateAdminUser />}

        {/* Manage Admins Tab */}
        {activeTab === "manage" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">
                        {admins.length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Total Admins
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-xl text-white">✔</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">
                        {admins.filter((a) => a.status === "active").length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Active Admins
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-xl text-white">⚠</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">
                        {admins.filter((a) => a.status === "suspended").length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Suspended
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by name, email, or username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
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

            {/* Admin Users Table */}
            <ManageAdmins
              admins={admins}
              fetchAdmins={fetchAdmins}
              filtered={filtered}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              exportAdminsCSV={exportAdminsCSV}
            />
          </>
        )}
      </div>
    </Layout>
  );
}

function ManageAdmins({
  admins,
  fetchAdmins,
  filtered,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  exportAdminsCSV,
}: {
  admins: AdminUser[];
  fetchAdmins: () => Promise<void> | void;
  filtered: AdminUser[];
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  exportAdminsCSV: (items: AdminUser[]) => void;
}) {
  const currentUser = authUtils.getCurrentUser();

  const [currentUserFull, setCurrentUserFull] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/profile", {
          headers: { "Content-Type": "application/json" },
        });
        if (res && res.ok) {
          const json = await res.json();
          if (mounted) setCurrentUserFull(json.user || null);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [pwdUser, setPwdUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const submitPassword = async () => {
    if (!pwdUser) return;
    if (!newPassword || !confirmPassword) {
      setAlert({ type: "error", message: "Both fields are required" });
      return;
    }
    if (newPassword.length < 6) {
      setAlert({
        type: "error",
        message: "Password must be at least 6 characters",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match" });
      return;
    }

    try {
      setSavingPwd(true);
      const res = await fetch(`/api/admin/users/${pwdUser.id}/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAlert({
          type: "error",
          message: data.error || "Failed to update password",
        });
        return;
      }
      setAlert({ type: "success", message: "Password updated successfully" });
      setPwdUser(null);
      setNewPassword("");
      setConfirmPassword("");
      // Refresh parent list
      fetchAdmins();
    } catch (e) {
      setAlert({ type: "error", message: "Network error" });
    } finally {
      setSavingPwd(false);
    }
  };

  const closeAllDropdowns = () => {
    try {
      const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
      document.dispatchEvent(ev);
    } catch (e) {
      // ignore
    }
  };

  const handleReactivateAdmin = async (userId: number, userName: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        closeAllDropdowns();
        setAlert({
          type: "success",
          message: `${userName} has been reactivated`,
        });
        fetchAdmins();
      } else {
        const json = await res.json().catch(() => ({}));
        setAlert({
          type: "error",
          message: json.error || "Failed to reactivate admin",
        });
      }
    } catch (e) {
      setAlert({ type: "error", message: "Network error" });
    }
  };

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Admin Users
          </CardTitle>
          <CardDescription>
            View and manage administrator accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-900">
                    User
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
                {filtered.length > 0 ? (
                  filtered.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
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
                          className={
                            user.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {user.status === "active" ? "Active" : "Suspended"}
                        </Badge>
                      </td>
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
                                    <Eye className="w-4 h-4 mr-2" /> View
                                    Details
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
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                          <h3 className="font-medium mb-2">
                                            Personal Information
                                          </h3>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex items-center space-x-2">
                                              <Users className="w-4 h-4 text-gray-400" />
                                              <span>
                                                {selectedUser.full_name}
                                              </span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                              <Users className="w-4 h-4 text-gray-400" />
                                              <Users className="w-4 h-4 text-gray-400" />
                                              <span>
                                                {selectedUser.full_name}
                                              </span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                              <Users className="w-4 h-4 text-gray-400" />
                                              <span>
                                                @{selectedUser.username}
                                              </span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                              <Users className="w-4 h-4 text-gray-400" />
                                              <span>{selectedUser.email}</span>
                                            </div>

                                            {selectedUser.phone && (
                                              <div className="flex items-center space-x-2">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span>
                                                  {selectedUser.phone}
                                                </span>
                                              </div>
                                            )}

                                            {/* State and District (if available) */}
                                            {/* State and District (if available), shown on separate lines */}
                                            {selectedUser.state && (
                                              <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>
                                                  State: {selectedUser.state}
                                                </span>
                                              </div>
                                            )}
                                            {selectedUser.district && (
                                              <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>
                                                  District:{" "}
                                                  {selectedUser.district}
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
                                                <UserCheck className="w-4 h-4" />
                                              </div>
                                              <span>
                                                Role:{" "}
                                                {selectedUser.role
                                                  ?.charAt(0)
                                                  ?.toUpperCase() +
                                                  selectedUser.role?.slice(1)}
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
                                                  ?.charAt(0)
                                                  ?.toUpperCase() +
                                                  selectedUser.status?.slice(1)}
                                              </span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                              <Users className="w-4 h-4 text-gray-400" />
                                              <span>
                                                User ID: #{selectedUser.id}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <h3 className="font-medium mb-2">
                                          Account Timeline
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                          <div className="flex items-center space-x-2">
                                            <Users className="w-4 h-4 text-gray-400" />
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
                                            <Users className="w-4 h-4 text-gray-400" />
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

                                      <div className="flex flex-wrap gap-2 pt-4">
                                        {currentUserFull?.admin_type ===
                                          "system" &&
                                        selectedUser?.admin_type === "state" ? (
                                          <>
                                            {selectedUser?.status ===
                                            "active" ? (
                                              <>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="flex-1 sm:flex-none"
                                                    >
                                                      <ShieldOff className="w-4 h-4 mr-2" />
                                                      Suspend Admin
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>
                                                        Suspend Admin
                                                      </AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Are you sure you want to
                                                        suspend{" "}
                                                        {
                                                          selectedUser?.full_name
                                                        }
                                                        ? They will not be able
                                                        to access their account
                                                        until reactivated.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>
                                                        Cancel
                                                      </AlertDialogCancel>
                                                      <AlertDialogAction
                                                        onClick={async () => {
                                                          if (!selectedUser)
                                                            return;
                                                          try {
                                                            const res =
                                                              await fetchWithAuth(
                                                                `/api/admin/users/${selectedUser.id}/suspend`,
                                                                {
                                                                  method:
                                                                    "POST",
                                                                  headers: {
                                                                    "Content-Type":
                                                                      "application/json",
                                                                  },
                                                                },
                                                              );
                                                            const json =
                                                              await res.json();
                                                            if (res.ok) {
                                                              closeAllDropdowns();
                                                              closeAllDropdowns();
                                                              setAlert({
                                                                type: "success",
                                                                message:
                                                                  "Admin suspended",
                                                              });
                                                              fetchAdmins();
                                                            } else {
                                                              setAlert({
                                                                type: "error",
                                                                message:
                                                                  json.error ||
                                                                  "Failed to suspend admin",
                                                              });
                                                            }
                                                          } catch (e) {
                                                            setAlert({
                                                              type: "error",
                                                              message:
                                                                "Network error",
                                                            });
                                                          }
                                                        }}
                                                      >
                                                        Suspend
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>

                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button
                                                      variant="destructive"
                                                      size="sm"
                                                      className="flex-1 sm:flex-none"
                                                    >
                                                      <Trash2 className="w-4 h-4 mr-2" />
                                                      Delete Admin
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>
                                                        Delete Admin
                                                      </AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Warning: This action
                                                        cannot be undone. This
                                                        will permanently delete{" "}
                                                        {
                                                          selectedUser?.full_name
                                                        }
                                                        's account and remove
                                                        all of their data from
                                                        our servers.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>
                                                        Cancel
                                                      </AlertDialogCancel>
                                                      <AlertDialogAction
                                                        onClick={async () => {
                                                          if (!selectedUser)
                                                            return;
                                                          try {
                                                            const res =
                                                              await fetchWithAuth(
                                                                `/api/admin/users/${selectedUser.id}`,
                                                                {
                                                                  method:
                                                                    "DELETE",
                                                                  headers: {
                                                                    "Content-Type":
                                                                      "application/json",
                                                                  },
                                                                },
                                                              );
                                                            const json =
                                                              await res.json();
                                                            if (res.ok) {
                                                              closeAllDropdowns();
                                                              closeAllDropdowns();
                                                              setAlert({
                                                                type: "success",
                                                                message:
                                                                  "Admin deleted",
                                                              });
                                                              fetchAdmins();
                                                            } else {
                                                              setAlert({
                                                                type: "error",
                                                                message:
                                                                  json.error ||
                                                                  "Failed to delete admin",
                                                              });
                                                            }
                                                          } catch (e) {
                                                            setAlert({
                                                              type: "error",
                                                              message:
                                                                "Network error",
                                                            });
                                                          }
                                                        }}
                                                      >
                                                        Delete Permanently
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                              </>
                                            ) : (
                                              <>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="flex-1 sm:flex-none"
                                                  onClick={() =>
                                                    selectedUser &&
                                                    handleReactivateAdmin(
                                                      selectedUser.id,
                                                      selectedUser.full_name,
                                                    )
                                                  }
                                                >
                                                  <Shield className="w-4 h-4 mr-2" />
                                                  Reactivate Admin
                                                </Button>

                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button
                                                      variant="destructive"
                                                      size="sm"
                                                      className="flex-1 sm:flex-none"
                                                    >
                                                      <Trash2 className="w-4 h-4 mr-2" />
                                                      Delete Admin
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>
                                                        Delete Admin
                                                      </AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Warning: This action
                                                        cannot be undone. This
                                                        will permanently delete{" "}
                                                        {
                                                          selectedUser?.full_name
                                                        }
                                                        's account and remove
                                                        all of their data from
                                                        our servers.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>
                                                        Cancel
                                                      </AlertDialogCancel>
                                                      <AlertDialogAction
                                                        onClick={async () => {
                                                          if (!selectedUser)
                                                            return;
                                                          try {
                                                            const res =
                                                              await fetchWithAuth(
                                                                `/api/admin/users/${selectedUser.id}`,
                                                                {
                                                                  method:
                                                                    "DELETE",
                                                                  headers: {
                                                                    "Content-Type":
                                                                      "application/json",
                                                                  },
                                                                },
                                                              );
                                                            const json =
                                                              await res.json();
                                                            if (res.ok) {
                                                              closeAllDropdowns();
                                                              closeAllDropdowns();
                                                              setAlert({
                                                                type: "success",
                                                                message:
                                                                  "Admin deleted",
                                                              });
                                                              fetchAdmins();
                                                            } else {
                                                              setAlert({
                                                                type: "error",
                                                                message:
                                                                  json.error ||
                                                                  "Failed to delete admin",
                                                              });
                                                            }
                                                          } catch (e) {
                                                            setAlert({
                                                              type: "error",
                                                              message:
                                                                "Network error",
                                                            });
                                                          }
                                                        }}
                                                      >
                                                        Delete Permanently
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                              </>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="flex-1 sm:flex-none"
                                                      disabled
                                                    >
                                                      <ShieldOff className="w-4 h-4 mr-2" />
                                                      Suspend User
                                                    </Button>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  Suspending administrators is
                                                  not allowed
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div>
                                                    <Button
                                                      variant="destructive"
                                                      size="sm"
                                                      className="flex-1 sm:flex-none"
                                                      disabled
                                                    >
                                                      <Trash2 className="w-4 h-4 mr-2" />
                                                      Delete User
                                                    </Button>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  Deleting administrators is not
                                                  allowed
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <DropdownMenuSeparator />

                              <Dialog
                                open={!!pwdUser && pwdUser.id === user.id}
                                onOpenChange={(open) => {
                                  if (!open) setPwdUser(null);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      setPwdUser(user);
                                    }}
                                  >
                                    <KeyRound className="w-4 h-4 mr-2" /> Change
                                    Password
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Change Password</DialogTitle>
                                    <DialogDescription>
                                      Set a new password for{" "}
                                      {pwdUser?.full_name}. Current password is
                                      not required.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3">
                                    <Input
                                      type="password"
                                      placeholder="New password (min 6 characters)"
                                      value={newPassword}
                                      onChange={(e) =>
                                        setNewPassword(e.target.value)
                                      }
                                    />
                                    <Input
                                      type="password"
                                      placeholder="Confirm new password"
                                      value={confirmPassword}
                                      onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                      }
                                    />
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        onClick={submitPassword}
                                        disabled={savingPwd}
                                        className="flex-1"
                                      >
                                        {savingPwd
                                          ? "Saving..."
                                          : "Update Password"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setPwdUser(null);
                                          setNewPassword("");
                                          setConfirmPassword("");
                                        }}
                                        className="flex-1"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <DropdownMenuSeparator />

                              {currentUserFull?.admin_type === "system" &&
                              user.admin_type === "state" ? (
                                <>
                                  {user.status === "active" ? (
                                    <>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <div>
                                            <DropdownMenuItem
                                              onSelect={(e) => {
                                                e.preventDefault();
                                              }}
                                            >
                                              <ShieldOff className="w-4 h-4 mr-2" />{" "}
                                              Suspend Admin
                                            </DropdownMenuItem>
                                          </div>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Suspend Admin
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
                                              onClick={async () => {
                                                try {
                                                  const res =
                                                    await fetchWithAuth(
                                                      `/api/admin/users/${user.id}/suspend`,
                                                      {
                                                        method: "POST",
                                                        headers: {
                                                          "Content-Type":
                                                            "application/json",
                                                        },
                                                      },
                                                    );
                                                  const json = await res.json();
                                                  if (res.ok) {
                                                    closeAllDropdowns();
                                                    closeAllDropdowns();
                                                    setAlert({
                                                      type: "success",
                                                      message:
                                                        "Admin suspended",
                                                    });
                                                    fetchAdmins();
                                                  } else {
                                                    setAlert({
                                                      type: "error",
                                                      message:
                                                        json.error ||
                                                        "Failed to suspend admin",
                                                    });
                                                  }
                                                } catch (e) {
                                                  setAlert({
                                                    type: "error",
                                                    message: "Network error",
                                                  });
                                                }
                                              }}
                                            >
                                              Suspend
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <div>
                                            <DropdownMenuItem
                                              onSelect={(e) => {
                                                e.preventDefault();
                                              }}
                                              className="text-red-600 focus:text-red-600"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />{" "}
                                              Delete Admin
                                            </DropdownMenuItem>
                                          </div>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Admin
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Warning: This action cannot be
                                              undone. This will permanently
                                              delete {user.full_name}'s account
                                              and remove all of their data from
                                              our servers.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={async () => {
                                                try {
                                                  const res =
                                                    await fetchWithAuth(
                                                      `/api/admin/users/${user.id}`,
                                                      {
                                                        method: "DELETE",
                                                        headers: {
                                                          "Content-Type":
                                                            "application/json",
                                                        },
                                                      },
                                                    );
                                                  const json = await res.json();
                                                  if (res.ok) {
                                                    closeAllDropdowns();
                                                    closeAllDropdowns();
                                                    setAlert({
                                                      type: "success",
                                                      message: "Admin deleted",
                                                    });
                                                    fetchAdmins();
                                                  } else {
                                                    setAlert({
                                                      type: "error",
                                                      message:
                                                        json.error ||
                                                        "Failed to delete admin",
                                                    });
                                                  }
                                                } catch (e) {
                                                  setAlert({
                                                    type: "error",
                                                    message: "Network error",
                                                  });
                                                }
                                              }}
                                            >
                                              Delete Permanently
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  ) : (
                                    <>
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          handleReactivateAdmin(
                                            user.id,
                                            user.full_name,
                                          );
                                        }}
                                      >
                                        <Shield className="w-4 h-4 mr-2" />{" "}
                                        Reactivate Admin
                                      </DropdownMenuItem>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <div>
                                            <DropdownMenuItem
                                              onSelect={(e) => {
                                                e.preventDefault();
                                              }}
                                              className="text-red-600 focus:text-red-600"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />{" "}
                                              Delete Admin
                                            </DropdownMenuItem>
                                          </div>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Admin
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Warning: This action cannot be
                                              undone. This will permanently
                                              delete {user.full_name}'s account
                                              and remove all of their data from
                                              our servers.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={async () => {
                                                try {
                                                  const res =
                                                    await fetchWithAuth(
                                                      `/api/admin/users/${user.id}`,
                                                      {
                                                        method: "DELETE",
                                                        headers: {
                                                          "Content-Type":
                                                            "application/json",
                                                        },
                                                      },
                                                    );
                                                  const json = await res.json();
                                                  if (res.ok) {
                                                    closeAllDropdowns();
                                                    closeAllDropdowns();
                                                    setAlert({
                                                      type: "success",
                                                      message: "Admin deleted",
                                                    });
                                                    fetchAdmins();
                                                  } else {
                                                    setAlert({
                                                      type: "error",
                                                      message:
                                                        json.error ||
                                                        "Failed to delete admin",
                                                    });
                                                  }
                                                } catch (e) {
                                                  setAlert({
                                                    type: "error",
                                                    message: "Network error",
                                                  });
                                                }
                                              }}
                                            >
                                              Delete Permanently
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <DropdownMenuItem disabled>
                                            <ShieldOff className="w-4 h-4 mr-2" />{" "}
                                            Suspend Admin
                                          </DropdownMenuItem>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Not allowed for admin accounts
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <DropdownMenuItem
                                            disabled
                                            className="text-red-600 focus:text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />{" "}
                                            Delete Admin
                                          </DropdownMenuItem>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Not allowed for admin accounts
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No admins found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-700 mt-4">
            Showing {filtered.length} of {admins.length} admins
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
