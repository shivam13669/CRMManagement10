import { useState } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import { FileText, Download, Eye, Calendar, User, Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function MedicalReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const reports = [
    {
      id: "1",
      title: "Blood Test Report",
      doctor: "Dr. Rajesh Sharma",
      date: "2024-12-20",
      type: "Lab Report",
      status: "completed",
      description: "Complete Blood Count (CBC) with differential",
    },
    {
      id: "2",
      title: "X-Ray Chest",
      doctor: "Dr. Priya Patel",
      date: "2024-12-18",
      type: "Imaging",
      status: "completed",
      description: "Chest X-Ray PA view for respiratory evaluation",
    },
    {
      id: "3",
      title: "Cardiology Consultation",
      doctor: "Dr. Rajesh Sharma",
      date: "2024-12-15",
      type: "Consultation",
      status: "completed",
      description: "Cardiovascular health assessment and recommendations",
    },
    {
      id: "4",
      title: "MRI Brain Scan",
      doctor: "Dr. Amit Singh",
      date: "2024-12-10",
      type: "Imaging",
      status: "pending",
      description: "Brain MRI with contrast for neurological evaluation",
    },
    {
      id: "5",
      title: "Diabetes Management Plan",
      doctor: "Dr. Sunita Verma",
      date: "2024-12-05",
      type: "Treatment Plan",
      status: "completed",
      description: "Comprehensive diabetes management and dietary guidelines",
    },
  ];

  const reportTypes = [
    "all",
    "Lab Report",
    "Imaging",
    "Consultation",
    "Treatment Plan",
    "Prescription",
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Lab Report":
        return "🧪";
      case "Imaging":
        return "🔬";
      case "Consultation":
        return "👨‍⚕️";
      case "Treatment Plan":
        return "📋";
      case "Prescription":
        return "💊";
      default:
        return "📄";
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || report.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
          <p className="text-gray-600 mt-2">
            Access and download your medical records and reports
          </p>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reports, doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Reports" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(report.type)}</span>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {report.type}
                      </CardDescription>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}
                  >
                    {report.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{report.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{report.doctor}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(report.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Your medical reports will appear here once available"}
              </p>
              {!searchTerm && filterType === "all" && (
                <Button>Request Medical Records</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Important Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-blue-800 text-sm">
                <strong>Important:</strong> Medical reports are confidential
                documents. Please do not share your login credentials or
                downloaded reports with unauthorized persons. For any
                discrepancies, contact your healthcare provider immediately.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
