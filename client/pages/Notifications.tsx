import { useState, useEffect } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

interface Notification {
  id: number;
  type: "feedback_reply" | "appointment" | "general";
  title: string;
  message: string;
  admin_response?: string;
  status?: string;
  created_at: string;
  read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Get feedback with admin responses
      const feedbackResponse = await fetch("/api/feedback/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        const feedbackNotifications = feedbackData.feedback
          .filter(
            (item: any) =>
              item.admin_response && item.admin_response.trim() !== "",
          )
          .map((item: any) => ({
            id: item.id,
            type: "feedback_reply",
            title: `Reply to your ${item.type}: ${item.subject}`,
            message: item.admin_response,
            status: item.status,
            created_at: item.updated_at || item.created_at,
            read: false,
          }));

        setNotifications(feedbackNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "feedback_reply":
        return MessageSquare;
      case "appointment":
        return Calendar;
      default:
        return Bell;
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

  const markAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    );
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              Stay updated with replies and important updates
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              {notifications.filter((n) => !n.read).length} unread
            </Badge>
            <Button onClick={fetchNotifications} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {notifications.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Notifications
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {
                      notifications.filter((n) => n.type === "feedback_reply")
                        .length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Feedback Replies</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {notifications.filter((n) => !n.read).length}
                  </div>
                  <div className="text-sm text-gray-600">Unread</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              Recent updates and replies from our team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-sm ${
                        !notification.read
                          ? "border-blue-200 bg-blue-50/50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            !notification.read ? "bg-blue-500" : "bg-gray-400"
                          }`}
                        >
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3
                              className={`font-medium ${
                                !notification.read
                                  ? "text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {notification.status && (
                              <Badge
                                className={getStatusColor(notification.status)}
                              >
                                {notification.status}
                              </Badge>
                            )}
                            {!notification.read && (
                              <Badge variant="default" className="bg-blue-500">
                                New
                              </Badge>
                            )}
                          </div>

                          <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(
                                  notification.created_at,
                                ).toLocaleString()}
                              </span>
                            </div>

                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs"
                              >
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    We'll notify you when there are updates on your feedback or
                    appointments
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
