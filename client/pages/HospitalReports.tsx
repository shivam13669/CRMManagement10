import { HospitalLayout } from "../components/HospitalLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { BarChart3, AlertCircle } from "lucide-react";

export default function HospitalReports() {
  return (
    <HospitalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Reports</h1>
          <p className="text-gray-600 mt-2">
            View and generate hospital operation reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Reports & Analytics
            </CardTitle>
            <CardDescription>
              Monitor hospital performance and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No reports generated yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Report generation features will be available soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
