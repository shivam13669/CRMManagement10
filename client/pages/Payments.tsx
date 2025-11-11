import { useState } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import {
  CreditCard,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function Payments() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const payments = [
    {
      id: "PAY-001",
      date: "2024-12-20",
      description: "Consultation - Dr. Rajesh Sharma",
      amount: 500,
      status: "paid",
      method: "Credit Card",
      receiptUrl: "#",
    },
    {
      id: "PAY-002",
      date: "2024-12-18",
      description: "Blood Test - Lab Services",
      amount: 850,
      status: "paid",
      method: "UPI",
      receiptUrl: "#",
    },
    {
      id: "PAY-003",
      date: "2024-12-15",
      description: "X-Ray Chest - Radiology",
      amount: 1200,
      status: "pending",
      method: "Pending",
      receiptUrl: null,
    },
    {
      id: "PAY-004",
      date: "2024-12-10",
      description: "Pharmacy - Prescription Medicines",
      amount: 320,
      status: "paid",
      method: "Cash",
      receiptUrl: "#",
    },
    {
      id: "PAY-005",
      date: "2024-12-05",
      description: "MRI Brain Scan - Imaging",
      amount: 4500,
      status: "failed",
      method: "Credit Card",
      receiptUrl: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus =
      filterStatus === "all" || payment.status === filterStatus;
    const matchesSearch =
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = payments
    .filter((p) => p.status === "failed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments & Bills</h1>
          <p className="text-gray-600 mt-2">
            Manage your medical payments and view transaction history
          </p>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{totalPaid.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pending</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    ₹{totalPending.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Failed</div>
                  <div className="text-2xl font-bold text-red-600">
                    ₹{totalFailed.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{(totalPaid + totalPending + totalFailed).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by transaction ID or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              View all your medical payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {payment.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.id} •{" "}
                        {new Date(payment.date).toLocaleDateString()} •{" "}
                        {payment.method}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ₹{payment.amount.toLocaleString()}
                      </div>
                      <div
                        className={`flex items-center space-x-1 text-sm ${
                          payment.status === "paid"
                            ? "text-green-600"
                            : payment.status === "pending"
                              ? "text-yellow-600"
                              : payment.status === "failed"
                                ? "text-red-600"
                                : "text-gray-600"
                        }`}
                      >
                        {getStatusIcon(payment.status)}
                        <span className="capitalize">{payment.status}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {payment.status === "pending" && (
                        <Button size="sm" variant="default">
                          Pay Now
                        </Button>
                      )}
                      {payment.status === "failed" && (
                        <Button size="sm" variant="outline">
                          Retry Payment
                        </Button>
                      )}
                      {payment.receiptUrl && (
                        <>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Receipt
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No payments found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Your payment transactions will appear here"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Accepted payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Credit/Debit Cards</div>
                  <div className="text-sm text-gray-600">
                    Visa, MasterCard, RuPay
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">UPI</span>
                </div>
                <div>
                  <div className="font-medium">UPI Payments</div>
                  <div className="text-sm text-gray-600">
                    GPay, PhonePe, Paytm, BHIM
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium">Cash Payment</div>
                  <div className="text-sm text-gray-600">
                    Pay at hospital counter
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Payment Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-blue-800 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>
                  All payments are processed through secure, encrypted channels
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>We never store your card details on our servers</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>PCI DSS compliant payment processing</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>24/7 fraud monitoring and protection</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
}
