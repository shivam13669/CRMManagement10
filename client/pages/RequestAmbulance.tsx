import { useState, useEffect } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import { Truck, Phone, AlertTriangle, Loader, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  getStoredLocation,
  getLocationWithPermission,
  requestCurrentLocation,
  getLocationPermissionStatus,
  clearLocationPermissionStatus,
} from "../lib/location";

export default function RequestAmbulance() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string>("");
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);
  const [locationRequestAttempt, setLocationRequestAttempt] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      // Fetch user phone
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const response = await fetch("/api/auth/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            // API returns { user: {...} }
            setUserPhone(
              (data &&
                data.user &&
                (data.user.phone ||
                  data.user.mobile ||
                  data.user.contact_number)) ||
                "",
            );
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }

      // Load stored location
      const storedLocation = getStoredLocation();
      if (storedLocation) {
        setUserLocation(storedLocation.address || storedLocation.coordinates);
        return;
      }

      // Check if permission was previously denied
      const permissionStatus = getLocationPermissionStatus();
      if (permissionStatus && !permissionStatus.allowed) {
        setLocationPermissionDenied(true);
      }
    };

    loadUserData();
  }, []);

  const handleAllowLocation = async () => {
    try {
      setLocationRequestAttempt((prev) => prev + 1);

      // Clear stored denied status to allow fresh request
      localStorage.removeItem("locationPermission");

      // Try to request location fresh
      const location = await requestCurrentLocation();
      setUserLocation(location.address || location.coordinates);
      setLocationPermissionDenied(false);
      setShowLocationDialog(false);
      setError(null);
    } catch (error) {
      console.error("Error getting location:", error);

      // If permission was denied by browser
      if (error instanceof GeolocationPositionError && error.code === 1) {
        setError(
          "Location permission was denied by your browser. Please enable location permission in your browser settings for this site and try again.",
        );
      } else {
        setError(
          "Unable to get your location. Please check your browser settings and try again.",
        );
      }

      // Keep the dialog open so user can retry
    }
  };

  const handleRequestAmbulance = async () => {
    setError(null);

    // Check if location is available
    if (!userLocation) {
      // Show location permission dialog to allow retry
      setShowLocationDialog(true);
      if (!error) {
        // Only clear error if we're showing the dialog fresh
      }
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("You must be logged in to request an ambulance");
        setIsLoading(false);
        return;
      }

      if (!userPhone) {
        setError(
          "Could not retrieve your contact number. Please update your profile.",
        );
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/ambulance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emergency_type: "Emergency",
          contact_number: userPhone,
          pickup_address: userLocation,
          destination_address: "Nearest Hospital",
          customer_condition:
            "Emergency ambulance requested - customer requires immediate assistance",
          priority: "high",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create ambulance request",
        );
      }

      const data = await response.json();
      setRequestId(
        data.requestId?.toString() || `AMB-${Date.now().toString().slice(-6)}`,
      );
      setIsSubmitted(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error submitting ambulance request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Ambulance Requested Successfully!
              </h2>
              <p className="text-green-700 mb-6">
                Your emergency ambulance request has been sent to the admin. An
                ambulance will be dispatched shortly.
              </p>

              <div className="bg-white rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="text-sm text-gray-600">Request ID:</span>
                    <div className="font-bold">
                      {requestId
                        ? `AMB-${requestId}`
                        : `AMB-${Date.now().toString().slice(-6)}`}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="font-bold text-blue-600">Pending</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = "/my-ambulance-requests")
                  }
                >
                  View My Requests
                </Button>
                <Button variant="destructive">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Emergency (108)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Emergency Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                Emergency Ambulance Service
              </h1>
              <p className="text-red-700">
                For life-threatening emergencies, call 108 immediately
              </p>
            </div>
            <Button variant="destructive" size="lg" className="ml-auto">
              <Phone className="w-5 h-5 mr-2" />
              Call 108
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Request Emergency Ambulance</CardTitle>
              <CardDescription>
                Click the button below to send an emergency ambulance request to
                the admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Error</h3>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-blue-900">
                    Quick Request Details:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Contact: {userPhone || "Loading..."}</li>
                    <li>
                      • Location: {userLocation || "Using current location"}
                    </li>
                    <li>• Priority: High (Emergency)</li>
                  </ul>
                </div>

                <Button
                  onClick={handleRequestAmbulance}
                  className="w-full"
                  size="lg"
                  variant="destructive"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Truck className="w-5 h-5 mr-2" />
                      Request Ambulance Now
                    </>
                  )}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  Your request will be sent to the admin immediately and an
                  ambulance will be dispatched to your current location.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Emergency Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium">National Emergency</span>
                <span className="font-bold text-red-600">108</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Police</span>
                <span className="font-bold text-blue-600">100</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Fire Brigade</span>
                <span className="font-bold text-orange-600">101</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>While You Wait</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Keep the patient calm and comfortable</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Do not move the patient unless necessary</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Gather important medical documents</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Clear the path for ambulance access</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Permission Dialog */}
        <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <DialogTitle>Location Permission Required</DialogTitle>
              </div>
            </DialogHeader>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <div className="font-medium mb-2">⚠️ Permission Denied</div>
                <div>{error}</div>
                <div className="mt-2 text-xs text-red-700">
                  <strong>How to fix:</strong> Click the lock icon in your
                  browser's address bar and enable location permission for this
                  site.
                </div>
              </div>
            )}

            {!error && (
              <DialogDescription className="space-y-3">
                <div>
                  We need your precise location to send an ambulance to the
                  correct place.
                </div>
                <div className="text-sm text-gray-600">
                  Without location access, emergency services may be delayed.
                  Please allow location permission to continue.
                </div>
              </DialogDescription>
            )}

            <DialogFooter className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLocationDialog(false);
                  setError(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAllowLocation}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {locationRequestAttempt > 0
                  ? "Retry Location"
                  : "Allow Location"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CustomerLayout>
  );
}
