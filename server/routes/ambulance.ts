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
    const { role } = (req as any).user;

    if (role !== "staff" && role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only staff and admin can view ambulance requests" });
    }

    let result: any;

    try {
      // Try query including signup lat/lng (newer schema)
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
        "Ambulance query with signup_lat/signup_lng failed, falling back to older query",
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
