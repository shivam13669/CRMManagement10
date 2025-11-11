import { RequestHandler } from "express";
import { db, parseAddressForStateDistrict } from "../database";

export interface AmbulanceRequest {
  id?: number;
  customer_user_id: number;
  pickup_address: string;
  destination_address: string;
  emergency_type: string;
  customer_condition?: string;
  contact_number: string;
  status?: string;
  priority?: string;
  assigned_staff_id?: number;
  notes?: string;
  created_at?: string;
}

// Create ambulance request (for customers)
export const handleCreateAmbulanceRequest: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { userId, role } = (req as any).user;

    if (role !== "customer") {
      return res
        .status(403)
        .json({ error: "Only customers can request ambulance services" });
    }

    const {
      pickup_address,
      destination_address,
      emergency_type,
      customer_condition,
      contact_number,
      priority = "normal",
    } = req.body;

    if (
      !pickup_address ||
      !destination_address ||
      !emergency_type ||
      !contact_number
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Parse pickup address to extract state/district (if possible)
    const latLngRegex = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;
    let customerState: string | null = null;
    let customerDistrict: string | null = null;

    if (pickup_address && latLngRegex.test(pickup_address)) {
      // If pickup_address is coordinates, reverse geocode using Nominatim
      try {
        const [lat, lng] = pickup_address
          .split(",")
          .map((v: string) => v.trim());
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          lat,
        )}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Healthcare-App/1.0" },
        });
        if (res.ok) {
          const data = await res.json();
          const display = data.display_name || "";
          const parsed = parseAddressForStateDistrict(display);
          customerState = parsed.state;
          customerDistrict = parsed.district;
          // Optionally replace pickup_address with readable display name
          // but keep original coords as well; for now we keep original value
        } else {
          console.warn("Reverse geocode failed with status", res.status);
        }
      } catch (err) {
        console.error("Reverse geocode error:", err);
      }
    } else {
      const parsedLocation = parseAddressForStateDistrict(pickup_address || "");
      customerState = parsedLocation.state;
      customerDistrict = parsedLocation.district;
    }

    // Insert ambulance request with extracted state/district
    db.run(
      `
      INSERT INTO ambulance_requests (
        customer_user_id, pickup_address, destination_address, emergency_type,
        customer_condition, contact_number, priority, customer_state, customer_district, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `,
      [
        userId,
        pickup_address,
        destination_address,
        emergency_type,
        customer_condition || null,
        contact_number,
        priority,
        customerState,
        customerDistrict,
      ],
    );

    // Get the created request
    const result = db.exec("SELECT last_insert_rowid() as id");
    const requestId = result[0].values[0][0];

    // Notify relevant admins: system admins (all requests) and state admins for this state
    let adminResult: any;
    if (customerState) {
      adminResult = db.exec(
        `SELECT id FROM users WHERE role = 'admin' AND (admin_type = 'system' OR (admin_type = 'state' AND state = ?))`,
        [customerState],
      );
    } else {
      // If no state could be parsed, notify only system admins
      adminResult = db.exec(
        `SELECT id FROM users WHERE role = 'admin' AND admin_type = 'system'`,
      );
    }

    if (adminResult.length > 0 && adminResult[0].values.length > 0) {
      const adminRows = adminResult[0].values;
      adminRows.forEach((adminRow) => {
        const adminId = adminRow[0];
        db.run(
          `
            INSERT INTO notifications (user_id, type, title, message, related_id, created_at)
            VALUES (?, 'ambulance', 'Ambulance Request', ?, ?, datetime('now'))
          `,
          [
            adminId,
            `Ambulance request received${customerState ? ` - ${customerState}` : ""}`,
            requestId,
          ],
        );
      });
    }

    console.log(
      `🚑 Ambulance request created: ID ${requestId} for user ${userId} (state=${customerState})`,
    );

    res.status(201).json({
      message: "Ambulance request created successfully",
      requestId,
    });
  } catch (error) {
    console.error("Create ambulance request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get ambulance requests (for staff and admin)
export const handleGetAmbulanceRequests: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { unread_only } = req.query;

    if (role !== "staff" && role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only staff and admin can view ambulance requests" });
    }

    let result: any;

    try {
      // Try query including signup lat/lng (newer schema) and new columns
      result = db.exec(`
      SELECT
        ar.id,
        ar.pickup_address,
        ar.destination_address,
        ar.emergency_type,
        ar.customer_condition,
        ar.contact_number,
        ar.status,
        ar.priority,
        ar.notes,
        ar.is_read,
        ar.forwarded_to_hospital_id,
        ar.hospital_response,
        ar.hospital_response_notes,
        ar.hospital_response_date,
        ar.assigned_ambulance_id,
        ar.customer_state,
        ar.customer_district,
        ar.created_at,
        u.full_name as patient_name,
        u.email as patient_email,
        u.phone as patient_phone,
        c.address as customer_signup_address,
        c.signup_lat as customer_signup_lat,
        c.signup_lng as customer_signup_lng,
        staff.full_name as assigned_staff_name,
        staff.phone as assigned_staff_phone,
        h2.hospital_name as forwarded_hospital_name,
        h2.address as forwarded_hospital_address,
        u2.full_name as forwarded_hospital_user_name,
        ha.registration_number as ambulance_registration,
        ha.ambulance_type,
        ha.driver_name as ambulance_driver_name,
        ha.driver_phone as ambulance_driver_phone
      FROM ambulance_requests ar
      JOIN users u ON ar.customer_user_id = u.id
      LEFT JOIN customers c ON u.id = c.user_id
      LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
      LEFT JOIN hospitals h2 ON ar.forwarded_to_hospital_id = h2.user_id
      LEFT JOIN users u2 ON h2.user_id = u2.id
      LEFT JOIN hospital_ambulances ha ON ar.assigned_ambulance_id = ha.id
      ORDER BY ar.created_at DESC
    `);
    } catch (err) {
      console.warn(
        "Ambulance query with new columns failed, falling back to older query",
        err,
      );
      // Fallback to older query if DB doesn't have the new columns
      result = db.exec(`
      SELECT
        ar.id,
        ar.pickup_address,
        ar.destination_address,
        ar.emergency_type,
        ar.customer_condition,
        ar.contact_number,
        ar.status,
        ar.priority,
        ar.notes,
        ar.is_read,
        ar.forwarded_to_hospital_id,
        ar.hospital_response,
        ar.hospital_response_notes,
        ar.hospital_response_date,
        ar.assigned_ambulance_id,
        ar.created_at,
        u.full_name as patient_name,
        u.email as patient_email,
        u.phone as patient_phone,
        c.address as customer_signup_address,
        staff.full_name as assigned_staff_name,
        staff.phone as assigned_staff_phone,
        h2.hospital_name as forwarded_hospital_name,
        h2.address as forwarded_hospital_address,
        u2.full_name as forwarded_hospital_user_name,
        ha.registration_number as ambulance_registration,
        ha.ambulance_type,
        ha.driver_name as ambulance_driver_name,
        ha.driver_phone as ambulance_driver_phone
      FROM ambulance_requests ar
      JOIN users u ON ar.customer_user_id = u.id
      LEFT JOIN customers c ON u.id = c.user_id
      LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
      LEFT JOIN hospitals h2 ON ar.forwarded_to_hospital_id = h2.user_id
      LEFT JOIN users u2 ON h2.user_id = u2.id
      LEFT JOIN hospital_ambulances ha ON ar.assigned_ambulance_id = ha.id
      ORDER BY ar.created_at DESC
    `);
    }

    let requests = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      requests = rows.map((row) => {
        const request: any = {};
        columns.forEach((col, index) => {
          request[col] = row[index];
        });
        return request;
      });

      // Filter by unread if requested
      if (unread_only === "true") {
        requests = requests.filter((r) => !r.is_read);
      }

      // Sort by priority manually
      const priorityOrder = { critical: 1, high: 2, normal: 3, low: 4 };
      requests.sort((a, b) => {
        const aPriority =
          priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
        const bPriority =
          priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        // Then sort by created_at descending
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }

    res.json({
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error("Get ambulance requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update ambulance request status (for staff and admin)
export const handleUpdateAmbulanceRequest: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;
    const { requestId } = req.params;
    const { status, assigned_staff_id, notes } = req.body;

    if (role !== "staff" && role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only staff and admin can update ambulance requests" });
    }

    // Update the request
    db.run(
      `
      UPDATE ambulance_requests 
      SET status = ?, assigned_staff_id = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [status, assigned_staff_id || null, notes || null, requestId],
    );

    console.log(`🚑 Ambulance request ${requestId} updated by user ${userId}`);

    res.json({ message: "Ambulance request updated successfully" });
  } catch (error) {
    console.error("Update ambulance request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get customer's own ambulance requests
export const handleGetCustomerAmbulanceRequests: RequestHandler = async (
  req,
  res,
) => {
  try {
    console.log("🔍 GET /api/ambulance/customer called");
    console.log("   JWT Data:", (req as any).user);

    const { userId, role } = (req as any).user;

    console.log(`   userId: ${userId}, role: ${role}`);

    if (role !== "customer") {
      console.log(`❌ Access denied: role is ${role}, not customer`);
      return res
        .status(403)
        .json({ error: "Only customers can view their own requests" });
    }

    console.log(
      `🔍 Querying ambulance_requests WHERE customer_user_id = ${userId}`,
    );

    // First get all ambulance requests, then filter in memory
    const allResult = db.exec(`
      SELECT
        ar.id,
        ar.customer_user_id,
        ar.pickup_address,
        ar.destination_address,
        ar.emergency_type,
        ar.customer_condition,
        ar.contact_number,
        ar.status,
        ar.priority,
        ar.assigned_staff_id,
        ar.assigned_ambulance_id,
        ar.notes,
        ar.created_at,
        ar.updated_at,
        ar.hospital_response,
        ar.hospital_response_notes,
        ar.hospital_response_date,
        ar.forwarded_to_hospital_id,
        staff.full_name as assigned_staff_name,
        staff.phone as assigned_staff_phone,
        ha.registration_number as ambulance_registration,
        ha.ambulance_type,
        ha.driver_name as ambulance_driver_name,
        ha.driver_phone as ambulance_driver_phone
      FROM ambulance_requests ar
      LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
      LEFT JOIN hospital_ambulances ha ON ar.assigned_ambulance_id = ha.id
      ORDER BY ar.created_at DESC
    `);

    let requests = [];
    if (allResult.length > 0) {
      const columns = allResult[0].columns;
      const rows = allResult[0].values;

      requests = rows
        .filter((row) => row[1] === userId) // Filter by customer_user_id (column index 1)
        .map((row) => {
          const request: any = {};
          columns.forEach((col, index) => {
            request[col] = row[index];
          });
          return request;
        });
    }

    console.log(
      `✅ Query result: Found ${requests.length} ambulance requests for userId ${userId}`,
    );
    if (requests.length > 0) {
      requests.forEach((req) => {
        console.log(
          `   - Request #${req.id}: ${req.emergency_type} (${req.status})`,
        );
      });
    }

    res.json({
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error("Get customer ambulance requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Assign ambulance request to current staff member
export const handleAssignAmbulanceRequest: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;
    const { requestId } = req.params;

    if (role !== "staff") {
      return res.status(403).json({
        error: "Only staff can assign ambulance requests to themselves",
      });
    }

    // Check if request exists and is pending
    const checkResult = db.exec(
      `
      SELECT id, status, assigned_staff_id
      FROM ambulance_requests
      WHERE id = ?
    `,
      [requestId],
    );

    if (checkResult.length === 0 || checkResult[0].values.length === 0) {
      return res.status(404).json({ error: "Ambulance request not found" });
    }

    const request = checkResult[0].values[0];
    const currentStatus = request[1];
    const currentAssignedStaff = request[2];

    if (currentStatus !== "pending") {
      return res
        .status(400)
        .json({ error: "Request is not in pending status" });
    }

    if (currentAssignedStaff) {
      return res
        .status(400)
        .json({ error: "Request is already assigned to another staff member" });
    }

    // Assign the request to current staff member
    db.run(
      `
      UPDATE ambulance_requests
      SET status = 'assigned', assigned_staff_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [userId, requestId],
    );

    console.log(
      `🚑 Ambulance request ${requestId} assigned to staff ${userId}`,
    );

    res.json({ message: "Ambulance request assigned successfully" });
  } catch (error) {
    console.error("Assign ambulance request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update ambulance request status (for assigned staff)
export const handleUpdateAmbulanceStatus: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { requestId } = req.params;
    const { status, notes } = req.body;

    if (role !== "staff" && role !== "admin") {
      return res.status(403).json({
        error: "Only staff and admin can update ambulance request status",
      });
    }

    // Validate status
    const validStatuses = ["assigned", "on_the_way", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status provided" });
    }

    // Check if request exists and is assigned to this staff member (if staff)
    if (role === "staff") {
      const checkResult = db.exec(
        `
        SELECT assigned_staff_id
        FROM ambulance_requests
        WHERE id = ?
      `,
        [requestId],
      );

      if (checkResult.length === 0 || checkResult[0].values.length === 0) {
        return res.status(404).json({ error: "Ambulance request not found" });
      }

      const assignedStaffId = checkResult[0].values[0][0];
      if (assignedStaffId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only update requests assigned to you" });
      }
    }

    // Update the request status and notes
    db.run(
      `
      UPDATE ambulance_requests
      SET status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [status, notes || null, requestId],
    );

    console.log(
      `🚑 Ambulance request ${requestId} status updated to ${status} by user ${userId}`,
    );

    res.json({ message: "Ambulance request status updated successfully" });
  } catch (error) {
    console.error("Update ambulance status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forward ambulance request to hospital
export const handleForwardToHospital: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { requestId } = req.params;
    const { hospital_user_id } = req.body;

    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can forward ambulance requests" });
    }

    if (!hospital_user_id) {
      return res.status(400).json({ error: "Hospital user ID is required" });
    }

    // Check if request exists
    const checkResult = db.exec(
      `
      SELECT customer_user_id, customer_state, customer_district
      FROM ambulance_requests
      WHERE id = ?
    `,
      [requestId],
    );

    if (checkResult.length === 0 || checkResult[0].values.length === 0) {
      return res.status(404).json({ error: "Ambulance request not found" });
    }

    const request = checkResult[0].values[0];
    const customerUserId = request[0];

    // Verify hospital exists and get hospital info
    const hospitalResult = db.exec(
      `
      SELECT state, district
      FROM hospitals
      WHERE user_id = ?
    `,
      [hospital_user_id],
    );

    if (hospitalResult.length === 0 || hospitalResult[0].values.length === 0) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    // Forward the request: update forwarded fields first without touching status to avoid CHECK constraint
    try {
      db.run(
        `
        UPDATE ambulance_requests
        SET forwarded_to_hospital_id = ?,
            is_read = 0, hospital_response = 'pending',
            updated_at = datetime('now')
        WHERE id = ?
      `,
        [hospital_user_id, requestId],
      );
    } catch (err) {
      console.error(
        "Failed to update ambulance request forwarded fields:",
        err && err.message,
      );
      return res.status(500).json({ error: "Failed to forward request" });
    }

    // Try to set status to forwarded if schema supports it (best effort)
    try {
      db.run(
        `
        UPDATE ambulance_requests
        SET status = 'forwarded_to_hospital'
        WHERE id = ?
      `,
        [requestId],
      );
    } catch (statusErr) {
      console.warn(
        "Could not set status to forwarded (probably older schema), continuing without changing status:",
        statusErr && statusErr.message,
      );
    }

    // Create notification for hospital
    db.run(
      `
      INSERT INTO notifications (user_id, type, title, message, related_id, created_at)
      VALUES (?, 'ambulance', 'New Ambulance Request', 'An ambulance request has been forwarded to you', ?, datetime('now'))
    `,
      [hospital_user_id, requestId],
    );

    // Create notification for customer
    db.run(
      `
      INSERT INTO notifications (user_id, type, title, message, related_id, created_at)
      VALUES (?, 'ambulance', 'Request Forwarded', 'Your ambulance request has been forwarded to a hospital for processing', ?, datetime('now'))
    `,
      [customerUserId, requestId],
    );

    console.log(
      `🚑 Ambulance request ${requestId} forwarded to hospital ${hospital_user_id} by admin ${userId}`,
    );

    res.json({ message: "Request forwarded to hospital successfully" });
  } catch (error) {
    console.error("Forward ambulance request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark ambulance request as read by admin or hospital
export const handleMarkAmbulanceAsRead: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    const { requestId } = req.params;

    if (role !== "admin" && role !== "hospital") {
      return res
        .status(403)
        .json({ error: "Only admins and hospitals can mark requests as read" });
    }

    db.run(
      `
      UPDATE ambulance_requests
      SET is_read = 1, updated_at = datetime('now')
      WHERE id = ?
    `,
      [requestId],
    );

    res.json({ message: "Request marked as read" });
  } catch (error) {
    console.error("Mark ambulance as read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get hospitals in same state (for dropdown)
export const handleGetHospitalsByState: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    const { state } = req.params;

    if (role !== "admin") {
      return res.status(403).json({ error: "Only admins can view hospitals" });
    }

    if (!state) {
      return res.status(400).json({ error: "State is required" });
    }

    const result = db.exec(
      `
      SELECT h.user_id, u.full_name as hospital_name, h.hospital_name as name,
             h.address, h.state, h.district, h.number_of_ambulances
      FROM hospitals h
      JOIN users u ON h.user_id = u.id
      WHERE h.state = ? AND h.status = 'active'
      ORDER BY h.hospital_name
    `,
      [state],
    );

    let hospitals: any[] = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      hospitals = result[0].values.map((row) => {
        const hospital: any = {};
        columns.forEach((col, index) => {
          hospital[col] = row[index];
        });
        return hospital;
      });
    }

    res.json({ hospitals, total: hospitals.length });
  } catch (error) {
    console.error("Get hospitals by state error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Hospital responds to forwarded request
export const handleHospitalResponse: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { requestId } = req.params;
    const { response, notes } = req.body;

    if (role !== "hospital") {
      return res
        .status(403)
        .json({ error: "Only hospitals can respond to requests" });
    }

    if (!["accepted", "rejected"].includes(response)) {
      return res
        .status(400)
        .json({ error: "Response must be accepted or rejected" });
    }

    // Check if request is forwarded to this hospital and get customer/state info
    const checkResult = db.exec(
      `
      SELECT customer_user_id, customer_state, id
      FROM ambulance_requests
      WHERE id = ? AND forwarded_to_hospital_id = ?
    `,
      [requestId, userId],
    );

    if (checkResult.length === 0 || checkResult[0].values.length === 0) {
      return res.status(404).json({
        error: "Request not found or not forwarded to your hospital",
      });
    }

    const columns = checkResult[0].columns;
    const row = checkResult[0].values[0];
    const customerUserId = row[0];
    const customerState = row[1];

    const newStatus =
      response === "accepted" ? "hospital_accepted" : "hospital_rejected";

    db.run(
      `
      UPDATE ambulance_requests
      SET hospital_response = ?, hospital_response_notes = ?,
          hospital_response_date = datetime('now'), status = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `,
      [response, notes || null, newStatus, requestId],
    );

    // Create notification for customer
    const message =
      response === "accepted"
        ? "Your ambulance request has been accepted by the hospital"
        : "Your ambulance request has been rejected by the hospital";

    db.run(
      `
      INSERT INTO notifications (user_id, type, title, message, related_id, created_at)
      VALUES (?, 'ambulance', 'Hospital Response', ?, ?, datetime('now'))
    `,
      [customerUserId, message, requestId],
    );

    // Get all admin user IDs that should be notified
    // 1. System admin
    // 2. State admin for the customer's state (if applicable)
    const adminResult = db.exec(
      `
      SELECT id, admin_type
      FROM users
      WHERE role = 'admin' AND (
        admin_type = 'system' OR
        (admin_type = 'state' AND state = ?)
      )
    `,
      [customerState],
    );

    // Create notification for all admins
    if (adminResult.length > 0 && adminResult[0].values.length > 0) {
      const adminColumns = adminResult[0].columns;
      const adminRows = adminResult[0].values;

      adminRows.forEach((adminRow) => {
        const admin: any = {};
        adminColumns.forEach((col, index) => {
          admin[col] = adminRow[index];
        });

        const adminMessage =
          response === "accepted"
            ? `Hospital has accepted ambulance request #${requestId}`
            : `Hospital has rejected ambulance request #${requestId}`;

        db.run(
          `
          INSERT INTO notifications (user_id, type, title, message, related_id, created_at)
          VALUES (?, 'ambulance', 'Hospital Response', ?, ?, datetime('now'))
        `,
          [admin.id, adminMessage, requestId],
        );
      });
    }

    console.log(
      `🏥 Hospital ${userId} responded ${response} to ambulance request ${requestId}`,
    );

    res.json({ message: `Request ${response} successfully` });
  } catch (error) {
    console.error("Hospital response error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get forwarded requests for hospital
export const handleGetHospitalForwardedRequests: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "hospital") {
      return res
        .status(403)
        .json({ error: "Only hospitals can view their forwarded requests" });
    }

    const result = db.exec(
      `
      SELECT
        ar.id,
        ar.pickup_address,
        ar.emergency_type,
        ar.customer_condition,
        ar.contact_number,
        ar.status,
        ar.priority,
        ar.hospital_response,
        ar.hospital_response_notes,
        ar.hospital_response_date,
        ar.assigned_ambulance_id,
        ar.created_at,
        ar.updated_at,
        ar.is_read,
        u.full_name as patient_name,
        u.email as patient_email,
        u.phone as patient_phone,
        ha.registration_number as ambulance_registration,
        ha.ambulance_type,
        ha.driver_name as ambulance_driver_name,
        ha.driver_phone as ambulance_driver_phone
      FROM ambulance_requests ar
      JOIN users u ON ar.customer_user_id = u.id
      LEFT JOIN hospital_ambulances ha ON ar.assigned_ambulance_id = ha.id
      WHERE ar.forwarded_to_hospital_id = ?
      ORDER BY ar.created_at DESC
    `,
      [userId],
    );

    let requests: any[] = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      requests = result[0].values.map((row) => {
        const request: any = {};
        columns.forEach((col, index) => {
          request[col] = row[index];
        });
        return request;
      });
    }

    res.json({ requests, total: requests.length });
  } catch (error) {
    console.error("Get hospital forwarded requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
