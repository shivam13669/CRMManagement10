import { useState, useEffect } from "react";
import { HospitalLayout } from "../components/HospitalLayout";
import {
  Truck,
  Plus,
  Trash2,
  SquarePen,
  MapPin,
  Phone,
  AlertCircle,
  Loader,
  Check,
  Pause,
  User,
  FileText,
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
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

interface Ambulance {
  id: number;
  hospital_user_id: number;
  registration_number: string;
  ambulance_type: string;
  model?: string;
  manufacturer?: string;
  registration_year?: number;
  driver_name?: string;
  driver_phone?: string;
  driver_license_number?: string;
  equipment?: string;
  status: string;
  current_location?: string;
  assigned_request_id?: number;
  emergency_type?: string;
  pickup_address?: string;
  patient_name?: string;
  patient_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export default function HospitalAmbulances() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(
    null,
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(
    null,
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    registration_number: "",
    ambulance_type: "Basic Life Support",
    model: "",
    manufacturer: "",
    registration_year: new Date().getFullYear(),
    driver_name: "",
    driver_phone: "",
    driver_license_number: "",
    equipment: "",
    current_location: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [parking, setParking] = useState<number | null>(null);

  const fetchAmbulances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch("/api/hospital/ambulances", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAmbulances(data.ambulances || []);
      } else {
        console.error("Failed to fetch ambulances:", response.status);
        toast.error("Failed to load ambulances");
      }
    } catch (error) {
      console.error("Error fetching ambulances:", error);
      toast.error("Error loading ambulances");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      registration_number: "",
      ambulance_type: "Basic Life Support",
      model: "",
      manufacturer: "",
      registration_year: new Date().getFullYear(),
      driver_name: "",
      driver_phone: "",
      driver_license_number: "",
      equipment: "",
      current_location: "",
    });
  };

  const handleCreateAmbulance = async () => {
    try {
      if (!formData.registration_number) {
        toast.error("Registration number is required");
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/hospital/ambulances", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Ambulance added successfully");
        resetForm();
        setCreateDialogOpen(false);
        fetchAmbulances();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create ambulance");
      }
    } catch (error) {
      console.error("Error creating ambulance:", error);
      toast.error("Error creating ambulance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAmbulance = async () => {
    try {
      if (!editingAmbulance || !formData.registration_number) {
        toast.error("Registration number is required");
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `/api/hospital/ambulances/${editingAmbulance.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        toast.success("Ambulance updated successfully");
        resetForm();
        setEditDialogOpen(false);
        setEditingAmbulance(null);
        fetchAmbulances();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update ambulance");
      }
    } catch (error) {
      console.error("Error updating ambulance:", error);
      toast.error("Error updating ambulance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAmbulance = async (ambulanceId: number) => {
    if (!confirm("Are you sure you want to delete this ambulance?")) return;

    try {
      setDeleting(ambulanceId);
      const token = localStorage.getItem("authToken");

      const response = await fetch(`/api/hospital/ambulances/${ambulanceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Ambulance deleted successfully");
        fetchAmbulances();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete ambulance");
      }
    } catch (error) {
      console.error("Error deleting ambulance:", error);
      toast.error("Error deleting ambulance");
    } finally {
      setDeleting(null);
    }
  };

  const handleParkAmbulance = async (ambulanceId: number) => {
    try {
      setParking(ambulanceId);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `/api/hospital/ambulances/${ambulanceId}/park`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        toast.success("Ambulance marked as available");
        fetchAmbulances();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to park ambulance");
      }
    } catch (error) {
      console.error("Error parking ambulance:", error);
      toast.error("Error parking ambulance");
    } finally {
      setParking(null);
    }
  };

  const handleEdit = (ambulance: Ambulance) => {
    setEditingAmbulance(ambulance);
    setFormData({
      registration_number: ambulance.registration_number,
      ambulance_type: ambulance.ambulance_type,
      model: ambulance.model || "",
      manufacturer: ambulance.manufacturer || "",
      registration_year:
        ambulance.registration_year || new Date().getFullYear(),
      driver_name: ambulance.driver_name || "",
      driver_phone: ambulance.driver_phone || "",
      driver_license_number: ambulance.driver_license_number || "",
      equipment: ambulance.equipment || "",
      current_location: ambulance.current_location || "",
    });
    setEditDialogOpen(true);
  };

  const handleViewDetails = (ambulance: Ambulance) => {
    setSelectedAmbulance(ambulance);
    setDetailsDialogOpen(true);
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Available
          </Badge>
        );
      case "assigned":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Assigned
          </Badge>
        );
      case "parked":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Parked
          </Badge>
        );
      case "maintenance":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const availableCount = ambulances.filter(
    (a) => a.status === "available",
  ).length;
  const assignedCount = ambulances.filter(
    (a) => a.status === "assigned",
  ).length;

  if (loading) {
    return (
      <HospitalLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading ambulances...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">
              Ambulance Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage ambulances and view service requests
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setCreateDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Ambulance
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ambulances</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {ambulances.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {availableCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assigned</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {assignedCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ambulances List */}
        {ambulances.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Ambulances Added
              </h3>
              <p className="text-gray-600 mb-6">
                Start by adding your first ambulance to manage emergency
                requests
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setCreateDialogOpen(true);
                }}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Ambulance
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambulances.map((ambulance) => (
              <Card
                key={ambulance.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(ambulance)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {ambulance.registration_number}
                      </CardTitle>
                      <CardDescription>
                        {ambulance.ambulance_type}
                      </CardDescription>
                    </div>
                    {getStatusBadge(ambulance.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {ambulance.model && (
                    <div className="text-sm">
                      <p className="text-gray-600">Model</p>
                      <p className="font-medium text-gray-900">
                        {ambulance.model}
                      </p>
                    </div>
                  )}

                  {ambulance.driver_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Driver</p>
                        <p className="font-medium text-gray-900">
                          {ambulance.driver_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {ambulance.driver_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900">{ambulance.driver_phone}</p>
                    </div>
                  )}

                  {ambulance.current_location && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <p className="text-gray-900 line-clamp-2">
                        {ambulance.current_location}
                      </p>
                    </div>
                  )}

                  {ambulance.status === "assigned" &&
                    ambulance.patient_name && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-2">
                          Currently Assigned
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className="text-blue-800">
                            <span className="font-medium">Patient:</span>{" "}
                            {ambulance.patient_name}
                          </p>
                          {ambulance.emergency_type && (
                            <p className="text-blue-800">
                              <span className="font-medium">Type:</span>{" "}
                              {ambulance.emergency_type}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="p-2 h-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(ambulance);
                      }}
                    >
                      <SquarePen className="w-4 h-4" />
                    </Button>

                    {ambulance.status === "assigned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="p-2 h-auto"
                        disabled={parking === ambulance.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleParkAmbulance(ambulance.id);
                        }}
                      >
                        {parking === ambulance.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="p-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deleting === ambulance.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAmbulance(ambulance.id);
                      }}
                    >
                      {deleting === ambulance.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Ambulance</DialogTitle>
              <DialogDescription>
                Fill in the ambulance details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registration_number">
                    Registration Number *
                  </Label>
                  <Input
                    id="registration_number"
                    placeholder="e.g., KA-01-AB-1234"
                    value={formData.registration_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registration_number: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="ambulance_type">Ambulance Type *</Label>
                  <Select
                    value={formData.ambulance_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ambulance_type: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic Life Support">
                        Basic Life Support
                      </SelectItem>
                      <SelectItem value="Advanced Life Support">
                        Advanced Life Support
                      </SelectItem>
                      <SelectItem value="Ventilator Support">
                        Ventilator Support
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Maruti Suzuki Bolero"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., Maruti Suzuki"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manufacturer: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="registration_year">Registration Year</Label>
                  <Input
                    id="registration_year"
                    type="number"
                    value={formData.registration_year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registration_year: parseInt(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="driver_name">Driver Name</Label>
                  <Input
                    id="driver_name"
                    placeholder="e.g., John Doe"
                    value={formData.driver_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        driver_name: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="driver_phone">Driver Phone</Label>
                  <Input
                    id="driver_phone"
                    placeholder="e.g., 9876543210"
                    value={formData.driver_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        driver_phone: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="driver_license_number">
                    Driver License Number
                  </Label>
                  <Input
                    id="driver_license_number"
                    placeholder="e.g., DL-123456789"
                    value={formData.driver_license_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        driver_license_number: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="equipment">Equipment</Label>
                <Textarea
                  id="equipment"
                  placeholder="e.g., Oxygen supply, Stretcher, First aid kit..."
                  value={formData.equipment}
                  onChange={(e) =>
                    setFormData({ ...formData, equipment: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="current_location">Current Location</Label>
                <Input
                  id="current_location"
                  placeholder="e.g., Hospital Parking Lot 1"
                  value={formData.current_location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_location: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAmbulance} disabled={submitting}>
                {submitting ? "Creating..." : "Create Ambulance"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Ambulance</DialogTitle>
              <DialogDescription>Update ambulance details</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_registration_number">
                    Registration Number *
                  </Label>
                  <Input
                    id="edit_registration_number"
                    placeholder="e.g., KA-01-AB-1234"
                    value={formData.registration_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registration_number: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_ambulance_type">Ambulance Type *</Label>
                  <Select
                    value={formData.ambulance_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ambulance_type: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic Life Support">
                        Basic Life Support
                      </SelectItem>
                      <SelectItem value="Advanced Life Support">
                        Advanced Life Support
                      </SelectItem>
                      <SelectItem value="Ventilator Support">
                        Ventilator Support
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit_model">Model</Label>
                  <Input
                    id="edit_model"
                    placeholder="e.g., Maruti Suzuki Bolero"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_manufacturer">Manufacturer</Label>
                  <Input
                    id="edit_manufacturer"
                    placeholder="e.g., Maruti Suzuki"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manufacturer: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_registration_year">
                    Registration Year
                  </Label>
                  <Input
                    id="edit_registration_year"
                    type="number"
                    value={formData.registration_year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registration_year: parseInt(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_driver_name">Driver Name</Label>
                  <Input
                    id="edit_driver_name"
                    placeholder="e.g., John Doe"
                    value={formData.driver_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        driver_name: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_driver_phone">Driver Phone</Label>
                  <Input
                    id="edit_driver_phone"
                    placeholder="e.g., 9876543210"
                    value={formData.driver_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        driver_phone: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_driver_license_number">
                    Driver License Number
                  </Label>
                  <Input
                    id="edit_driver_license_number"
                    placeholder="e.g., DL-123456789"
                    value={formData.driver_license_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        driver_license_number: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_equipment">Equipment</Label>
                <Textarea
                  id="edit_equipment"
                  placeholder="e.g., Oxygen supply, Stretcher, First aid kit..."
                  value={formData.equipment}
                  onChange={(e) =>
                    setFormData({ ...formData, equipment: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit_current_location">Current Location</Label>
                <Input
                  id="edit_current_location"
                  placeholder="e.g., Hospital Parking Lot 1"
                  value={formData.current_location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_location: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateAmbulance} disabled={submitting}>
                {submitting ? "Updating..." : "Update Ambulance"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ambulance Details</DialogTitle>
            </DialogHeader>

            {selectedAmbulance && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Registration Number</p>
                    <p className="font-semibold text-lg">
                      {selectedAmbulance.registration_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="mt-2">
                      {getStatusBadge(selectedAmbulance.status)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold">
                      {selectedAmbulance.ambulance_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-semibold">
                      {selectedAmbulance.model || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Manufacturer</p>
                    <p className="font-semibold">
                      {selectedAmbulance.manufacturer || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registration Year</p>
                    <p className="font-semibold">
                      {selectedAmbulance.registration_year || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Driver Name</p>
                    <p className="font-semibold">
                      {selectedAmbulance.driver_name || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Driver Phone</p>
                    <p className="font-semibold">
                      {selectedAmbulance.driver_phone || "Not specified"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Driver License</p>
                    <p className="font-semibold">
                      {selectedAmbulance.driver_license_number ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                {selectedAmbulance.equipment && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">Equipment</p>
                    <p className="font-semibold mt-1">
                      {selectedAmbulance.equipment}
                    </p>
                  </div>
                )}

                {selectedAmbulance.current_location && (
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Current Location
                        </p>
                        <p className="font-semibold">
                          {selectedAmbulance.current_location}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAmbulance.status === "assigned" &&
                  selectedAmbulance.patient_name && (
                    <div className="pt-4 border-t bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 mb-3">
                        Currently Assigned to Service Request
                      </p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-blue-600">Patient Name</p>
                          <p className="font-semibold text-blue-900">
                            {selectedAmbulance.patient_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-600">Emergency Type</p>
                          <p className="font-semibold text-blue-900">
                            {selectedAmbulance.emergency_type}
                          </p>
                        </div>
                        {selectedAmbulance.patient_phone && (
                          <div>
                            <p className="text-blue-600">Patient Phone</p>
                            <p className="font-semibold text-blue-900">
                              {selectedAmbulance.patient_phone}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDetailsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </HospitalLayout>
  );
}
