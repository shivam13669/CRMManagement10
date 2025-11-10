import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { 
  Package, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Plus,
  AlertTriangle,
  Calendar,
  Activity,
  TrendingDown,
  TrendingUp,
  PackageX
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
import { Badge } from "../components/ui/badge";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  type: 'medicine' | 'equipment' | 'supplies';
  current_stock: number;
  minimum_stock: number;
  unit: string;
  price: number;
  supplier: string;
  expiry_date?: string;
  batch_number?: string;
  location: string;
  last_updated: string;
}

// Sample inventory data for demonstration
const sampleInventoryData: InventoryItem[] = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    category: "Pain Relief",
    type: "medicine",
    current_stock: 250,
    minimum_stock: 100,
    unit: "tablets",
    price: 2.50,
    supplier: "MedPharma Ltd",
    expiry_date: "2025-12-15",
    batch_number: "PAR2024001",
    location: "Pharmacy - Shelf A1",
    last_updated: "2025-08-19 10:30:00"
  },
  {
    id: 2,
    name: "Digital Thermometer",
    category: "Diagnostic Equipment",
    type: "equipment",
    current_stock: 15,
    minimum_stock: 10,
    unit: "pieces",
    price: 25.00,
    supplier: "MedEquip Solutions",
    location: "Equipment Room - Cabinet 2",
    last_updated: "2025-08-18 14:20:00"
  },
  {
    id: 3,
    name: "Surgical Gloves (Size M)",
    category: "PPE",
    type: "supplies",
    current_stock: 45,
    minimum_stock: 50,
    unit: "boxes",
    price: 12.00,
    supplier: "SafeMed Supplies",
    location: "Storage Room - Shelf B3",
    last_updated: "2025-08-19 09:15:00"
  },
  {
    id: 4,
    name: "Insulin Pen",
    category: "Diabetes Care",
    type: "medicine",
    current_stock: 8,
    minimum_stock: 15,
    unit: "pens",
    price: 45.00,
    supplier: "DiabeteCare Inc",
    expiry_date: "2025-10-30",
    batch_number: "INS2024005",
    location: "Pharmacy - Refrigerator 1",
    last_updated: "2025-08-19 08:45:00"
  },
  {
    id: 5,
    name: "Bandages (Elastic)",
    category: "Wound Care",
    type: "supplies",
    current_stock: 120,
    minimum_stock: 80,
    unit: "rolls",
    price: 3.50,
    supplier: "WoundCare Pro",
    location: "Nursing Station - Drawer 3",
    last_updated: "2025-08-18 16:00:00"
  }
];

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventoryData);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || item.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { status: 'out-of-stock', color: 'bg-red-500 text-white', label: 'Out of Stock' };
    if (current <= minimum) return { status: 'low-stock', color: 'bg-yellow-500 text-white', label: 'Low Stock' };
    return { status: 'in-stock', color: 'bg-green-500 text-white', label: 'In Stock' };
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow;
  };

  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(item => item.current_stock <= item.minimum_stock).length,
    outOfStock: inventory.filter(item => item.current_stock === 0).length,
    expiringSoon: inventory.filter(item => isExpiringSoon(item.expiry_date)).length
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">
              Track medicines, equipment stock levels, expiry dates, and low-stock alerts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.lowStock}</div>
                  <div className="text-sm text-gray-600">Low Stock</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <PackageX className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.outOfStock}</div>
                  <div className="text-sm text-gray-600">Out of Stock</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</div>
                  <div className="text-sm text-gray-600">Expiring Soon</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search inventory by name, category, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterType === "medicine" ? "default" : "outline"}
              onClick={() => setFilterType("medicine")}
              size="sm"
            >
              Medicines
            </Button>
            <Button
              variant={filterType === "equipment" ? "default" : "outline"}
              onClick={() => setFilterType("equipment")}
              size="sm"
            >
              Equipment
            </Button>
            <Button
              variant={filterType === "supplies" ? "default" : "outline"}
              onClick={() => setFilterType("supplies")}
              size="sm"
            >
              Supplies
            </Button>
          </div>
        </div>

        {/* Inventory List */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              {filteredInventory.length === 0 && searchTerm
                ? `No items found matching "${searchTerm}"`
                : `Showing ${filteredInventory.length} of ${inventory.length} items`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No items found' : 'No inventory items'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Try adjusting your search criteria'
                    : 'Inventory items will appear here once they are added'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item.current_stock, item.minimum_stock);
                  const expiringSoon = isExpiringSoon(item.expiry_date);
                  
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.current_stock} {item.unit}</span>
                            <span>•</span>
                            <span>{item.supplier}</span>
                            {item.expiry_date && (
                              <>
                                <span>•</span>
                                <span className={expiringSoon ? 'text-orange-600 font-medium' : ''}>
                                  Exp: {formatDate(item.expiry_date)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {expiringSoon && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        )}
                        
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedItem(item)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Inventory Item Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about {item.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedItem && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Item Name</label>
                                    <p className="text-sm text-gray-900">{selectedItem.name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Category</label>
                                    <p className="text-sm text-gray-900">{selectedItem.category}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Type</label>
                                    <p className="text-sm text-gray-900 capitalize">{selectedItem.type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Current Stock</label>
                                    <p className="text-sm text-gray-900">{selectedItem.current_stock} {selectedItem.unit}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Minimum Stock</label>
                                    <p className="text-sm text-gray-900">{selectedItem.minimum_stock} {selectedItem.unit}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Unit Price</label>
                                    <p className="text-sm text-gray-900">₹{selectedItem.price}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Supplier</label>
                                    <p className="text-sm text-gray-900">{selectedItem.supplier}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Location</label>
                                    <p className="text-sm text-gray-900">{selectedItem.location}</p>
                                  </div>
                                  {selectedItem.expiry_date && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                                      <p className={`text-sm ${isExpiringSoon(selectedItem.expiry_date) ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                                        {formatDate(selectedItem.expiry_date)}
                                      </p>
                                    </div>
                                  )}
                                  {selectedItem.batch_number && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Batch Number</label>
                                      <p className="text-sm text-gray-900">{selectedItem.batch_number}</p>
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <Badge className={getStockStatus(selectedItem.current_stock, selectedItem.minimum_stock).color}>
                                      {getStockStatus(selectedItem.current_stock, selectedItem.minimum_stock).label}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                                    <p className="text-sm text-gray-900">{formatDate(selectedItem.last_updated)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
