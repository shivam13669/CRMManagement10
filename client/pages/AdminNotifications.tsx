import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Calendar,
  User,
  UserCheck,
  Truck,
  Settings,
  RefreshCw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

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

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read if it's unread
      if (notification.unread) {
        const token = localStorage.getItem('authToken');
        if (token) {
          await fetch(`/api/notifications/${notification.id}/read`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Update local state
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, unread: false } : n)
          );
        }
      }

      // Navigate to relevant page based on notification type
      switch (notification.type) {
        case 'appointment':
          window.location.href = '/appointments';
          break;
        case 'registration':
          window.location.href = '/pending-registrations';
          break;
        case 'complaint':
          window.location.href = '/feedback-management';
          break;
        case 'ambulance':
          window.location.href = '/ambulance';
          break;
        default:
          console.log('Notification clicked:', notification);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'registration': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'complaint': return <MessageSquare className="w-4 h-4 text-red-600" />;
      case 'system': return <Settings className="w-4 h-4 text-gray-600" />;
      case 'ambulance': return <Truck className="w-4 h-4 text-orange-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'appointment': return 'Appointment';
      case 'registration': return 'Registration';
      case 'complaint': return 'Feedback';
      case 'system': return 'System';
      case 'ambulance': return 'Ambulance';
      default: return 'General';
    }
  };

  const filteredNotifications = (type: string) => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              Stay updated with replies and important updates
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              {unreadCount} unread
            </Badge>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} size="sm">
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <div className="text-sm text-gray-600">Total Notifications</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => n.type === 'appointment').length}
                  </div>
                  <div className="text-sm text-gray-600">Appointments</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => n.type === 'complaint').length}
                  </div>
                  <div className="text-sm text-gray-600">Feedback</div>
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
                    {unreadCount}
                  </div>
                  <div className="text-sm text-gray-600">Unread</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="appointment">
              Appointments ({notifications.filter(n => n.type === 'appointment').length})
            </TabsTrigger>
            <TabsTrigger value="registration">
              Registrations ({notifications.filter(n => n.type === 'registration').length})
            </TabsTrigger>
            <TabsTrigger value="complaint">
              Feedback ({notifications.filter(n => n.type === 'complaint').length})
            </TabsTrigger>
            <TabsTrigger value="ambulance">
              Ambulance ({notifications.filter(n => n.type === 'ambulance').length})
            </TabsTrigger>
          </TabsList>

          {['all', 'appointment', 'registration', 'complaint', 'ambulance'].map((tabType) => (
            <TabsContent key={tabType} value={tabType}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tabType === 'all' ? 'All Notifications' : `${getTypeLabel(tabType)} Notifications`}
                  </CardTitle>
                  <CardDescription>
                    {tabType === 'all' 
                      ? 'Recent updates and important alerts' 
                      : `Recent ${getTypeLabel(tabType).toLowerCase()} updates`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredNotifications(tabType).length > 0 ? (
                      filteredNotifications(tabType).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border rounded-lg transition-all hover:shadow-sm cursor-pointer ${
                            notification.unread 
                              ? "border-blue-200 bg-blue-50/50" 
                              : "border-gray-200 bg-white"
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              notification.unread ? "bg-blue-500" : "bg-gray-400"
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className={`font-medium ${
                                  notification.unread ? "text-gray-900" : "text-gray-700"
                                }`}>
                                  {notification.title}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(notification.type)}
                                </Badge>
                                {notification.unread && (
                                  <Badge variant="default" className="bg-blue-500 text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{notification.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          No {tabType === 'all' ? '' : getTypeLabel(tabType).toLowerCase() + ' '}notifications yet
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {tabType === 'all' 
                            ? "You'll be notified when there are important updates"
                            : `You'll be notified about new ${getTypeLabel(tabType).toLowerCase()} activities`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
