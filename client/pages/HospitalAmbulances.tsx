import { HospitalLayout } from "../components/HospitalLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Truck, AlertCircle } from "lucide-react";

export default function HospitalAmbulances() {
  return (
    <HospitalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ambulance Management</h1>
          <p className="text-gray-600 mt-2">
            Manage ambulances and view service requests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Ambulance Fleet
            </CardTitle>
            <CardDescription>
              Monitor your ambulances and emergency requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No ambulances added yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Ambulance management will be available soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
