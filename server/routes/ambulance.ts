import { RequestHandler } from "express";
import { db } from "../database";

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

    // Insert ambulance request
    db.run(
      `
      INSERT INTO ambulance_requests (
        customer_user_id, pickup_address, destination_address, emergency_type,
        customer_condition, contact_number, priority, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `,
      [
        userId,
        pickup_address,
        destination_address,
        emergency_type,
        customer_condition || null,
        contact_number,
        priority,
      ],
    );

    // Get the created request
    const result = db.exec("SELECT last_insert_rowid() as id");
    const requestId = result[0].values[0][0];

    console.log(
      `🚑 Ambulance request created: ID ${requestId} for user ${userId}`,
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
        staff.phone as assigned_staff_phone
      FROM ambulance_requests ar
      JOIN users u ON ar.customer_user_id = u.id
      LEFT JOIN customers c ON u.id = c.user_id
      LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
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
        ar.created_at,
        u.full_name as patient_name,
        u.email as patient_email,
        u.phone as patient_phone,
        c.address as customer_signup_address,
        staff.full_name as assigned_staff_name,
        staff.phone as assigned_staff_phone
      FROM ambulance_requests ar
      JOIN users u ON ar.customer_user_id = u.id
      LEFT JOIN customers c ON u.id = c.user_id
      LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
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
        ar.notes,
        ar.created_at,
        ar.updated_at,
        staff.full_name as assigned_staff_name,
        staff.phone as assigned_staff_phone
      FROM ambulance_requests ar
      LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
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

    // Forward the request
    db.run(
      `
      UPDATE ambulance_requests
      SET forwarded_to_hospital_id = ?, status = 'forwarded_to_hospital',
          is_read = 0, hospital_response = 'pending',
          updated_at = datetime('now')
      WHERE id = ?
    `,
      [hospital_user_id, requestId],
    );

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

// Mark ambulance request as read by admin
export const handleMarkAmbulanceAsRead: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    const { requestId } = req.params;

    if (role !== "admin") {
      return res.status(403).json({ error: "Only admins can mark requests" });
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

    // Check if request is forwarded to this hospital
    const checkResult = db.exec(
      `
      SELECT customer_user_id, id
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

    const customerUserId = checkResult[0].values[0][0];

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

    // Create notification for admin
    db.run(
      `
      INSERT INTO notifications (user_id, type, title, message, related_id, created_at)
      VALUES (?, 'ambulance', 'Hospital Response', 'Hospital has responded to ambulance request', ?, datetime('now'))
    `,
      [userId, requestId],
    );

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
        ar.created_at,
        ar.updated_at,
        u.full_name as patient_name,
        u.email as patient_email,
        u.phone as patient_phone
      FROM ambulance_requests ar
      JOIN users u ON ar.customer_user_id = u.id
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
