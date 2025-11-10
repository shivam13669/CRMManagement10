import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Truck,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  User,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  FileText,
  BarChart3,
} from "lucide-react";
import { Button } from "./ui/button";

interface StaffLayoutProps {
  children: React.ReactNode;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  relatedId?: number;
  createdAt: string;
}

const sidebarItems = [
  { icon: Activity, label: "Dashboard", path: "/staff-dashboard" },
  {
    icon: Truck,
    label: "Ambulance Management",
    path: "/staff-ambulance-management",
  },
  { icon: Calendar, label: "Appointments", path: "/staff-appointments" },
  { icon: MessageSquare, label: "Service Feedback", path: "/staff-feedback" },
  { icon: FileText, label: "My Reports", path: "/staff-reports" },
  { icon: BarChart3, label: "Inventory", path: "/staff-inventory" },
  { icon: Settings, label: "Settings", path: "/staff-profile" },
];

export function StaffLayout({ children }: StaffLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const userName = localStorage.getItem("userName") || "Staff";

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [feedbackNotificationCount, setFeedbackNotificationCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error("Failed to fetch notifications:", response.status);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Listen for feedback notification updates
  useEffect(() => {
    const handleFeedbackNotifications = (event: CustomEvent) => {
      setFeedbackNotificationCount(event.detail.count);
    };

    const handleStorageUpdate = () => {
      const count = parseInt(
        localStorage.getItem("staffNotificationCount") || "0",
      );
      setFeedbackNotificationCount(count);
    };

    // Listen for custom events from StaffFeedback component
    window.addEventListener(
      "staffNotificationsUpdated",
      handleFeedbackNotifications as EventListener,
    );

    // Listen for storage changes
    window.addEventListener("storage", handleStorageUpdate);

    // Initial load
    handleStorageUpdate();

    return () => {
      window.removeEventListener(
        "staffNotificationsUpdated",
        handleFeedbackNotifications as EventListener,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  // Fetch notifications on component mount and when notifications panel opens
  useEffect(() => {
    fetchNotifications();

    // Initialize feedback notification count
    const count = parseInt(
      localStorage.getItem("staffNotificationCount") || "0",
    );
    setFeedbackNotificationCount(count);
  }, []);

  // Refresh notifications when panel opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ambulance":
        return <Truck className="w-4 h-4 text-red-600" />;
      case "feedback":
        return <MessageSquare className="w-4 h-4 text-orange-600" />;
      case "appointment":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "customer":
        return <Users className="w-4 h-4 text-green-600" />;
      case "inventory":
        return <BarChart3 className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read if it's unread
      if (notification.unread) {
        const token = localStorage.getItem("authToken");
        if (token) {
          await fetch(`/api/notifications/${notification.id}/read`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          // Update local state
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id ? { ...n, unread: false } : n,
            ),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }

      // Navigate to relevant page based on notification type
      setNotificationsOpen(false);

      switch (notification.type) {
        case "ambulance":
          window.location.href = "/staff-ambulance-management";
          break;
        case "feedback":
          window.location.href = "/staff-feedback";
          break;
        case "appointment":
          window.location.href = "/staff-appointments";
          break;
        case "inventory":
          window.location.href = "/staff-inventory";
          break;
        default:
          console.log("Notification clicked:", notification);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update local state to mark all as read
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">
              ML Support
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 border-b border-gray-200 bg-green-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{userName}</div>
              <div className="text-sm text-green-600">Staff Member</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="mt-6">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-100 ${
                    isActive
                      ? "text-primary bg-primary/10 border-r-2 border-primary"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-4"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex-shrink-0">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-4"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Search bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers, requests..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    // Clear feedback notifications when bell is clicked
                    if (!notificationsOpen) {
                      window.dispatchEvent(new CustomEvent("staffBellClicked"));
                    }
                  }}
                >
                  <Bell className="w-5 h-5" />
                  {(unreadCount > 0 || feedbackNotificationCount > 0) && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                      {(() => {
                        const total = unreadCount + feedbackNotificationCount;
                        if (total > 9) return "9+";
                        return total;
                      })()}
                    </span>
                  )}
                </Button>

                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Notifications
                        </h3>
                        {(unreadCount > 0 || feedbackNotificationCount > 0) && (
                          <span className="text-sm text-blue-600 font-medium">
                            {(() => {
                              const total =
                                unreadCount + feedbackNotificationCount;
                              return `${total} new`;
                            })()}
                          </span>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p>Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 &&
                          feedbackNotificationCount === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          <div>
                            {/* Feedback/Complaint Notifications */}
                            {feedbackNotificationCount > 0 && (
                              <div
                                className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors bg-blue-50"
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  window.location.href = "/staff-feedback";
                                }}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <MessageSquare className="w-4 h-4 text-orange-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold text-gray-900 truncate">
                                        New Service Feedback
                                      </p>
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {feedbackNotificationCount > 5
                                        ? "5+"
                                        : feedbackNotificationCount}{" "}
                                      new feedback/complaint
                                      {feedbackNotificationCount > 1
                                        ? "s"
                                        : ""}{" "}
                                      received
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Click to view
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Regular Notifications */}
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  notification.unread ? "bg-blue-50" : ""
                                }`}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p
                                        className={`text-sm font-medium text-gray-900 truncate ${
                                          notification.unread
                                            ? "font-semibold"
                                            : ""
                                        }`}
                                      >
                                        {notification.title}
                                      </p>
                                      {notification.unread && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {notification.time}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          {(unreadCount > 0 ||
                            feedbackNotificationCount > 0) && (
                            <button
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => {
                                markAllAsRead();
                                // Also clear feedback notifications
                                window.dispatchEvent(
                                  new CustomEvent("staffBellClicked"),
                                );
                              }}
                            >
                              Mark all as read
                            </button>
                          )}
                          <Link
                            to="/staff-notifications"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            View all
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {userName}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/staff-profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      <Link
                        to="/feedback"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Help & Support
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
