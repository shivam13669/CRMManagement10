import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Phone,
  Mail,
  Star,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { formatDateTime } from "../lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface Feedback {
  id: number;
  type: "feedback" | "complaint";
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: "pending" | "in_review" | "resolved" | "closed";
  rating?: number;
  patient_name: string;
  patient_email: string;
  patient_phone?: string;
  admin_response?: string;
  admin_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface ComplaintFeedback {
  id: number;
  complaint_id: number;
  rating: number;
  feedback_text?: string;
  patient_name: string;
  complaint_subject: string;
  admin_response: string;
  created_at: string;
}

export default function FeedbackManagement() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feedback' | 'complaint' | 'ratings'>('feedback');
  const [complaintFeedback, setComplaintFeedback] = useState<ComplaintFeedback[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchComplaintFeedback = async () => {
    try {
      setRatingsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/admin/complaint-feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setComplaintFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Error fetching complaint feedback:', error);
    } finally {
      setRatingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ratings') {
      fetchComplaintFeedback();
    }
  }, [activeTab]);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        console.warn('Authentication failed, redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
      } else {
        console.error('Failed to fetch feedback:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: number, status: string, adminResponse: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert("Please log in to update feedback.");
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`/api/admin/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, admin_response: adminResponse })
      });

      if (response.status === 401 || response.status === 403) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        fetchFeedback();
        setSelectedFeedback(null);
        setAdminResponse("");
        setNewStatus("");
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Error updating feedback: ${errorData.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert("Network error. Please check your connection and try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "in_review":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'complaint' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredFeedback = feedback.filter(item => {
    // Filter by tab first
    if (activeTab === 'feedback' && item.type !== 'feedback') return false;
    if (activeTab === 'complaint' && item.type !== 'complaint') return false;

    // Then apply additional filters
    if (filter === "all") return true;
    if (filter === "feedback") return item.type === "feedback";
    if (filter === "complaints") return item.type === "complaint";
    return item.status === filter;
  });

  const stats = {
    total: feedback.length,
    pending: feedback.filter(f => f.status === 'pending').length,
    complaints: feedback.filter(f => f.type === 'complaint').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    closed: feedback.filter(f => f.status === 'closed').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
            <p className="text-gray-600 mt-2">
              Review and respond to patient feedback and complaints
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter feedback" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="feedback">Feedback Only</SelectItem>
                <SelectItem value="complaints">Complaints Only</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchFeedback} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'feedback'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ThumbsUp className="w-4 h-4 inline mr-2" />
            Feedback
          </button>
          <button
            onClick={() => setActiveTab('complaint')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'complaint'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Complaints
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ratings'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Response Ratings
          </button>
        </div>

        {/* Feedback Tab Content */}
        {activeTab === 'feedback' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <ThumbsUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{feedback.filter(f => f.type === 'feedback').length}</div>
                  <div className="text-sm text-gray-600">Total Feedback</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{feedback.filter(f => f.type === 'feedback' && f.status === 'pending').length}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{feedback.filter(f => f.type === 'feedback' && f.status === 'resolved').length}</div>
                  <div className="text-sm text-gray-600">Resolved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{feedback.filter(f => f.type === 'feedback' && f.status === 'in_review').length}</div>
                  <div className="text-sm text-gray-600">In Review</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.closed}</div>
                  <div className="text-sm text-gray-600">Closed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>
              {activeTab === 'feedback'
                ? `Showing ${filteredFeedback.length} of ${feedback.filter(f => f.type === 'feedback').length} feedback items`
                : `Showing ${filteredFeedback.length} of ${feedback.length} items`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFeedback.length > 0 ? (
                filteredFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          {item.rating && item.type === 'feedback' && (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= item.rating!
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-600 ml-1">({item.rating}/5)</span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-2">
                          {item.subject}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{item.patient_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{item.patient_email}</span>
                          </div>
                          {item.patient_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{item.patient_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateTime(item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        {/* Quick Action Buttons */}
                        {item.type === 'complaint' && (
                          <>
                            {item.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateFeedbackStatus(item.id, 'in_review', 'Under review by admin team.')}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                Start Review
                              </Button>
                            )}

                            {(item.status === 'pending' || item.status === 'in_review') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateFeedbackStatus(item.id, 'resolved', 'Complaint has been resolved. Thank you for bringing this to our attention.')}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                Mark Resolved
                              </Button>
                            )}

                            {item.status === 'resolved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateFeedbackStatus(item.id, 'closed', item.admin_response || 'Case closed.')}
                                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                              >
                                Close
                              </Button>
                            )}
                          </>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFeedback(item);
                                setAdminResponse(item.admin_response || "");
                                setNewStatus(item.status);

                                // Auto-mark as 'in_review' if it's currently 'pending'
                                if (item.status === 'pending') {
                                  updateFeedbackStatus(item.id, 'in_review', item.admin_response || 'Item reviewed by admin.');
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Feedback Details</DialogTitle>
                              <DialogDescription>
                                {item.type === 'feedback' ? 'View patient feedback' : 'Review and respond to this complaint'}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="flex gap-2">
                                <Badge className={getTypeColor(item.type)}>
                                  {item.type}
                                </Badge>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                                {item.rating && item.type === 'feedback' && (
                                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= item.rating!
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                    <span className="text-sm text-yellow-800 ml-1">({item.rating}/5)</span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <h3 className="font-medium mb-2">Subject:</h3>
                                <p className="text-gray-700">{item.subject}</p>
                              </div>

                              <div>
                                <h3 className="font-medium mb-2">Description:</h3>
                                <p className="text-gray-700">{item.description}</p>
                              </div>

                              {item.rating && item.type === 'feedback' && (
                                <div>
                                  <h3 className="font-medium mb-2">Patient Rating:</h3>
                                  <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-lg">
                                    <div className="flex space-x-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-5 h-5 ${
                                            star <= item.rating!
                                              ? "text-yellow-400 fill-current"
                                              : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm font-medium text-yellow-800">
                                      {item.rating}/5 - {
                                        item.rating === 1 ? "Poor" :
                                        item.rating === 2 ? "Fair" :
                                        item.rating === 3 ? "Good" :
                                        item.rating === 4 ? "Very Good" : "Excellent"
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div>
                                <h3 className="font-medium mb-2">Patient Information:</h3>
                                <div className="text-sm text-gray-600">
                                  <p>Name: {item.patient_name}</p>
                                  <p>Email: {item.patient_email}</p>
                                  {item.patient_phone && (
                                    <p>Phone: {item.patient_phone}</p>
                                  )}
                                </div>
                              </div>

                              {item.type === 'complaint' && (
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Status:
                                  </label>
                                  <Select defaultValue={item.status} onValueChange={(value) => {
                                    setSelectedFeedback(item);
                                    setNewStatus(value);
                                  }}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in_review">In Review</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {/* Only show admin response options for complaints */}
                              {item.type === 'complaint' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">
                                      Admin Response:
                                    </label>
                                    <Textarea
                                      defaultValue={item.admin_response || ""}
                                      onChange={(e) => {
                                        setSelectedFeedback(item);
                                        setAdminResponse(e.target.value);
                                      }}
                                      placeholder="Enter your response to the patient..."
                                      rows={4}
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={() => {
                                        if (selectedFeedback && selectedFeedback.id === item.id) {
                                          updateFeedbackStatus(item.id, newStatus || item.status, adminResponse || item.admin_response || '');
                                        } else {
                                          updateFeedbackStatus(item.id, item.status, item.admin_response || '');
                                        }
                                      }}
                                      className="flex-1"
                                    >
                                      Update Complaint
                                    </Button>

                                    {/* Quick Close Button */}
                                    {item.status === 'resolved' && (
                                      <Button
                                        onClick={() => updateFeedbackStatus(item.id, 'closed', adminResponse || item.admin_response || 'Case closed.')}
                                        variant="outline"
                                      >
                                        Close Case
                                      </Button>
                                    )}
                                  </div>
                                </>
                              )}

                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No feedback found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}

        {/* Complaint Tab Content */}
        {activeTab === 'complaint' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{feedback.filter(f => f.type === 'complaint' && f.status === 'pending').length}</div>
                      <div className="text-sm text-gray-600">Pending Complaints</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{feedback.filter(f => f.type === 'complaint').length}</div>
                      <div className="text-sm text-gray-600">Total Complaints</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{feedback.filter(f => f.type === 'complaint' && f.status === 'resolved').length}</div>
                      <div className="text-sm text-gray-600">Resolved</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{feedback.filter(f => f.type === 'complaint' && f.status === 'closed').length}</div>
                      <div className="text-sm text-gray-600">Closed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Complaints List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Complaints
                    </CardTitle>
                    <CardDescription>
                      Manage and respond to patient complaints
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.filter(f => f.type === 'complaint').length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                      <p className="text-gray-600">There are no patient complaints at the moment.</p>
                    </div>
                  ) : (
                    feedback.filter(f => f.type === 'complaint').map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </div>

                            <h3 className="font-medium text-gray-900 mb-2">
                              {item.subject}
                            </h3>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {item.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{item.patient_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{item.patient_email}</span>
                              </div>
                              {item.patient_phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{item.patient_phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDateTime(item.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            {/* Quick Action Buttons */}
                            {item.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateFeedbackStatus(item.id, 'in_review', 'Under review by admin team.')}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                Start Review
                              </Button>
                            )}

                            {(item.status === 'pending' || item.status === 'in_review') && (
                              <Button
                                size="sm"
                                onClick={() => updateFeedbackStatus(item.id, 'resolved', 'Complaint has been resolved by our team.')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Mark Resolved
                              </Button>
                            )}

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Auto-mark as 'in_review' if it's currently 'pending'
                                    if (item.status === 'pending') {
                                      updateFeedbackStatus(item.id, 'in_review', item.admin_response || 'Complaint reviewed by admin.');
                                    }
                                  }}
                                >
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Complaint Details</DialogTitle>
                                  <DialogDescription>
                                    Review and manage this complaint
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Subject</h4>
                                    <p className="text-sm text-gray-600">{item.subject}</p>
                                  </div>

                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                                    <p className="text-sm text-gray-600">{item.description}</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-1">Category</h4>
                                      <p className="text-sm text-gray-600">{item.category}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-1">Priority</h4>
                                      <p className="text-sm text-gray-600">{item.priority}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                                      <Badge className={getStatusColor(item.status)}>
                                        {item.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-1">Submitted</h4>
                                      <p className="text-sm text-gray-600">
                                        {formatDateTime(item.created_at)}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Patient Information</h4>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-sm"><strong>Name:</strong> {item.patient_name}</p>
                                      <p className="text-sm"><strong>Email:</strong> {item.patient_email}</p>
                                      {item.patient_phone && (
                                        <p className="text-sm"><strong>Phone:</strong> {item.patient_phone}</p>
                                      )}
                                    </div>
                                  </div>

                                  {item.admin_response && (
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-1">Admin Response</h4>
                                      <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-blue-800">{item.admin_response}</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                          Responded: {formatDateTime(item.updated_at)}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Update Status</h4>
                                    <div className="flex gap-2">
                                      <Select
                                        defaultValue={item.status}
                                        onValueChange={(value) => {
                                          if (value !== item.status) {
                                            updateFeedbackStatus(item.id, value as any, `Status updated to ${value}`);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-48">
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="in_review">In Review</SelectItem>
                                          <SelectItem value="resolved">Resolved</SelectItem>
                                          <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="mt-3">
                                      <Textarea
                                        placeholder="Add response or update message..."
                                        value={selectedFeedback?.id === item.id ? responseMessage : ''}
                                        onChange={(e) => {
                                          setResponseMessage(e.target.value);
                                          setSelectedFeedback(item);
                                        }}
                                      />
                                      <Button
                                        className="mt-2"
                                        size="sm"
                                        onClick={() => {
                                          if (responseMessage.trim()) {
                                            updateFeedbackStatus(item.id, item.status, responseMessage);
                                            setResponseMessage('');
                                            setSelectedFeedback(null);
                                          }
                                        }}
                                      >
                                        Send Response
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Response Ratings Tab Content */}
        {activeTab === 'ratings' && (
          <div className="space-y-6">
            {ratingsLoading ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Ratings Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{complaintFeedback.length}</div>
                          <div className="text-sm text-gray-600">Total Ratings</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {complaintFeedback.length > 0
                              ? (complaintFeedback.reduce((sum, item) => sum + item.rating, 0) / complaintFeedback.length).toFixed(1)
                              : "0"
                            }
                          </div>
                          <div className="text-sm text-gray-600">Average Rating</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                          <ThumbsUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {complaintFeedback.filter(f => f.rating >= 4).length}
                          </div>
                          <div className="text-sm text-gray-600">Positive (4-5★)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {complaintFeedback.length > 0
                              ? Math.round((complaintFeedback.filter(f => f.rating >= 4).length / complaintFeedback.length) * 100)
                              : 0
                            }%
                          </div>
                          <div className="text-sm text-gray-600">Satisfaction</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Ratings List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ratings on Resolved Complaints</CardTitle>
                    <CardDescription>
                      How patients rated our response to their closed complaints
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complaintFeedback.length > 0 ? (
                        complaintFeedback.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 border border-gray-200 rounded-lg"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    Response Rating
                                  </Badge>
                                  <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= item.rating
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">
                                    {item.rating}/5
                                  </span>
                                </div>

                                <h3 className="font-medium text-gray-900 mb-2">
                                  Complaint: {item.complaint_subject}
                                </h3>

                                {item.feedback_text && (
                                  <p className="text-sm text-gray-600 mb-3">
                                    "{item.feedback_text}"
                                  </p>
                                )}

                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">Our Response:</h4>
                                  <p className="text-sm text-gray-700">{item.admin_response}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>{item.patient_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDateTime(item.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No ratings received yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
