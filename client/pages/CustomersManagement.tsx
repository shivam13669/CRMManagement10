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
  Heart,
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
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";

interface Customer {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  medical_conditions?: string;
  created_at: string;
}

interface FilterState {
  gender: string;
  bloodGroup: string;
  ageRange: string;
  hasConditions: string;
  registrationPeriod: string;
}

export default function CustomersManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    gender: "all",
    bloodGroup: "all",
    ageRange: "all",
    hasConditions: "all",
    registrationPeriod: "all",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        console.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    // Search filter
    const matchesSearch =
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    // Gender filter
    if (filters.gender !== "all" && customer.gender !== filters.gender) {
      return false;
    }

    // Blood group filter
    if (
      filters.bloodGroup !== "all" &&
      customer.blood_group !== filters.bloodGroup
    ) {
      return false;
    }

    // Age range filter
    if (filters.ageRange !== "all") {
      const age = customer.date_of_birth
        ? calculateAge(customer.date_of_birth)
        : 0;
      switch (filters.ageRange) {
        case "0-18":
          if (age > 18) return false;
          break;
        case "19-30":
          if (age < 19 || age > 30) return false;
          break;
        case "31-50":
          if (age < 31 || age > 50) return false;
          break;
        case "51+":
          if (age < 51) return false;
          break;
      }
    }

    // Medical conditions filter
    if (filters.hasConditions !== "all") {
      const hasConditions =
        customer.medical_conditions &&
        customer.medical_conditions.trim() !== "";
      if (filters.hasConditions === "yes" && !hasConditions) return false;
      if (filters.hasConditions === "no" && hasConditions) return false;
    }

    // Registration period filter
    if (filters.registrationPeriod !== "all") {
      const registrationDate = new Date(customer.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - registrationDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (filters.registrationPeriod) {
        case "7days":
          if (diffDays > 7) return false;
          break;
        case "30days":
          if (diffDays > 30) return false;
          break;
        case "90days":
          if (diffDays > 90) return false;
          break;
      }
    }

    return true;
  });

  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case "male":
        return "👨";
      case "female":
        return "👩";
      default:
        return "👤";
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatDate = (date: string) => {
    const newDate = new Date(date);
    return newDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const bloodGroupsInCustomers = Array.from(
    new Set(customers.map((c) => c.blood_group)),
  ).filter(Boolean);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Customer Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and view all registered customers in your healthcare system
            </p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export List
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {customers.length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Total Customers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl text-white">👨</span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {customers.filter((c) => c.gender === "male").length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Male Customers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl text-white">👩</span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {customers.filter((c) => c.gender === "female").length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Female Customers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      customers.filter((c) => {
                        const createdDate = new Date(c.created_at);
                        const now = new Date();
                        return (
                          createdDate.getMonth() === now.getMonth() &&
                          createdDate.getFullYear() === now.getFullYear()
                        );
                      }).length
                    }
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    This Month
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
                    placeholder="Search by name, email, phone, or blood group..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={filters.gender}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            gender: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Blood Group</Label>
                      <Select
                        value={filters.bloodGroup}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            bloodGroup: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Blood Groups</SelectItem>
                          {bloodGroupsInCustomers.map((bg) => (
                            <SelectItem key={bg} value={bg || "unknown"}>
                              {bg || "Unknown"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Age Range</Label>
                      <Select
                        value={filters.ageRange}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            ageRange: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ages</SelectItem>
                          <SelectItem value="0-18">0-18 years</SelectItem>
                          <SelectItem value="19-30">19-30 years</SelectItem>
                          <SelectItem value="31-50">31-50 years</SelectItem>
                          <SelectItem value="51+">51+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Medical Conditions</Label>
                      <Select
                        value={filters.hasConditions}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            hasConditions: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          <SelectItem value="yes">Has Conditions</SelectItem>
                          <SelectItem value="no">No Conditions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customers List</CardTitle>
            <CardDescription>
              Complete list of registered customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length > 0 ? (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.user_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">
                          {getGenderIcon(customer.gender)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.full_name}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.date_of_birth && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Age: {calculateAge(customer.date_of_birth)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {customer.blood_group && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          {customer.blood_group}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        Joined: {formatDate(customer.created_at)}
                      </span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <User className="w-5 h-5" />
                              <span>{selectedCustomer?.full_name}</span>
                            </DialogTitle>
                            <DialogDescription>
                              Complete customer information and medical details
                            </DialogDescription>
                          </DialogHeader>

                          {selectedCustomer && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                              <div>
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-3">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Email
                                      </p>
                                      <p className="font-medium">
                                        {selectedCustomer.email}
                                      </p>
                                    </div>
                                  </div>

                                  {selectedCustomer.phone && (
                                    <div className="flex items-center space-x-3">
                                      <Phone className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Phone
                                        </p>
                                        <p className="font-medium">
                                          {selectedCustomer.phone}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {selectedCustomer.date_of_birth && (
                                    <div className="flex items-center space-x-3">
                                      <Calendar className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Date of Birth
                                        </p>
                                        <p className="font-medium">
                                          {selectedCustomer.date_of_birth}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {selectedCustomer.gender && (
                                    <div className="flex items-center space-x-3">
                                      <User className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Gender
                                        </p>
                                        <p className="font-medium">
                                          {selectedCustomer.gender}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {selectedCustomer.address && (
                                    <div className="flex items-start space-x-3">
                                      <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Address
                                        </p>
                                        <p className="font-medium">
                                          {selectedCustomer.address}
                                        </p>
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            selectedCustomer.address,
                                          )}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                        >
                                          View on Google Maps
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="space-y-3">
                                  {selectedCustomer.blood_group && (
                                    <div className="flex items-center space-x-3">
                                      <Heart className="w-5 h-5 text-red-600" />
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Blood Group
                                        </p>
                                        <p className="font-medium">
                                          {selectedCustomer.blood_group}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {selectedCustomer.medical_conditions && (
                                    <div className="flex items-start space-x-3">
                                      <Activity className="w-5 h-5 text-orange-600 mt-1" />
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Medical Conditions
                                        </p>
                                        <p className="font-medium">
                                          {selectedCustomer.medical_conditions}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-600" />
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Registration Date
                                      </p>
                                      <p className="font-medium">
                                        {formatDate(
                                          selectedCustomer.created_at,
                                        )}
                                      </p>
                                    </div>
                                  </div>
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
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No customers found matching your criteria
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
