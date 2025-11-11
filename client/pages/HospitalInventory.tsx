import { HospitalLayout } from "../components/HospitalLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Package, AlertCircle } from "lucide-react";

export default function HospitalInventory() {
  return (
    <HospitalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">
            Track and manage hospital inventory and supplies
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Hospital Inventory
            </CardTitle>
            <CardDescription>
              Monitor medical supplies and equipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inventory items added yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Inventory management features will be available soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
