import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Calendar,
  Truck,
  MessageSquare,
  FileText,
  CreditCard,
  User,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";

interface CustomerLayoutProps {
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
  { icon: Activity, label: "Dashboard", path: "/customer-dashboard" },
  { icon: Calendar, label: "Book Appointment", path: "/book-appointment" },
  { icon: Truck, label: "Ambulance Service", path: "/request-ambulance" },
  {
    icon: Truck,
    label: "My Ambulance Requests",
    path: "/my-ambulance-requests",
  },
  {
    icon: Truck,
    label: "Track Request",
    path: "/track-request",
  },
  { icon: MessageSquare, label: "Feedback & Complaints", path: "/feedback" },
  { icon: FileText, label: "Medical Reports", path: "/medical-reports" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: User, label: "Profile", path: "/customer-profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const userName = localStorage.getItem("userName") || "Customer";

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/notifications/customer", {
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

  // Fetch notifications on component mount and when notifications panel opens
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh notifications when panel opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "report":
        return <FileText className="w-4 h-4 text-green-600" />;
      case "feedback":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case "ambulance":
        return <Truck className="w-4 h-4 text-orange-600" />;
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
        case "appointment":
          window.location.href = "/book-appointment";
          break;
        case "report":
          window.location.href = "/medical-reports";
          break;
        case "feedback":
          window.location.href = "/feedback";
          break;
        case "ambulance":
          window.location.href = "/my-ambulance-requests";
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

        <div className="p-4 border-b border-gray-200 bg-primary/5 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{userName}</div>
              <div className="text-sm text-primary">Customer</div>
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
                  placeholder="Search appointments, reports..."
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
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                      {unreadCount > 9 ? "9+" : unreadCount}
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
                        {unreadCount > 0 && (
                          <span className="text-sm text-blue-600 font-medium">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p>Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
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
                          ))
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          {unreadCount > 0 && (
                            <button
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              onClick={markAllAsRead}
                            >
                              Mark all as read
                            </button>
                          )}
                          <Link
                            to="/patient-notifications"
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
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
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
                        to="/customer-profile"
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
                        to="/medical-reports"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Medical Records
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
