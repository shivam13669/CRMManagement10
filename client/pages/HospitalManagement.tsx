import { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import statesDistricts from "../../shared/india-states-districts.json";
import {
  Plus,
  MapPin,
  Phone,
  AlertCircle,
  Trash2,
  Search,
  Filter,
  Download,
  Building2,
  TrendingUp,
  Calendar,
  Ambulance,
  Edit3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HospitalItem {
  id: number;
  user_id: number;
  hospital_name: string;
  address: string;
  phone_number?: string | null;
  hospital_type?: string | null;
  license_number?: string | null;
  number_of_ambulances?: number | null;
  number_of_beds?: number | null;
  departments?: string | null;
  google_map_enabled?: number | boolean;
  google_map_link?: string | null;
  status?: string;
  email: string;
  created_at?: string;
}

function extractPinCode(address: string): string {
  if (!address) return "";
  const match = address.match(/\b\d{6}\b/);
  return match ? match[0] : "";
}

export default function HospitalManagement() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHospitalId, setEditingHospitalId] = useState<number | null>(
    null,
  );
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHospitalType, setFilterHospitalType] = useState("all");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    hospital_name: "",
    address_lane1: "",
    address_lane2: "",
    state: "",
    district: "",
    pin_code: "",
    hospital_type: "General",
    license_number: "",
    number_of_ambulances: "0",
    number_of_beds: "0",
    departments: "",
    location_enabled: false,
    location_link: "",
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [contactNumberInput, setContactNumberInput] = useState("");
  const [contactNumbers, setContactNumbers] = useState<string[]>([]);
  const [departmentInput, setDepartmentInput] = useState("");
  const [departmentItems, setDepartmentItems] = useState<string[]>([]);
  const [updateCredentials, setUpdateCredentials] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Cleanup stray text nodes (some rendering environments can inject orphaned text nodes like "0")
  useEffect(() => {
    const cleanup = () => {
      try {
        const container = document.getElementById("hospital-list");
        if (!container) return;
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              if (node.nodeValue && node.nodeValue.trim() === "0") {
                const parent = node.parentElement;
                // keep if value rendered inside expected value elements
                if (
                  parent &&
                  parent.classList &&
                  (parent.classList.contains("font-semibold") ||
                    parent.classList.contains("px-2"))
                ) {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
              return NodeFilter.FILTER_REJECT;
            },
          },
        );
        const nodes: Text[] = [];
        let n: Text | null = walker.nextNode() as Text | null;
        while (n) {
          nodes.push(n);
          n = walker.nextNode() as Text | null;
        }
        for (const t of nodes) {
          if (t.parentNode) t.parentNode.removeChild(t);
        }
      } catch (e) {
        // silent
      }
    };

    // run once after mount and after hospitals change
    cleanup();
    const id = setInterval(cleanup, 500);
    return () => clearInterval(id);
  }, [hospitals]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/hospitals", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHospitals((data.hospitals || []) as HospitalItem[]);
      } else {
        throw new Error("Failed to load hospitals");
      }
    } catch (error) {
      console.error("Failed to fetch hospitals:", error);
      toast({
        title: "Error",
        description: "Failed to load hospitals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: hospitals.length,
    active: hospitals.filter((h) => h.status === "active").length,
    newThisMonth: hospitals.filter((h) => {
      const created = new Date(h.created_at || "");
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length,
    totalAmbulances: hospitals.reduce(
      (sum, h) => sum + (h.number_of_ambulances || 0),
      0,
    ),
  };

  const addContactNumber = () => {
    const digits = contactNumberInput.replace(/[^0-9]/g, "").trim();
    if (!digits) return;
    const formatted = `${countryCode} ${digits}`;
    setContactNumbers((prev) => Array.from(new Set([...prev, formatted])));
    setContactNumberInput("");
  };

  const removeContactNumber = (num: string) => {
    setContactNumbers((prev) => prev.filter((n) => n !== num));
  };

  const openEdit = (hospital: any) => {
    setEditingHospitalId(hospital.id);
    setUpdateCredentials(false);
    setFormData((p) => ({
      ...p,
      email: hospital.email || "",
      password: "",
      confirmPassword: "",
      hospital_name: hospital.hospital_name || "",
      address_lane1:
        hospital.address_lane1 ||
        (hospital.address || "").split(",")[0]?.trim() ||
        "",
      address_lane2:
        hospital.address_lane2 ||
        (() => {
          const parts = (hospital.address || "").split(",");
          const second = (parts[1] || "").trim();
          return second && second !== hospital.district ? second : "";
        })(),
      state: hospital.state || "",
      district: hospital.district || "",
      pin_code:
        hospital.pin_code || extractPinCode(hospital.address || "") || "",
      hospital_type: hospital.hospital_type || "General",
      license_number: hospital.license_number || "",
      number_of_ambulances: String(hospital.number_of_ambulances || 0),
      number_of_beds: String(hospital.number_of_beds || 0),
      departments: hospital.departments || "",
      location_enabled: Boolean(hospital.google_map_enabled),
      location_link: hospital.google_map_link || "",
    }));

    const phones = (hospital.phone_number || hospital.phoneList || "")
      .toString()
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);
    setContactNumbers(phones);
    if (phones.length > 0) {
      const first = phones[0];
      const match = first.match(/^\+(\d{1,3})/);
      setCountryCode(match ? `+${match[1]}` : "+91");
    }

    if (hospital.departments) {
      setDepartmentItems(
        hospital.departments
          .toString()
          .split(",")
          .map((d: string) => d.trim())
          .filter(Boolean),
      );
    } else {
      setDepartmentItems([]);
    }

    setShowCreateForm(true);
  };

  const addDepartment = () => {
    const parts = departmentInput
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setDepartmentItems((prev) => {
      const set = new Set(prev.map((s) => s.toLowerCase()));
      const merged: string[] = [...prev];
      for (const p of parts) {
        if (!set.has(p.toLowerCase())) {
          merged.push(p);
          set.add(p.toLowerCase());
        }
      }
      return merged;
    });
    setDepartmentInput("");
  };

  const removeDepartment = (dept: string) => {
    setDepartmentItems((prev) => prev.filter((d) => d !== dept));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If editing, password is optional
    if (!editingHospitalId) {
      if (formData.password !== formData.confirmPassword) {
        toast({ title: "Passwords do not match", variant: "destructive" });
        return;
      }

      if (
        !formData.email ||
        !formData.password ||
        !formData.hospital_name ||
        !formData.address_lane1 ||
        !formData.state ||
        !formData.district ||
        !formData.pin_code
      ) {
        toast({
          title: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      if (!/^\d{6}$/.test(formData.pin_code)) {
        toast({
          title: "Enter a valid 6-digit PIN code",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.hospital_name || !formData.address_lane1) {
        toast({ title: "Please fill required fields", variant: "destructive" });
        return;
      }
      if (formData.pin_code && !/^\d{6}$/.test(formData.pin_code)) {
        toast({
          title: "Enter a valid 6-digit PIN code",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      if (editingHospitalId) {
        // Admin update
        const address =
          `${formData.address_lane1}${formData.address_lane2 ? ", " + formData.address_lane2 : ""}, ${formData.district}, ${formData.state} ${formData.pin_code || ""}`.trim();
        const response = await fetch(
          `/api/admin/hospitals/${editingHospitalId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              hospital_name: formData.hospital_name,
              address,
              address_lane1: formData.address_lane1,
              address_lane2: formData.address_lane2 || undefined,
              state: formData.state,
              district: formData.district,
              pin_code: formData.pin_code || undefined,
              phone_number: contactNumbers.join(","),
              hospital_type: formData.hospital_type,
              license_number: formData.license_number || undefined,
              number_of_ambulances: parseInt(
                formData.number_of_ambulances || "0",
                10,
              ),
              number_of_beds: parseInt(formData.number_of_beds || "0", 10),
              departments: departmentItems.length
                ? departmentItems.join(",")
                : undefined,
              google_map_enabled: formData.location_enabled,
              google_map_link: formData.location_enabled
                ? formData.location_link
                : undefined,
            }),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          toast({
            title: "Error",
            description:
              data.error || data.message || "Failed to update hospital",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Hospital updated",
          description: `\"${formData.hospital_name}\" updated successfully!`,
        });
        setEditingHospitalId(null);
        setShowCreateForm(false);
        fetchHospitals();
        return;
      }

      // Create new hospital
      const response = await fetch("/api/admin/hospitals/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.hospital_name,
          hospital_name: formData.hospital_name,
          address_lane1: formData.address_lane1,
          address_lane2: formData.address_lane2 || undefined,
          state: formData.state,
          district: formData.district,
          pin_code: formData.pin_code || undefined,
          phone_number: contactNumbers.join(","),
          hospital_type: formData.hospital_type,
          license_number: formData.license_number || undefined,
          number_of_ambulances: parseInt(
            formData.number_of_ambulances || "0",
            10,
          ),
          number_of_beds: parseInt(formData.number_of_beds || "0", 10),
          departments: departmentItems.length
            ? departmentItems.join(",")
            : undefined,
          google_map_enabled: formData.location_enabled,
          google_map_link: formData.location_enabled
            ? formData.location_link
            : undefined,
        }),
      });

      let data: any = {};

      try {
        data = await response.json();
      } catch (e) {
        console.error("Failed to parse response:", e);
        data = { message: "Failed to read server response" };
      }

      if (!response.ok) {
        toast({
          title: "Error",
          description:
            data.error || data.message || "Failed to create hospital",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Hospital created",
        description: `\"${formData.hospital_name}\" created successfully!`,
      });

      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        hospital_name: "",
        address_lane1: "",
        address_lane2: "",
        state: "",
        district: "",
        pin_code: "",
        hospital_type: "General",
        license_number: "",
        number_of_ambulances: "0",
        number_of_beds: "0",
        departments: "",
        location_enabled: false,
        location_link: "",
      });
      setCountryCode("+91");
      setContactNumbers([]);
      setContactNumberInput("");
      setDepartmentItems([]);
      setDepartmentInput("");
      setShowCreateForm(false);
      fetchHospitals();
    } catch (error) {
      console.error("Error creating hospital:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      const matchesSearch =
        hospital.hospital_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hospital.phone_number && hospital.phone_number.includes(searchTerm));

      const matchesType =
        filterHospitalType === "all" ||
        hospital.hospital_type === filterHospitalType;

      return matchesSearch && matchesType;
    });
  }, [hospitals, searchTerm, filterHospitalType]);

  const hospitalsWithPhones = useMemo(() => {
    return filteredHospitals.map((h) => ({
      ...h,
      phoneList: (h.phone_number || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }));
  }, [filteredHospitals]);

  // Sorted states list and deduplicated, sorted districts for selected state
  const sortedStates = useMemo(() => {
    return [...statesDistricts.states]
      .map((s) => ({
        name: s.name,
        districts: Array.isArray(s.districts) ? [...s.districts] : [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const selectedDistricts = useMemo(() => {
    if (!formData.state) return [] as string[];
    const stateObj = sortedStates.find((s) => s.name === formData.state);
    const districts = (stateObj?.districts || []).filter(Boolean) as string[];
    return Array.from(new Set(districts)).sort((a, b) => a.localeCompare(b));
  }, [formData.state, sortedStates]);

  const hospitalTypes = useMemo(() => {
    return Array.from(
      new Set(hospitals.map((h) => h.hospital_type).filter(Boolean)),
    );
  }, [hospitals]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Hospital Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage hospital accounts
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export List
            </Button>
            <Dialog
              open={showCreateForm}
              onOpenChange={(open) => {
                setShowCreateForm(open);
                if (!open) setEditingHospitalId(null);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setEditingHospitalId(null);
                    setFormData({
                      email: "",
                      password: "",
                      confirmPassword: "",
                      hospital_name: "",
                      address_lane1: "",
                      address_lane2: "",
                      state: "",
                      district: "",
                      pin_code: "",
                      hospital_type: "General",
                      license_number: "",
                      number_of_ambulances: "0",
                      number_of_beds: "0",
                      departments: "",
                      location_enabled: false,
                      location_link: "",
                    });
                    setCountryCode("+91");
                    setContactNumbers([]);
                    setContactNumberInput("");
                    setDepartmentItems([]);
                    setDepartmentInput("");
                    setUpdateCredentials(false);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hospital
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingHospitalId ? "Edit Hospital" : "Add New Hospital"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingHospitalId
                      ? "Update hospital details. Use 'Update Login Credentials' to change email or password."
                      : "Admin-only creation. The hospital will log in using the email and password you set here."}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Admin Account Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Login Credentials
                    </h3>

                    {editingHospitalId && (
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="update_credentials"
                          checked={updateCredentials}
                          onCheckedChange={(checked) =>
                            setUpdateCredentials(Boolean(checked))
                          }
                        />
                        <Label
                          htmlFor="update_credentials"
                          className="cursor-pointer"
                        >
                          Update Login Credentials
                        </Label>
                      </div>
                    )}

                    {(!editingHospitalId || updateCredentials) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                            placeholder="admin@hospital.com"
                            required={!editingHospitalId}
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                password: e.target.value,
                              }))
                            }
                            placeholder="••••••••"
                            required={!editingHospitalId}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="confirmPassword">
                            Confirm Password *
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                confirmPassword: e.target.value,
                              }))
                            }
                            placeholder="••••••••"
                            required={!editingHospitalId}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hospital Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Hospital Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hospital_name">Hospital Name *</Label>
                        <Input
                          id="hospital_name"
                          value={formData.hospital_name}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              hospital_name: e.target.value,
                            }))
                          }
                          placeholder="City General Hospital"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="hospital_type">Hospital Type *</Label>
                        <Select
                          value={formData.hospital_type}
                          onValueChange={(value) =>
                            setFormData((p) => ({ ...p, hospital_type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Specialty">Specialty</SelectItem>
                            <SelectItem value="Private">Private</SelectItem>
                            <SelectItem value="Government">
                              Government
                            </SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="address_lane1">Address Lane 1 *</Label>
                        <Input
                          id="address_lane1"
                          value={formData.address_lane1}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              address_lane1: e.target.value,
                            }))
                          }
                          placeholder="123 Medical Street"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="address_lane2">Address Lane 2</Label>
                        <Input
                          id="address_lane2"
                          value={formData.address_lane2}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              address_lane2: e.target.value,
                            }))
                          }
                          placeholder="Near Park, Building 5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(value) =>
                            setFormData((p) => ({
                              ...p,
                              state: value,
                              district: "",
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {sortedStates.map((state) => (
                              <SelectItem key={state.name} value={state.name}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="district">District *</Label>
                        <Select
                          value={formData.district}
                          onValueChange={(value) =>
                            setFormData((p) => ({
                              ...p,
                              district: value,
                            }))
                          }
                          disabled={!formData.state}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                formData.state
                                  ? "Select District"
                                  : "Select State first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {selectedDistricts.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="pin_code">PIN Code *</Label>
                        <Input
                          id="pin_code"
                          inputMode="numeric"
                          pattern="^[0-9]{6}$"
                          maxLength={6}
                          required={!editingHospitalId}
                          value={formData.pin_code}
                          onChange={(e) => {
                            const digits = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            setFormData((p) => ({
                              ...p,
                              pin_code: digits,
                            }));
                          }}
                          title="Enter 6-digit PIN code"
                          placeholder="110001"
                        />
                      </div>

                      {/* Contact numbers */}
                      <div className="md:col-span-2">
                        <Label>Hospital Contact number(s)</Label>
                        <div className="flex gap-2 mt-1">
                          <Select
                            value={countryCode}
                            onValueChange={setCountryCode}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="+91">+91</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                              <SelectItem value="+971">+971</SelectItem>
                              <SelectItem value="+92">+92</SelectItem>
                              <SelectItem value="+880">+880</SelectItem>
                              <SelectItem value="+977">+977</SelectItem>
                              <SelectItem value="+94">+94</SelectItem>
                              <SelectItem value="+61">+61</SelectItem>
                              <SelectItem value="+81">+81</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="tel"
                            placeholder="9876543210"
                            value={contactNumberInput}
                            onChange={(e) =>
                              setContactNumberInput(e.target.value)
                            }
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={addContactNumber}
                          >
                            Add
                          </Button>
                        </div>
                        {contactNumbers.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {contactNumbers.map((num) => (
                              <span
                                key={num}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                <Phone className="w-3 h-3" />
                                {num}
                                <button
                                  type="button"
                                  onClick={() => removeContactNumber(num)}
                                  aria-label={`Remove ${num}`}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="number_of_ambulances">
                          Numbers of ambulance
                        </Label>
                        <Input
                          id="number_of_ambulances"
                          type="number"
                          value={formData.number_of_ambulances}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              number_of_ambulances: e.target.value,
                            }))
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="number_of_beds">Numbers of beds</Label>
                        <Input
                          id="number_of_beds"
                          type="number"
                          value={formData.number_of_beds}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              number_of_beds: e.target.value,
                            }))
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="license_number">
                          License/Reg. Number
                        </Label>
                        <Input
                          id="license_number"
                          value={formData.license_number}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              license_number: e.target.value,
                            }))
                          }
                          placeholder="LIC123456"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Departments</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            placeholder="Add a department (use commas for multiple)"
                            value={departmentInput}
                            onChange={(e) => setDepartmentInput(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={addDepartment}
                          >
                            Add
                          </Button>
                        </div>
                        {departmentItems.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {departmentItems.map((dept) => (
                              <span
                                key={dept}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200"
                              >
                                {dept}
                                <button
                                  type="button"
                                  onClick={() => removeDepartment(dept)}
                                  aria-label={`Remove ${dept}`}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Location
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="location_enabled"
                          checked={formData.location_enabled}
                          onCheckedChange={(checked) =>
                            setFormData((p) => ({
                              ...p,
                              location_enabled: Boolean(checked),
                            }))
                          }
                        />
                        <Label
                          htmlFor="location_enabled"
                          className="cursor-pointer"
                        >
                          Enable location link
                        </Label>
                      </div>

                      {formData.location_enabled && (
                        <div>
                          <Label htmlFor="location_link">Location URL</Label>
                          <Input
                            id="location_link"
                            type="url"
                            placeholder="Paste any map/location link"
                            value={formData.location_link}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                location_link: e.target.value,
                              }))
                            }
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            This can be any URL (e.g., Google Maps). A "Show
                            Location" button will open it in a new tab.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="min-w-[120px]"
                    >
                      {editingHospitalId
                        ? loading
                          ? "Updating..."
                          : "Update Hospital"
                        : loading
                          ? "Creating..."
                          : "Create Hospital"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Total Hospitals
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.active}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Active Hospitals
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    +{stats.newThisMonth}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    New This Month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Ambulance className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.totalAmbulances}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Total Ambulances
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
              <div className="flex-1 text-[0px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by hospital name, address, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Select
                  value={filterHospitalType}
                  onValueChange={setFilterHospitalType}
                >
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hospital Types</SelectItem>
                    {hospitalTypes.map((type) => (
                      <SelectItem key={type} value={type!}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hospitals List */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            All Hospitals
            <span className="text-sm font-normal text-gray-600 ml-2">
              Showing {filteredHospitals.length} of {hospitals.length} hospitals
            </span>
          </h2>

          {loading && !hospitals.length ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading hospitals...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredHospitals.length === 0 && hospitals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No hospital accounts created yet.
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Hospital
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredHospitals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No hospitals match your search filters.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div id="hospital-list" className="grid grid-cols-1 gap-4">
              {hospitalsWithPhones.map((hospital) => (
                <Card
                  key={hospital.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6 relative">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 text-[0px]">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {hospital.hospital_name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${hospital.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {hospital.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{hospital.address}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Phone className="w-4 h-4" />
                            {hospital.phoneList &&
                            hospital.phoneList.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {hospital.phoneList.map((n) => (
                                  <span
                                    key={n}
                                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 border"
                                  >
                                    {n}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span>N/A</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap md:flex-nowrap items-center gap-8 mt-4 pt-4 border-t overflow-x-auto">
                          <div className="flex items-center gap-2 flex-none min-w-[160px]">
                            <span className="text-xs text-gray-500">Type:</span>
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {hospital.hospital_type || "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 items-start flex-none min-w-[100px]">
                            <span className="text-xs text-gray-500">Beds</span>
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {hospital.number_of_beds || 0}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 items-start flex-none min-w-[120px]">
                            <span className="text-xs text-gray-500">
                              Ambulances
                            </span>
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {hospital.number_of_ambulances || 0}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 items-start flex-none min-w-[120px]">
                            <span className="text-xs text-gray-500">
                              License/Reg. Number
                            </span>
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {hospital.license_number || "N/A"}
                            </span>
                          </div>
                        </div>

                        {hospital.google_map_enabled &&
                          hospital.google_map_link && (
                            <div className="mt-4 pt-4 border-t">
                              <Button
                                onClick={() =>
                                  window.open(
                                    hospital.google_map_link!,
                                    "_blank",
                                  )
                                }
                                variant="outline"
                                size="sm"
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Show Location
                              </Button>
                            </div>
                          )}
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <p className="text-xs text-gray-500">Admin Email</p>
                        <p className="text-sm font-medium">{hospital.email}</p>
                      </div>

                      <div className="absolute right-4 bottom-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(hospital)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
