import { useState } from "react";
import { Layout } from "../components/Layout";
import { CustomerLayout } from "../components/CustomerLayout";
import { ChangePassword } from "../components/ChangePassword";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { authUtils } from "../lib/api";
import {
  Settings,
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  Database,
  KeyRound,
  CheckCircle,
} from "lucide-react";

export default function SettingsPage() {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const currentUser = authUtils.getCurrentUser();
  const LayoutComponent =
    currentUser?.role === "customer" ? CustomerLayout : Layout;

  const handlePasswordChangeSuccess = () => {
    setPasswordChanged(true);
    setShowChangePassword(false);
    // Hide success message after 3 seconds
    setTimeout(() => setPasswordChanged(false), 3000);
  };

  const settingsSections = [
    {
      id: "account",
      label: "Account",
      icon: User,
      description: "Manage your account settings and preferences",
    },
    {
      id: "security",
      label: "Security",
      icon: Lock,
      description: "Password and security settings",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Configure your notification preferences",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      description: "Customize the look and feel",
    },
    {
      id: "system",
      label: "System",
      icon: Database,
      description: "System-wide settings and configuration",
    },
  ];

  return (
    <LayoutComponent>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and system preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {currentUser?.role?.toUpperCase() || "USER"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {currentUser?.userName || "User"}
            </Badge>
          </div>
        </div>

        {/* Success message for password change */}
        {passwordChanged && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  Password successfully changed!
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {settingsSections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex items-center gap-2"
              >
                <section.icon className="h-4 w-4" />
                <span className="hidden md:inline">{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  View and manage your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Name
                    </label>
                    <div className="mt-1 text-gray-900">
                      {currentUser?.userName || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Role
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {currentUser?.role?.toUpperCase() || "USER"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="outline" disabled>
                    Edit Profile (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password & Security
                </CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showChangePassword ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <KeyRound className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium">Password</div>
                          <div className="text-sm text-gray-500">
                            Change your account password
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowChangePassword(true)}
                        variant="outline"
                        size="sm"
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ChangePassword
                      onSuccess={handlePasswordChangeSuccess}
                      onCancel={() => setShowChangePassword(false)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-500 text-center py-8">
                    Notification settings will be available in future updates.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-500 text-center py-8">
                    Theme and appearance settings will be available in future
                    updates.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  System-wide settings and configuration options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 text-center py-8">
                  System settings are only available for administrators.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutComponent>
  );
}
