import { RequestHandler } from "express";
import { db } from "../database";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  relatedId?: number;
  createdAt: string;
}

// Get notifications for admin/staff
export const handleGetNotifications: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;

    if (role !== "admin" && role !== "staff") {
      return res
        .status(403)
        .json({ error: "Only admin and staff can view notifications" });
    }

    const notifications: Notification[] = [];

    // Get recent appointments (last 24 hours)
    let appointmentsResult: any = [];
    try {
      appointmentsResult = db.exec(`
        SELECT
          a.id,
          a.created_at,
          a.reason,
          u.full_name as customer_name,
          d.full_name as doctor_name
        FROM appointments a
        JOIN users u ON a.customer_user_id = u.id
        LEFT JOIN users d ON a.doctor_user_id = d.id
        WHERE a.status = 'pending'
        ORDER BY a.created_at DESC
        LIMIT 10
      `);
    } catch (error) {
      console.error("Error fetching appointments for notifications:", error);
      appointmentsResult = [];
    }

    if (appointmentsResult.length > 0) {
      const columns = appointmentsResult[0].columns;
      const rows = appointmentsResult[0].values;

      rows.forEach((row) => {
        const appointment: any = {};
        columns.forEach((col, index) => {
          appointment[col] = row[index];
        });

        const timeAgo = getTimeAgo(appointment.created_at);
        const doctorText = appointment.doctor_name
          ? `with ${appointment.doctor_name}`
          : "needs doctor assignment";

        notifications.push({
          id: `appointment_${appointment.id}`,
          type: "appointment",
          title: "New Appointment Booking",
          message: `${appointment.customer_name} booked an appointment ${doctorText} for ${appointment.reason}`,
          time: timeAgo,
          unread: true,
          relatedId: appointment.id,
          createdAt: appointment.created_at,
        });
      });
    }

    // Get recent pending registrations (last 7 days)
    let registrationsResult: any = [];
    try {
      registrationsResult = db.exec(`
        SELECT
          id,
          full_name,
          role,
          specialization,
          created_at
        FROM pending_registrations
        WHERE status = 'pending'
        ORDER BY created_at DESC
        LIMIT 5
      `);
    } catch (error) {
      console.error(
        "Error fetching pending registrations for notifications:",
        error,
      );
      registrationsResult = [];
    }

    if (registrationsResult.length > 0) {
      const columns = registrationsResult[0].columns;
      const rows = registrationsResult[0].values;

      rows.forEach((row) => {
        const registration: any = {};
        columns.forEach((col, index) => {
          registration[col] = row[index];
        });

        const timeAgo = getTimeAgo(registration.created_at);
        const roleText = registration.role === "doctor" ? "Doctor" : "Staff";
        const specializationText = registration.specialization
          ? ` (${registration.specialization})`
          : "";

        notifications.push({
          id: `registration_${registration.id}`,
          type: "registration",
          title: `${roleText} Registration Pending`,
          message: `${registration.full_name}${specializationText} submitted registration for approval`,
          time: timeAgo,
          unread: true,
          relatedId: registration.id,
          createdAt: registration.created_at,
        });
      });
    }

    // Get recent feedback/complaints (last 48 hours)
    let complaintsResult: any = [];
    try {
      complaintsResult = db.exec(`
        SELECT
          fc.id,
          fc.type,
          fc.subject,
          fc.category,
          fc.priority,
          fc.status,
          fc.created_at,
          u.full_name as customer_name
        FROM feedback_complaints fc
        JOIN users u ON fc.customer_user_id = u.id
        ORDER BY fc.created_at DESC
        LIMIT 10
      `);
    } catch (error) {
      console.error("Error fetching feedback for notifications:", error);
      complaintsResult = [];
    }

    if (complaintsResult.length > 0) {
      const columns = complaintsResult[0].columns;
      const rows = complaintsResult[0].values;

      rows.forEach((row) => {
        const complaint: any = {};
        columns.forEach((col, index) => {
          complaint[col] = row[index];
        });

        const timeAgo = getTimeAgo(complaint.created_at);
        const typeText =
          complaint.type === "complaint" ? "Complaint" : "Feedback";
        const priorityText =
          complaint.priority === "high" || complaint.priority === "urgent"
            ? ` (${complaint.priority} priority)`
            : "";

        notifications.push({
          id: `complaint_${complaint.id}`,
          type: "complaint",
          title: `New Customer ${typeText}`,
          message: `${complaint.customer_name} submitted ${complaint.type} about ${complaint.category}${priorityText}: ${complaint.subject}`,
          time: timeAgo,
          unread: complaint.status === "pending",
          relatedId: complaint.id,
          createdAt: complaint.created_at,
        });
      });
    }

    // Get recent ambulance requests (last 12 hours)
    let ambulanceResult: any = [];
    try {
      ambulanceResult = db.exec(`
        SELECT
          ar.id,
          ar.emergency_type,
          ar.priority,
          ar.status,
          ar.created_at,
          ar.updated_at,
          u.full_name as customer_name
        FROM ambulance_requests ar
        JOIN users u ON ar.customer_user_id = u.id
        ORDER BY COALESCE(ar.updated_at, ar.created_at) DESC
        LIMIT 10
      `);
    } catch (error) {
      console.error(
        "Error fetching ambulance requests for notifications:",
        error,
      );
      ambulanceResult = [];
    }

    if (ambulanceResult.length > 0) {
      const columns = ambulanceResult[0].columns;
      const rows = ambulanceResult[0].values;

      rows.forEach((row) => {
        const ambulance: any = {};
        columns.forEach((col, index) => {
          ambulance[col] = row[index];
        });

        const timeAgo = getTimeAgo(ambulance.created_at);
        const urgencyText =
          ambulance.priority === "critical" || ambulance.priority === "high"
            ? ` (${ambulance.priority} priority)`
            : "";

        notifications.push({
          id: `ambulance_${ambulance.id}`,
          type: "ambulance",
          title: "Emergency Ambulance Request",
          message: `${ambulance.customer_name} requested ambulance for ${ambulance.emergency_type}${urgencyText}`,
          time: timeAgo,
          unread: ambulance.status === "pending",
          relatedId: ambulance.id,
          createdAt: ambulance.created_at,
        });
      });
    }

    // Sort all notifications by creation time (newest first)
    notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Limit to latest 20 notifications
    const limitedNotifications = notifications.slice(0, 20);

    res.json({
      notifications: limitedNotifications,
      total: limitedNotifications.length,
      unreadCount: limitedNotifications.filter((n) => n.unread).length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching notifications" });
  }
};

// Helper function to calculate time ago
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}

// Mark notification as read (optional feature)
export const handleMarkNotificationRead: RequestHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // In a real system, you'd store notification read states in a separate table
    // For now, we'll just return success
    console.log(`Marking notification ${notificationId} as read`);

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark all notifications as read
export const handleMarkAllNotificationsRead: RequestHandler = async (
  req,
  res,
) => {
  try {
    // In a real system, you'd update the notification read states
    console.log("Marking all notifications as read");

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get notifications for customers (focused on their own requests)
export const handleGetCustomerNotifications: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "customer") {
      return res
        .status(403)
        .json({ error: "Only customers can view their notifications" });
    }

    const notifications: Notification[] = [];

    // Get customer's ambulance requests (last 30 days)
    let ambulanceResult: any = [];
    try {
      ambulanceResult = db.exec(
        `
        SELECT
          ar.id,
          ar.emergency_type,
          ar.priority,
          ar.status,
          ar.created_at,
          ar.updated_at,
          staff.full_name as assigned_staff_name
        FROM ambulance_requests ar
        LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
        WHERE ar.customer_user_id = ?
        ORDER BY COALESCE(ar.updated_at, ar.created_at) DESC
        LIMIT 20
      `,
        [userId],
      );
    } catch (error) {
      console.error(
        "Error fetching customer ambulance requests for notifications:",
        error,
      );
      ambulanceResult = [];
    }

    if (ambulanceResult.length > 0) {
      const columns = ambulanceResult[0].columns;
      const rows = ambulanceResult[0].values;

      rows.forEach((row) => {
        const ambulance: any = {};
        columns.forEach((col, index) => {
          ambulance[col] = row[index];
        });

        // Notification for request creation
        const timeAgo = getTimeAgo(ambulance.created_at);
        notifications.push({
          id: `ambulance_created_${ambulance.id}`,
          type: "ambulance",
          title: "Ambulance Request Submitted",
          message: `Your ambulance request for ${ambulance.emergency_type} has been submitted and is being processed.`,
          time: timeAgo,
          unread: true,
          relatedId: ambulance.id,
          createdAt: ambulance.created_at,
        });

        // Notification for status changes (if updated)
        if (
          ambulance.updated_at &&
          ambulance.updated_at !== ambulance.created_at
        ) {
          const updateTimeAgo = getTimeAgo(ambulance.updated_at);
          let statusMessage = "";

          switch (ambulance.status) {
            case "assigned":
              statusMessage = `Your ambulance request has been assigned to ${ambulance.assigned_staff_name || "our staff"}.`;
              break;
            case "on_the_way":
              statusMessage = `The ambulance is on the way to your location. Please be ready.`;
              break;
            case "completed":
              statusMessage = `Your ambulance service has been completed. Thank you for using our services.`;
              break;
            case "cancelled":
              statusMessage = `Your ambulance request has been cancelled.`;
              break;
          }

          if (statusMessage) {
            notifications.push({
              id: `ambulance_status_${ambulance.id}_${ambulance.status}`,
              type: "ambulance",
              title: "Ambulance Status Update",
              message: statusMessage,
              time: updateTimeAgo,
              unread: true,
              relatedId: ambulance.id,
              createdAt: ambulance.updated_at,
            });
          }
        }
      });
    }

    // Get customer's appointments (last 14 days)
    let appointmentsResult: any = [];
    try {
      appointmentsResult = db.exec(
        `
        SELECT
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          a.reason,
          a.created_at,
          a.updated_at,
          doctor.full_name as doctor_name
        FROM appointments a
        LEFT JOIN users doctor ON a.doctor_user_id = doctor.id
        WHERE a.customer_user_id = ?
        ORDER BY a.created_at DESC
        LIMIT 10
      `,
        [userId],
      );
    } catch (error) {
      console.error(
        "Error fetching customer appointments for notifications:",
        error,
      );
      appointmentsResult = [];
    }

    if (appointmentsResult.length > 0) {
      const columns = appointmentsResult[0].columns;
      const rows = appointmentsResult[0].values;

      rows.forEach((row) => {
        const appointment: any = {};
        columns.forEach((col, index) => {
          appointment[col] = row[index];
        });

        const timeAgo = getTimeAgo(appointment.created_at);
        const doctorText = appointment.doctor_name
          ? `with Dr. ${appointment.doctor_name}`
          : "";

        notifications.push({
          id: `appointment_${appointment.id}`,
          type: "appointment",
          title: "Appointment Confirmation",
          message: `Your appointment ${doctorText} for ${appointment.reason} on ${appointment.appointment_date} at ${appointment.appointment_time} is ${appointment.status}.`,
          time: timeAgo,
          unread: true,
          relatedId: appointment.id,
          createdAt: appointment.created_at,
        });
      });
    }

    // Sort all notifications by creation time (newest first)
    notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Limit to latest 20 notifications
    const limitedNotifications = notifications.slice(0, 20);

    res.json({
      notifications: limitedNotifications,
      total: limitedNotifications.length,
      unreadCount: limitedNotifications.filter((n) => n.unread).length,
    });
  } catch (error) {
    console.error("Get customer notifications error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching notifications" });
  }
};
