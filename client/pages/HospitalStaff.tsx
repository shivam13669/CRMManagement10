import { HospitalLayout } from "../components/HospitalLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Users, AlertCircle } from "lucide-react";

export default function HospitalStaff() {
  return (
    <HospitalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-2">
            Manage hospital staff and departments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Hospital Staff
            </CardTitle>
            <CardDescription>
              View and manage your hospital staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No staff added yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Staff management features will be available soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
