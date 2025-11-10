import { useState, useEffect } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
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
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

export default function Feedback() {
  const [activeTab, setActiveTab] = useState("feedback");
  const [feedbackForm, setFeedbackForm] = useState({
    type: "",
    rating: 0,
    title: "",
    description: "",
    category: "",
  });
  const [complaintForm, setComplaintForm] = useState({
    type: "",
    priority: "",
    title: "",
    description: "",
    department: "",
  });
  const [myFeedback, setMyFeedback] = useState([]);
  const [complaintFeedbackForm, setComplaintFeedbackForm] = useState({
    rating: 0,
    feedback_text: "",
  });
  const [selectedComplaintForFeedback, setSelectedComplaintForFeedback] =
    useState<any>(null);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<{
    [key: number]: any;
  }>({});

  const feedbackTypes = [
    "General Feedback",
    "Service Quality",
    "Staff Behavior",
    "Facility Cleanliness",
    "Wait Time",
    "Treatment Quality",
  ];
  const complaintTypes = [
    "Service Issue",
    "Billing Problem",
    "Staff Complaint",
    "Facility Issue",
    "Treatment Concern",
    "Other",
  ];
  const departments = [
    "Reception",
    "Nursing",
    "Doctors",
    "Billing",
    "Pharmacy",
    "Laboratory",
    "Emergency",
    "Administration",
  ];

  useEffect(() => {
    fetchMyFeedback();
  }, []);

  useEffect(() => {
    if (myFeedback.length > 0) {
      fetchSubmittedFeedbacks();
    }
  }, [myFeedback]);

  const fetchSubmittedFeedbacks = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // For each complaint, check if feedback was already submitted
      const closedComplaints = myFeedback.filter(
        (item: any) => item.type === "complaint" && item.status === "closed",
      );

      const feedbackPromises = closedComplaints.map(async (item: any) => {
        try {
          const response = await fetch(`/api/complaint/${item.id}/feedback`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.feedback) {
              return { complaintId: item.id, feedback: data.feedback };
            }
          }
        } catch (error) {
          console.error(
            `Error fetching feedback for complaint ${item.id}:`,
            error,
          );
        }
        return null;
      });

      const results = await Promise.all(feedbackPromises);
      const newSubmittedFeedbacks: { [key: number]: any } = {};

      results.forEach((result) => {
        if (result) {
          newSubmittedFeedbacks[result.complaintId] = result.feedback;
        }
      });

      setSubmittedFeedbacks(newSubmittedFeedbacks);
    } catch (error) {
      console.error("Error fetching submitted feedbacks:", error);
    }
  };

  const fetchMyFeedback = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No auth token found, redirecting to login");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/feedback/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        console.warn("Authentication failed, redirecting to login");
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMyFeedback(data.feedback);
      } else {
        console.error(
          "Failed to fetch feedback:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      // Only show error if it's not a network issue due to navigation
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.warn(
          "Network error, likely due to navigation or server unavailable",
        );
      }
    }
  };

  const handleComplaintFeedbackSubmit = async () => {
    if (!selectedComplaintForFeedback || complaintFeedbackForm.rating === 0) {
      alert("Please provide a rating.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Please log in to submit feedback.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `/api/complaint/${selectedComplaintForFeedback.id}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: complaintFeedbackForm.rating,
            feedback_text: complaintFeedbackForm.feedback_text,
          }),
        },
      );

      if (response.ok) {
        const responseData = await response.json();
        alert(
          "Thank you for your feedback! Your rating helps us improve our service.",
        );

        // Add the new feedback to the state immediately
        setSubmittedFeedbacks((prev) => ({
          ...prev,
          [selectedComplaintForFeedback.id]: {
            rating: complaintFeedbackForm.rating,
            feedback_text: complaintFeedbackForm.feedback_text,
            created_at: new Date().toISOString(),
          },
        }));

        setComplaintFeedbackForm({ rating: 0, feedback_text: "" });
        setSelectedComplaintForFeedback(null);

        // Refresh the feedback list to get the latest data
        await fetchSubmittedFeedbacks();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        alert(
          `Error submitting feedback: ${errorData.error || "Please try again."}`,
        );
      }
    } catch (error) {
      console.error("Error submitting complaint feedback:", error);
      alert("Network error. Please check your connection and try again.");
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Please log in to submit feedback.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "feedback",
          subject: feedbackForm.title,
          description: feedbackForm.description,
          category: feedbackForm.type || "other",
          priority: "normal",
          rating: feedbackForm.rating > 0 ? feedbackForm.rating : undefined,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        alert(
          "Thank you for your feedback! We appreciate your input and will use it to improve our services.",
        );
        setFeedbackForm({
          type: "",
          rating: 0,
          title: "",
          description: "",
          category: "",
        });
        fetchMyFeedback(); // Refresh feedback list
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        alert(
          `Error submitting feedback: ${errorData.error || "Please try again."}`,
        );
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Network error. Please check your connection and try again.");
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Please log in to submit a complaint.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "complaint",
          subject: complaintForm.title,
          description: complaintForm.description,
          category: complaintForm.department || "other",
          priority: complaintForm.priority || "normal",
        }),
      });

      if (response.status === 401 || response.status === 403) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        alert(
          "Your complaint has been submitted successfully. We will investigate and respond within 24-48 hours.",
        );
        setComplaintForm({
          type: "",
          priority: "",
          title: "",
          description: "",
          department: "",
        });
        fetchMyFeedback(); // Refresh feedback list
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        alert(
          `Error submitting complaint: ${errorData.error || "Please try again."}`,
        );
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Network error. Please check your connection and try again.");
    }
  };

  const StarRating = ({
    rating,
    onRatingChange,
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
  }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`w-8 h-8 ${star <= rating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition-colors`}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
    );
  };

  // Use real feedback data instead of hardcoded array
  const previousSubmissions = myFeedback;

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "resolved":
        return "Resolved";
      case "in_review":
        return "Under Review";
      case "pending":
        return "Pending";
      case "closed":
        return "Closed";
      default:
        return status;
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Feedback & Complaints
          </h1>
          <p className="text-gray-600 mt-2">
            Share your experience and help us improve our services
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "feedback"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Give Feedback
          </button>
          <button
            onClick={() => setActiveTab("complaint")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "complaint"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            File Complaint
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            History
          </button>
        </div>

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Share Your Feedback</span>
                  </CardTitle>
                  <CardDescription>
                    Help us improve by sharing your experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="feedbackType">Feedback Category</Label>
                      <Select
                        value={feedbackForm.type}
                        onValueChange={(value) =>
                          setFeedbackForm((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select feedback type" />
                        </SelectTrigger>
                        <SelectContent>
                          {feedbackTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Overall Rating</Label>
                      <div className="mt-2">
                        <StarRating
                          rating={feedbackForm.rating}
                          onRatingChange={(rating) =>
                            setFeedbackForm((prev) => ({ ...prev, rating }))
                          }
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          {feedbackForm.rating === 0
                            ? "Please rate your experience"
                            : feedbackForm.rating === 1
                              ? "Poor"
                              : feedbackForm.rating === 2
                                ? "Fair"
                                : feedbackForm.rating === 3
                                  ? "Good"
                                  : feedbackForm.rating === 4
                                    ? "Very Good"
                                    : "Excellent"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="feedbackTitle">Title</Label>
                      <Input
                        id="feedbackTitle"
                        value={feedbackForm.title}
                        onChange={(e) =>
                          setFeedbackForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="mt-1"
                        placeholder="Brief title for your feedback"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="feedbackDescription">Description</Label>
                      <Textarea
                        id="feedbackDescription"
                        value={feedbackForm.description}
                        onChange={(e) =>
                          setFeedbackForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-1"
                        rows={4}
                        placeholder="Please provide detailed feedback..."
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <CheckCircle className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-green-900 mb-2">
                    Why Your Feedback Matters
                  </h3>
                  <ul className="text-sm text-green-800 space-y-2">
                    <li>• Helps us improve our services</li>
                    <li>• Recognizes outstanding staff performance</li>
                    <li>• Enhances patient experience</li>
                    <li>• Guides our quality improvement initiatives</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Complaint Tab */}
        {activeTab === "complaint" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>File a Complaint</span>
                  </CardTitle>
                  <CardDescription>
                    Report any issues or concerns you may have
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleComplaintSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="complaintType">Complaint Type</Label>
                        <Select
                          value={complaintForm.type}
                          onValueChange={(value) =>
                            setComplaintForm((prev) => ({
                              ...prev,
                              type: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {complaintTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={complaintForm.priority}
                          onValueChange={(value) =>
                            setComplaintForm((prev) => ({
                              ...prev,
                              priority: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={complaintForm.department}
                        onValueChange={(value) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            department: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="complaintTitle">Title</Label>
                      <Input
                        id="complaintTitle"
                        value={complaintForm.title}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="mt-1"
                        placeholder="Brief title for your complaint"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="complaintDescription">
                        Detailed Description
                      </Label>
                      <Textarea
                        id="complaintDescription"
                        value={complaintForm.description}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-1"
                        rows={4}
                        placeholder="Please provide detailed information about your complaint..."
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      variant="destructive"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Complaint
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <AlertCircle className="w-8 h-8 text-amber-600 mb-4" />
                  <h3 className="font-semibold text-amber-900 mb-2">
                    Complaint Process
                  </h3>
                  <ul className="text-sm text-amber-800 space-y-2">
                    <li>• We acknowledge all complaints within 24 hours</li>
                    <li>• Investigation begins immediately</li>
                    <li>• Response provided within 48-72 hours</li>
                    <li>• Follow-up to ensure resolution</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Submissions</CardTitle>
              <CardDescription>
                Track your feedback and complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {previousSubmissions.length > 0 ? (
                  previousSubmissions.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.type === "feedback"
                                ? "bg-blue-500"
                                : "bg-orange-500"
                            }`}
                          ></div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.subject}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.type === "feedback"
                                ? "Feedback"
                                : "Complaint"}{" "}
                              • {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}
                          >
                            {getStatusText(item.status)}
                          </span>
                        </div>
                      </div>

                      {/* Show original description */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Description:</strong>
                        </p>
                        <p className="text-sm text-gray-700">
                          {item.description}
                        </p>
                      </div>

                      {/* Show admin response if available */}
                      {item.admin_response && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-900">
                              Admin Response
                            </span>
                            {item.resolved_at && (
                              <span className="text-xs text-blue-600">
                                •{" "}
                                {new Date(
                                  item.resolved_at,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-800">
                            {item.admin_response}
                          </p>
                        </div>
                      )}

                      {/* Show feedback option for closed complaints */}
                      {item.type === "complaint" &&
                        item.status === "closed" && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {submittedFeedbacks[item.id] ? (
                              // Show submitted feedback
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <ThumbsUp className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-900">
                                    Your Feedback
                                  </span>
                                  <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <=
                                          submittedFeedbacks[item.id].rating
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {submittedFeedbacks[item.id].feedback_text && (
                                  <p className="text-sm text-green-800">
                                    {submittedFeedbacks[item.id].feedback_text}
                                  </p>
                                )}
                              </div>
                            ) : (
                              // Show feedback button
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedComplaintForFeedback(item);
                                      setComplaintFeedbackForm({
                                        rating: 0,
                                        feedback_text: "",
                                      });
                                    }}
                                    disabled={submittedFeedbacks[item.id]}
                                  >
                                    <ThumbsUp className="w-4 h-4 mr-2" />
                                    Rate Our Response
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Rate Our Response</DialogTitle>
                                    <DialogDescription>
                                      How satisfied are you with how we handled
                                      your complaint?
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">
                                        Rating
                                      </label>
                                      <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() =>
                                              setComplaintFeedbackForm(
                                                (prev) => ({
                                                  ...prev,
                                                  rating: star,
                                                }),
                                              )
                                            }
                                            className={`w-8 h-8 ${
                                              star <=
                                              complaintFeedbackForm.rating
                                                ? "text-yellow-400"
                                                : "text-gray-300"
                                            } hover:text-yellow-400 transition-colors`}
                                          >
                                            <Star className="w-full h-full fill-current" />
                                          </button>
                                        ))}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {complaintFeedbackForm.rating === 0
                                          ? "Please rate our response"
                                          : complaintFeedbackForm.rating === 1
                                            ? "Very Poor"
                                            : complaintFeedbackForm.rating === 2
                                              ? "Poor"
                                              : complaintFeedbackForm.rating ===
                                                  3
                                                ? "Average"
                                                : complaintFeedbackForm.rating ===
                                                    4
                                                  ? "Good"
                                                  : "Excellent"}
                                      </p>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium mb-2">
                                        Additional Comments (Optional)
                                      </label>
                                      <Textarea
                                        value={
                                          complaintFeedbackForm.feedback_text
                                        }
                                        onChange={(e) =>
                                          setComplaintFeedbackForm((prev) => ({
                                            ...prev,
                                            feedback_text: e.target.value,
                                          }))
                                        }
                                        placeholder="Tell us more about your experience..."
                                        rows={3}
                                      />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        onClick={handleComplaintFeedbackSubmit}
                                        className="flex-1"
                                        disabled={
                                          complaintFeedbackForm.rating === 0
                                        }
                                      >
                                        Submit Feedback
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No feedback submitted yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}
