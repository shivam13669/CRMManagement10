import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { formatDateTime } from "../lib/utils";
import {
  Star,
  MessageSquare,
  User,
  Calendar,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

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

export default function ComplaintFeedbackManagement() {
  const [feedback, setFeedback] = useState<ComplaintFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(
      "🚀 ComplaintFeedbackManagement component mounted, fetching data...",
    );
    fetchComplaintFeedback();
  }, []);

  const fetchComplaintFeedback = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/admin/complaint-feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        window.location.href = "/login";
        return;
      }

      let data: any = {};
      try {
        data = await response.json();
      } catch (e) {
        console.error("❌ Failed to parse response:", e);
        data = { feedback: [] };
      }

      if (response.ok) {
        console.log("🔍 Complaint feedback data received:", data);
        console.log("📊 Feedback array:", data.feedback);
        console.log("📊 Feedback count:", data.feedback?.length);
        setFeedback(data.feedback);
      } else {
        console.error(
          "❌ Failed to fetch complaint feedback:",
          response.status,
          response.statusText,
        );
        console.error(
          "❌ Error details:",
          data.error || data.message || "Unknown error",
        );
      }
    } catch (error) {
      console.error("❌ Error fetching complaint feedback:", error);
      console.error("❌ Error stack:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const averageRating =
    feedback.length > 0
      ? (
          feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
        ).toFixed(1)
      : "0";

  const ratingDistribution = {
    5: feedback.filter((f) => f.rating === 5).length,
    4: feedback.filter((f) => f.rating === 4).length,
    3: feedback.filter((f) => f.rating === 3).length,
    2: feedback.filter((f) => f.rating === 2).length,
    1: feedback.filter((f) => f.rating === 1).length,
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Complaint Response Feedback
          </h1>
          <p className="text-gray-600 mt-2">
            Patient feedback on how well complaints were handled
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {feedback.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Feedback</div>
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
                    {averageRating}
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
                    {ratingDistribution[4] + ratingDistribution[5]}
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
                    {feedback.length > 0
                      ? Math.round(
                          ((ratingDistribution[4] + ratingDistribution[5]) /
                            feedback.length) *
                            100,
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of patient ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${feedback.length > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / feedback.length) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {
                      ratingDistribution[
                        rating as keyof typeof ratingDistribution
                      ]
                    }
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>
              Patient feedback on complaint responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback.length > 0 ? (
                feedback.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Complaint Feedback</Badge>
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
                          <span
                            className={`text-sm font-medium ${getRatingColor(item.rating)}`}
                          >
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
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            Our Response:
                          </h4>
                          <p className="text-sm text-gray-700">
                            {item.admin_response}
                          </p>
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
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No feedback received yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
