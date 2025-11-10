import { useState, useEffect } from "react";
import { StaffLayout } from "../components/StaffLayout";
import {
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Search,
  Filter,
  MessageCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

interface Feedback {
  id: number;
  patient_name: string;
  rating?: number;
  feedback_text?: string;
  subject: string;
  description: string;
  type: 'feedback' | 'complaint';
  category: string;
  priority: string;
  status: string;
  ambulance_request_id?: number;
  created_at: string;
  staff_response?: string;
  response_date?: string;
  admin_response?: string;
}

export default function StaffFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feedback' | 'complaint'>('feedback');
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [responseText, setResponseText] = useState("");
  const [respondingTo, setRespondingTo] = useState<number | null>(null);

  // Notification tracking
  const [lastViewedFeedback, setLastViewedFeedback] = useState<string>(
    localStorage.getItem('lastViewedFeedback') || new Date().toISOString()
  );
  const [lastViewedComplaint, setLastViewedComplaint] = useState<string>(
    localStorage.getItem('lastViewedComplaint') || new Date().toISOString()
  );

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Update global notification count whenever feedbacks change
  useEffect(() => {
    const totalUnread = getTotalUnreadCount();
    localStorage.setItem('staffNotificationCount', totalUnread.toString());

    // Trigger custom event to notify StaffLayout
    window.dispatchEvent(new CustomEvent('staffNotificationsUpdated', {
      detail: { count: totalUnread }
    }));
  }, [feedbacks, lastViewedFeedback, lastViewedComplaint]);

  // Calculate unread counts
  const getUnreadCount = (type: 'feedback' | 'complaint') => {
    const lastViewed = type === 'feedback' ? lastViewedFeedback : lastViewedComplaint;
    const count = feedbacks.filter(item =>
      item.type === type &&
      new Date(item.created_at) > new Date(lastViewed)
    ).length;

    if (count === 0) return null;
    if (count > 5) return '5+';
    return count.toString();
  };

  // Handle tab click to clear notifications
  const handleTabClick = (tabType: 'feedback' | 'complaint') => {
    setActiveTab(tabType);
    const now = new Date().toISOString();

    if (tabType === 'feedback') {
      setLastViewedFeedback(now);
      localStorage.setItem('lastViewedFeedback', now);
    } else {
      setLastViewedComplaint(now);
      localStorage.setItem('lastViewedComplaint', now);
    }
  };

  // Get total unread count for bell notification
  const getTotalUnreadCount = () => {
    const feedbackCount = feedbacks.filter(item =>
      item.type === 'feedback' &&
      new Date(item.created_at) > new Date(lastViewedFeedback)
    ).length;

    const complaintCount = feedbacks.filter(item =>
      item.type === 'complaint' &&
      new Date(item.created_at) > new Date(lastViewedComplaint)
    ).length;

    return feedbackCount + complaintCount;
  };

  // Handle bell click to clear all notifications
  const handleBellClick = () => {
    const now = new Date().toISOString();
    setLastViewedFeedback(now);
    setLastViewedComplaint(now);
    localStorage.setItem('lastViewedFeedback', now);
    localStorage.setItem('lastViewedComplaint', now);
    localStorage.setItem('staffNotificationCount', '0');

    // Trigger custom event to notify StaffLayout
    window.dispatchEvent(new CustomEvent('staffNotificationsUpdated', {
      detail: { count: 0 }
    }));
  };

  // Listen for bell click events from StaffLayout
  useEffect(() => {
    const handleBellClickEvent = () => {
      handleBellClick();
    };

    window.addEventListener('staffBellClicked', handleBellClickEvent);
    return () => window.removeEventListener('staffBellClicked', handleBellClickEvent);
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/feedback', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
      } else {
        console.error('Failed to fetch feedbacks:', response.status);
        setFeedbacks([]);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (feedbackId: number) => {
    if (!responseText.trim()) return;

    try {
      const response = await fetch(`/api/staff/feedback/${feedbackId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response: responseText.trim() })
      });

      if (response.ok) {
        // Update local state
        setFeedbacks(prev => prev.map(feedback => 
          feedback.id === feedbackId 
            ? { 
                ...feedback, 
                staff_response: responseText.trim(),
                response_date: new Date().toISOString(),
                status: 'responded'
              }
            : feedback
        ));
        setResponseText("");
        setRespondingTo(null);
      } else {
        console.error('Failed to submit response:', response.status);
        alert('Failed to submit response. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response. Please try again.');
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "responded":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    // Filter by tab type (feedback or complaint)
    const matchesTab = feedback.type === activeTab;

    // Search in relevant fields
    const searchText = searchTerm.toLowerCase();
    const matchesSearch =
      feedback.patient_name.toLowerCase().includes(searchText) ||
      (feedback.subject && feedback.subject.toLowerCase().includes(searchText)) ||
      (feedback.description && feedback.description.toLowerCase().includes(searchText)) ||
      (feedback.feedback_text && feedback.feedback_text.toLowerCase().includes(searchText));

    const matchesCategory = categoryFilter === "all" || feedback.category === categoryFilter;

    return matchesTab && matchesSearch && matchesCategory;
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

  // Stats for current tab
  const currentTabData = feedbacks.filter(f => f.type === activeTab);
  const stats = {
    total: currentTabData.length,
    pending: currentTabData.filter(f => f.status === 'pending').length,
    responded: currentTabData.filter(f => f.status === 'responded' || f.status === 'resolved' || f.status === 'closed').length,
    averageRating: activeTab === 'feedback' && currentTabData.length > 0
      ? (currentTabData.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / currentTabData.filter(f => f.rating).length).toFixed(1)
      : activeTab === 'complaint' ? "-" : "0"
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Feedback</h1>
            <p className="text-gray-600 mt-2">
              View and respond to feedback about your ambulance services
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabClick('feedback')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Feedback List</span>
                {getUnreadCount('feedback') && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-500 text-white font-medium animate-pulse">
                    {getUnreadCount('feedback')}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => handleTabClick('complaint')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'complaint'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>Complaint List</span>
                {getUnreadCount('complaint') && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-500 text-white font-medium animate-pulse">
                    {getUnreadCount('complaint')}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              <option value="ambulance">Ambulance Service</option>
              <option value="staff">Staff Behavior</option>
              <option value="response_time">Response Time</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Feedback
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Response
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <p className="text-xs text-gray-500 mt-1">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Responded
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.responded}
              </div>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.averageRating}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                {getRatingStars(parseFloat(stats.averageRating))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic List based on active tab */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'feedback' ? 'Feedback List' : 'Complaint List'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'feedback'
                ? 'Positive feedback related to your ambulance service assignments'
                : 'Complaints and issues related to your ambulance service assignments'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFeedbacks.length > 0 ? (
              <div className="space-y-6">
                {filteredFeedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {feedback.patient_name}
                          </div>
                          {feedback.rating ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center space-x-1">
                                {getRatingStars(feedback.rating)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {feedback.rating}/5 stars
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                feedback.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                feedback.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                feedback.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {feedback.priority} priority
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}
                        >
                          {feedback.status}
                        </span>
                        {feedback.ambulance_request_id && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Request #{feedback.ambulance_request_id}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      {feedback.type === 'feedback' ? (
                        <p className="text-gray-700">{feedback.feedback_text || feedback.description}</p>
                      ) : (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{feedback.subject}</h4>
                          <p className="text-gray-700">{feedback.description}</p>
                          {feedback.admin_response && (
                            <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                              <div className="text-sm font-medium text-blue-800 mb-1">Admin Response:</div>
                              <p className="text-sm text-blue-700">{feedback.admin_response}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span className="capitalize">{feedback.category}</span>
                        </div>
                      </div>
                    </div>

                    {feedback.staff_response ? (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-green-800 mb-1">
                              Your Response
                            </div>
                            <p className="text-sm text-green-700">
                              {feedback.staff_response}
                            </p>
                            {feedback.response_date && (
                              <p className="text-xs text-green-600 mt-2">
                                Responded on {new Date(feedback.response_date).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border rounded-lg p-4">
                        {respondingTo === feedback.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Write your response to this feedback..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                              rows={3}
                            />
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => submitResponse(feedback.id)}
                                size="sm"
                                disabled={!responseText.trim()}
                              >
                                Submit Response
                              </Button>
                              <Button
                                onClick={() => {
                                  setRespondingTo(null);
                                  setResponseText("");
                                }}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setRespondingTo(feedback.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Respond to Feedback</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                {activeTab === 'feedback' ? (
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'feedback' ? 'No feedback found' : 'No complaints found'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== "all"
                    ? `No ${activeTab} matches your current filters.`
                    : `No ${activeTab} available for your services yet.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Service Guidelines
                </h4>
                <p className="text-sm text-blue-700">
                  You can view and respond to both feedback and complaints related to ambulance services you handled.
                  Use the tabs above to switch between positive feedback and complaints. Responding professionally
                  helps improve patient satisfaction and shows your commitment to quality service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
