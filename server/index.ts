import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleRegister,
  handleLogin,
  handleForgotPassword,
  handleResetPassword,
  authenticateToken,
  handleGetProfile,
  handleChangePassword,
  handleCreateAdminUser,
} from "./routes/auth";
import {
  handleGetCustomers,
  handleGetDoctors,
  handleGetDashboardStats,
} from "./routes/data";
import {
  handleDatabaseDebug,
  handleClearUsers,
  handleCreatePendingTable,
} from "./routes/debug";
import { handleComplaintFeedbackDebug } from "./routes/debug-complaint-feedback";
import { handleDatabaseReset } from "./routes/reset";
import {
  handleCreateAmbulanceRequest,
  handleGetAmbulanceRequests,
  handleUpdateAmbulanceRequest,
  handleGetCustomerAmbulanceRequests,
  handleAssignAmbulanceRequest,
  handleUpdateAmbulanceStatus,
  handleForwardToHospital,
  handleMarkAmbulanceAsRead,
  handleGetHospitalsByState,
  handleHospitalResponse,
  handleGetHospitalForwardedRequests,
} from "./routes/ambulance";
import {
  handleCreateAppointment,
  handleGetAppointments,
  handleUpdateAppointment,
  handleGetCustomerAppointments,
  handleGetAvailableDoctors,
} from "./routes/appointments";
import {
  handleGetPendingRegistrations,
  handleApprovePendingRegistration,
  handleRejectPendingRegistration,
} from "./routes/pending-registrations";
import {
  handleGetAllUsers,
  handleGetUsersByRole,
  handleSuspendUser,
  handleReactivateUser,
  handleDeleteUser,
  handleAddDoctor,
  handleGetAdminUsers,
  handleAdminSetUserPassword,
  handlePromoteToSystemAdmin,
} from "./routes/user-management";
import {
  handleCreateFeedback,
  handleGetAllFeedback,
  handleGetMyFeedback,
  handleUpdateFeedbackStatus,
  handleGetFeedbackStats,
} from "./routes/feedback";
import {
  handleSubmitComplaintFeedback,
  handleGetComplaintFeedback,
  handleGetAllComplaintFeedback,
} from "./routes/complaint-feedback";
import {
  handleGetNotifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
  handleGetCustomerNotifications,
} from "./routes/notifications";
import {
  handleGetStaffAppointments,
  handleGetStaffReports,
  handleGetStaffFeedback,
  handleRespondToFeedback,
  handleGetStaffInventory,
  handleReportLowStock,
} from "./routes/staff";
import { handleCreateTestAmbulanceRequest } from "./routes/create-test-ambulance";
import { handleTestPatientAmbulanceRequests } from "./routes/test-patient-ambulance";
import {
  handleDebugAuth,
  handleDebugPatientAmbulanceWithAuth,
} from "./routes/debug-auth";
import { handleSimpleAmbulanceTest } from "./routes/simple-ambulance-test";
import {
  handleCreateHospital,
  handleHospitalLogin,
  handleGetHospital,
  handleGetAllHospitals,
  handleUpdateHospital,
  handleAdminUpdateHospital,
} from "./routes/hospital";
import {
  handleGetHospitalAmbulances,
  handleCreateHospitalAmbulance,
  handleUpdateHospitalAmbulance,
  handleDeleteHospitalAmbulance,
  handleParkAmbulance,
  handleAssignAmbulanceToRequest,
  handleGetAvailableAmbulances,
} from "./routes/hospital-ambulances";
import { initDatabase } from "./database";
import { initializeAdmin } from "./admin-init";

export async function createServer() {
  const app = express();

  // Initialize database
  try {
    await initDatabase();
    // Initialize default admin user
    await initializeAdmin();
  } catch (error) {
    console.error("Database initialization failed:", error);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/forgot-password", handleForgotPassword);
  app.post("/api/auth/reset-password", handleResetPassword);
  app.get("/api/auth/profile", authenticateToken, handleGetProfile);
  app.post(
    "/api/auth/change-password",
    authenticateToken,
    handleChangePassword,
  );
  app.post("/api/admin/create-admin", authenticateToken, handleCreateAdminUser);

  // Hospital routes
  app.post(
    "/api/admin/hospitals/create",
    authenticateToken,
    handleCreateHospital,
  );
  app.post("/api/hospital/login", handleHospitalLogin);
  app.get("/api/hospital/profile", authenticateToken, handleGetHospital);
  app.get("/api/admin/hospitals", authenticateToken, handleGetAllHospitals);
  app.put("/api/hospital/update", authenticateToken, handleUpdateHospital);
  app.put(
    "/api/admin/hospitals/:id",
    authenticateToken,
    handleAdminUpdateHospital,
  );

  // Hospital Ambulances routes
  app.get(
    "/api/hospital/ambulances",
    authenticateToken,
    handleGetHospitalAmbulances,
  );
  app.post(
    "/api/hospital/ambulances",
    authenticateToken,
    handleCreateHospitalAmbulance,
  );
  app.put(
    "/api/hospital/ambulances/:ambulanceId",
    authenticateToken,
    handleUpdateHospitalAmbulance,
  );
  app.delete(
    "/api/hospital/ambulances/:ambulanceId",
    authenticateToken,
    handleDeleteHospitalAmbulance,
  );
  app.post(
    "/api/hospital/ambulances/:ambulanceId/park",
    authenticateToken,
    handleParkAmbulance,
  );
  app.post(
    "/api/hospital/ambulances/:ambulanceId/assign/:requestId",
    authenticateToken,
    handleAssignAmbulanceToRequest,
  );
  app.get(
    "/api/hospital/ambulances/available",
    authenticateToken,
    handleGetAvailableAmbulances,
  );

  // Data routes (protected)
  app.get("/api/customers", authenticateToken, handleGetCustomers);
  app.get("/api/doctors", authenticateToken, handleGetDoctors);
  app.get("/api/dashboard/stats", authenticateToken, handleGetDashboardStats);

  // Ambulance routes (staff + admin for viewing, customers for creating)
  app.post("/api/ambulance", authenticateToken, handleCreateAmbulanceRequest);
  app.get("/api/ambulance", authenticateToken, handleGetAmbulanceRequests);
  app.get(
    "/api/ambulance/customer",
    authenticateToken,
    handleGetCustomerAmbulanceRequests,
  );
  app.post(
    "/api/ambulance/:requestId/assign",
    authenticateToken,
    handleAssignAmbulanceRequest,
  );
  app.put(
    "/api/ambulance/:requestId/status",
    authenticateToken,
    handleUpdateAmbulanceStatus,
  );
  app.put(
    "/api/ambulance/requests/:requestId",
    authenticateToken,
    handleUpdateAmbulanceRequest,
  );
  // Hospital forwarding routes
  app.post(
    "/api/ambulance/:requestId/forward-to-hospital",
    authenticateToken,
    handleForwardToHospital,
  );
  app.post(
    "/api/ambulance/:requestId/mark-read",
    authenticateToken,
    handleMarkAmbulanceAsRead,
  );
  app.get(
    "/api/hospitals/by-state/:state",
    authenticateToken,
    handleGetHospitalsByState,
  );
  app.post(
    "/api/ambulance/:requestId/hospital-response",
    authenticateToken,
    handleHospitalResponse,
  );
  app.get(
    "/api/ambulance/hospital/forwarded-requests",
    authenticateToken,
    handleGetHospitalForwardedRequests,
  );

  // Appointment routes (doctors + admin for viewing, customers for creating)
  app.post("/api/appointments", authenticateToken, handleCreateAppointment);
  app.get("/api/appointments", authenticateToken, handleGetAppointments);
  app.put(
    "/api/appointments/:appointmentId",
    authenticateToken,
    handleUpdateAppointment,
  );
  app.get(
    "/api/appointments/my-appointments",
    authenticateToken,
    handleGetCustomerAppointments,
  );
  app.get("/api/doctors/available", handleGetAvailableDoctors);

  // Pending registrations (admin only)
  app.get(
    "/api/admin/pending-registrations",
    authenticateToken,
    handleGetPendingRegistrations,
  );
  app.post(
    "/api/admin/pending-registrations/:registrationId/approve",
    authenticateToken,
    handleApprovePendingRegistration,
  );
  app.post(
    "/api/admin/pending-registrations/:registrationId/reject",
    authenticateToken,
    handleRejectPendingRegistration,
  );

  // User management (admin only)
  app.get("/api/admin/users", authenticateToken, handleGetAllUsers);
  app.get(
    "/api/admin/users/:userRole",
    authenticateToken,
    handleGetUsersByRole,
  );
  // Admin management specific
  app.get("/api/admin/admin-users", authenticateToken, handleGetAdminUsers);
  app.post(
    "/api/admin/promote-to-system",
    authenticateToken,
    handlePromoteToSystemAdmin,
  );
  app.post(
    "/api/admin/users/:userId/set-password",
    authenticateToken,
    handleAdminSetUserPassword,
  );
  app.post(
    "/api/admin/users/:userId/suspend",
    authenticateToken,
    handleSuspendUser,
  );
  app.post(
    "/api/admin/users/:userId/reactivate",
    authenticateToken,
    handleReactivateUser,
  );
  app.delete("/api/admin/users/:userId", authenticateToken, handleDeleteUser);
  app.post("/api/admin/add-doctor", authenticateToken, handleAddDoctor);

  // Feedback/Complaints routes
  app.post("/api/feedback", authenticateToken, handleCreateFeedback);
  app.get("/api/feedback/my", authenticateToken, handleGetMyFeedback);
  app.get("/api/admin/feedback", authenticateToken, handleGetAllFeedback);
  app.put(
    "/api/admin/feedback/:feedbackId/status",
    authenticateToken,
    handleUpdateFeedbackStatus,
  );
  app.get(
    "/api/admin/feedback/stats",
    authenticateToken,
    handleGetFeedbackStats,
  );

  // Complaint Feedback routes (customer feedback on closed complaints)
  app.post(
    "/api/complaint/:complaintId/feedback",
    authenticateToken,
    handleSubmitComplaintFeedback,
  );
  app.get(
    "/api/complaint/:complaintId/feedback",
    authenticateToken,
    handleGetComplaintFeedback,
  );
  app.get(
    "/api/admin/complaint-feedback",
    authenticateToken,
    handleGetAllComplaintFeedback,
  );

  // Notifications routes
  app.get("/api/notifications", authenticateToken, handleGetNotifications);
  app.get(
    "/api/notifications/customer",
    authenticateToken,
    handleGetCustomerNotifications,
  );
  app.post(
    "/api/notifications/:notificationId/read",
    authenticateToken,
    handleMarkNotificationRead,
  );
  app.post(
    "/api/notifications/mark-all-read",
    authenticateToken,
    handleMarkAllNotificationsRead,
  );

  // Staff-specific routes
  app.get(
    "/api/staff/appointments",
    authenticateToken,
    handleGetStaffAppointments,
  );
  app.get("/api/staff/reports", authenticateToken, handleGetStaffReports);
  app.get("/api/staff/feedback", authenticateToken, handleGetStaffFeedback);
  app.post(
    "/api/staff/feedback/:feedbackId/respond",
    authenticateToken,
    handleRespondToFeedback,
  );
  app.get("/api/staff/inventory", authenticateToken, handleGetStaffInventory);
  app.post(
    "/api/staff/inventory/:itemId/report-low",
    authenticateToken,
    handleReportLowStock,
  );

  // Debug routes (for development only)
  app.get("/api/debug/database", handleDatabaseDebug);
  app.get("/api/debug/complaint-feedback", handleComplaintFeedbackDebug);
  app.delete("/api/debug/clear-users", handleClearUsers);
  app.post("/api/debug/reset-database", handleDatabaseReset);
  app.post("/api/debug/create-pending-table", handleCreatePendingTable);
  app.post(
    "/api/debug/create-test-ambulance",
    handleCreateTestAmbulanceRequest,
  );
  app.get(
    "/api/debug/test-customer-ambulance",
    handleTestPatientAmbulanceRequests,
  );
  app.get("/api/debug/auth", authenticateToken, handleDebugAuth);
  app.get(
    "/api/debug/customer-ambulance-with-auth",
    authenticateToken,
    handleDebugPatientAmbulanceWithAuth,
  );
  app.get("/api/debug/simple-ambulance-test", handleSimpleAmbulanceTest);

  return app;
}
