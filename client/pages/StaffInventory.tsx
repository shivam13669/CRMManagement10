import { useState, useEffect } from "react";
import { StaffLayout } from "../components/StaffLayout";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Truck,
  Search,
  Filter,
  Heart,
  Stethoscope,
  Zap,
  Thermometer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  current_stock: number;
  min_threshold: number;
  max_capacity: number;
  unit: string;
  location: string;
  last_updated: string;
  status: 'good' | 'low' | 'critical' | 'out_of_stock';
  description?: string;
  expiry_date?: string;
}

export default function StaffInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/inventory', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory || []);
      } else {
        console.error('Failed to fetch inventory:', response.status);
        // Mock data for demonstration
        setInventory([
          {
            id: 1,
            name: "Oxygen Masks",
            category: "respiratory",
            current_stock: 15,
            min_threshold: 10,
            max_capacity: 50,
            unit: "pieces",
            location: "Ambulance A1",
            last_updated: new Date().toISOString(),
            status: 'good',
            description: "Adult oxygen masks for emergency use"
          },
          {
            id: 2,
            name: "Defibrillator Pads",
            category: "cardiac",
            current_stock: 3,
            min_threshold: 5,
            max_capacity: 20,
            unit: "sets",
            location: "Ambulance A1",
            last_updated: new Date().toISOString(),
            status: 'low',
            description: "AED electrode pads"
          },
          {
            id: 3,
            name: "Bandages",
            category: "wound_care",
            current_stock: 2,
            min_threshold: 10,
            max_capacity: 100,
            unit: "rolls",
            location: "Ambulance A2",
            last_updated: new Date().toISOString(),
            status: 'critical',
            description: "Sterile gauze bandages"
          },
          {
            id: 4,
            name: "IV Fluids",
            category: "medication",
            current_stock: 8,
            min_threshold: 5,
            max_capacity: 30,
            unit: "bags",
            location: "Storage Room",
            last_updated: new Date().toISOString(),
            status: 'good',
            description: "Normal saline IV bags",
            expiry_date: "2025-12-31"
          },
          {
            id: 5,
            name: "Disposable Gloves",
            category: "ppe",
            current_stock: 0,
            min_threshold: 50,
            max_capacity: 500,
            unit: "pairs",
            location: "Ambulance A1",
            last_updated: new Date().toISOString(),
            status: 'out_of_stock',
            description: "Latex-free medical gloves"
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const reportLowStock = async (itemId: number) => {
    try {
      const response = await fetch(`/api/staff/inventory/${itemId}/report-low`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Low stock reported successfully. Management has been notified.');
      } else {
        alert('Failed to report low stock. Please try again.');
      }
    } catch (error) {
      console.error('Error reporting low stock:', error);
      alert('Error reporting low stock. Please try again.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cardiac":
        return <Heart className="w-5 h-5 text-red-600" />;
      case "respiratory":
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case "medication":
        return <Thermometer className="w-5 h-5 text-green-600" />;
      case "equipment":
        return <Zap className="w-5 h-5 text-orange-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-100 text-green-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-orange-100 text-orange-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </StaffLayout>
    );
  }

  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(item => item.status === 'low' || item.status === 'critical').length,
    outOfStock: inventory.filter(item => item.status === 'out_of_stock').length,
    goodStock: inventory.filter(item => item.status === 'good').length
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ambulance Inventory</h1>
            <p className="text-gray-600 mt-2">
              View current stock levels of medical supplies and equipment
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Field View</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                <option value="cardiac">Cardiac</option>
                <option value="respiratory">Respiratory</option>
                <option value="medication">Medication</option>
                <option value="wound_care">Wound Care</option>
                <option value="ppe">PPE</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="good">Good Stock</option>
              <option value="low">Low Stock</option>
              <option value="critical">Critical</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Items
              </CardTitle>
              <Package className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">Tracked items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Low Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.lowStock}
              </div>
              <p className="text-xs text-gray-500 mt-1">Need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Out of Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.outOfStock}
              </div>
              <p className="text-xs text-gray-500 mt-1">Urgent attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Good Stock
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.goodStock}
              </div>
              <p className="text-xs text-gray-500 mt-1">Well stocked</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory List */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              Current stock levels in ambulances and storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInventory.length > 0 ? (
              <div className="space-y-4">
                {filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(item.category)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {item.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Current Stock</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            {item.current_stock} {item.unit}
                          </span>
                          <span className="text-sm text-gray-500">
                            / {item.max_capacity} max
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Location</div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.location}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Last Updated</div>
                        <div className="text-sm text-gray-900">
                          {new Date(item.last_updated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Stock Level Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Stock Level</span>
                        <span className="text-gray-900">
                          {getStockPercentage(item.current_stock, item.max_capacity)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.status === 'good' ? 'bg-green-500' :
                            item.status === 'low' ? 'bg-yellow-500' :
                            item.status === 'critical' ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.max(getStockPercentage(item.current_stock, item.max_capacity), 2)}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>Min: {item.min_threshold} {item.unit}</span>
                        <span>Max: {item.max_capacity} {item.unit}</span>
                      </div>
                    </div>

                    {item.expiry_date && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Expires:</span> {new Date(item.expiry_date).toLocaleDateString()}
                      </div>
                    )}

                    {(item.status === 'low' || item.status === 'critical' || item.status === 'out_of_stock') && (
                      <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700">
                            {item.status === 'out_of_stock' 
                              ? 'This item is out of stock and needs immediate restocking.'
                              : 'Stock level is below minimum threshold.'}
                          </span>
                        </div>
                        <Button
                          onClick={() => reportLowStock(item.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Report to Management
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No inventory items found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                    ? "No items match your current filters."
                    : "No inventory items are currently available."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Staff Inventory Access
                </h4>
                <p className="text-sm text-blue-700">
                  As a staff member, you can view current inventory levels for medical supplies and equipment. 
                  You can report low stock items to management for restocking. This view shows items 
                  relevant to ambulance services and emergency response.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
