import { RequestHandler } from "express";
import { db } from "../database";

// Get staff appointments (emergency-related and general appointments)
export const handleGetStaffAppointments: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "staff") {
      return res
        .status(403)
        .json({ error: "Only staff can access this endpoint" });
    }

    // Get appointments that are related to ambulance requests or general appointments
    const result = db.exec(`
      SELECT
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        a.status,
        a.created_at,
        customer.full_name as customer_name,
        customer.phone as customer_phone,
        doctor.full_name as doctor_name,
        ar.id as ambulance_request_id,
        CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as emergency_related
      FROM appointments a
      JOIN users customer ON a.customer_user_id = customer.id
      LEFT JOIN users doctor ON a.doctor_user_id = doctor.id
      LEFT JOIN ambulance_requests ar ON ar.customer_user_id = customer.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    const appointments = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      rows.forEach((row) => {
        const appointment: any = {};
        columns.forEach((col, index) => {
          appointment[col] = row[index];
        });
        appointments.push(appointment);
      });
    }

    res.json({ appointments });
  } catch (error) {
    console.error("Get staff appointments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get staff performance reports
export const handleGetStaffReports: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "staff") {
      return res
        .status(403)
        .json({ error: "Only staff can access this endpoint" });
    }

    const period = parseInt(req.query.period as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Get ambulance requests assigned to this staff member
    const result = db.exec(
      `
      SELECT
        ar.id,
        ar.status,
        ar.created_at,
        ar.updated_at,
        ar.emergency_type,
        ar.pickup_address,
        customer.full_name as customer_name
      FROM ambulance_requests ar
      JOIN users customer ON ar.customer_user_id = customer.id
      WHERE ar.assigned_staff_id = ?
      AND ar.created_at >= datetime('now', '-${period} days')
      ORDER BY ar.created_at DESC
    `,
      [userId],
    );

    const requests = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      rows.forEach((row) => {
        const request: any = {};
        columns.forEach((col, index) => {
          request[col] = row[index];
        });
        requests.push(request);
      });
    }

    // Calculate stats
    const totalAssigned = requests.length;
    const completedRequests = requests.filter(
      (r) => r.status === "completed",
    ).length;
    const monthlyCompletion =
      totalAssigned > 0
        ? Math.round((completedRequests / totalAssigned) * 100)
        : 0;

    // Generate weekly stats (simplified)
    const weeklyStats = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (4 - i) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (3 - i) * 7);

      const weekRequests = requests.filter((r) => {
        const requestDate = new Date(r.created_at);
        return requestDate >= weekStart && requestDate < weekEnd;
      });

      weeklyStats.push({
        week: `Week ${i + 1}`,
        assigned: weekRequests.length,
        completed: weekRequests.filter((r) => r.status === "completed").length,
      });
    }

    // Generate recent activity
    const recentActivity = requests.slice(0, 5).map((request) => ({
      date: request.updated_at || request.created_at,
      action:
        request.status === "completed"
          ? "Completed Emergency Request"
          : "Assigned New Request",
      details: `${request.emergency_type} - ${request.pickup_address}`,
      type: request.status === "completed" ? "completion" : "assignment",
    }));

    const stats = {
      totalAssigned,
      completedRequests,
      averageResponseTime: "8.5 minutes", // This would need more complex calculation
      monthlyCompletion,
      weeklyStats,
      recentActivity,
    };

    res.json({ stats });
  } catch (error) {
    console.error("Get staff reports error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get feedback related to staff services
export const handleGetStaffFeedback: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "staff") {
      return res
        .status(403)
        .json({ error: "Only staff can access this endpoint" });
    }

    console.log(`🔍 Getting staff feedback for user ${userId}`);

    // Get feedback/complaints related to staff services from feedback_complaints table
    const result = db.exec(`
      SELECT
        fc.id,
        fc.type,
        fc.subject,
        fc.description,
        fc.category,
        fc.priority,
        fc.status,
        fc.rating,
        fc.admin_response,
        fc.created_at,
        customer.full_name as customer_name,
        customer.email as customer_email,
        admin_u.full_name as admin_name
      FROM feedback_complaints fc
      JOIN users customer ON fc.customer_user_id = customer.id
      LEFT JOIN users admin_u ON fc.admin_user_id = admin_u.id
      WHERE fc.category IN ('staff', 'service')
      OR fc.type = 'complaint'
      OR fc.subject LIKE '%staff%'
      OR fc.description LIKE '%staff%'
      ORDER BY fc.created_at DESC
      LIMIT 50
    `);

    const feedbacks = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      rows.forEach((row) => {
        const feedback: any = {};
        columns.forEach((col, index) => {
          feedback[col] = row[index];
        });
        feedbacks.push(feedback);
      });
    }

    console.log(`📊 Retrieved ${feedbacks.length} feedback items for staff`);

    res.json({ feedbacks, total: feedbacks.length });
  } catch (error) {
    console.error("Get staff feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Respond to feedback
export const handleRespondToFeedback: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "staff") {
      return res
        .status(403)
        .json({ error: "Only staff can respond to feedback" });
    }

    const feedbackId = parseInt(req.params.feedbackId);
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: "Response text is required" });
    }

    console.log(`📝 Staff ${userId} responding to feedback ${feedbackId}`);

    // Check if the feedback exists in feedback_complaints table
    const checkFeedback = db.exec(
      `
      SELECT id, status FROM feedback_complaints WHERE id = ?
    `,
      [feedbackId],
    );

    if (
      !checkFeedback ||
      checkFeedback.length === 0 ||
      checkFeedback[0].values.length === 0
    ) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Create staff_responses table if it doesn't exist
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS staff_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          feedback_id INTEGER NOT NULL,
          staff_id INTEGER NOT NULL,
          response_text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (feedback_id) REFERENCES feedback_complaints(id),
          FOREIGN KEY (staff_id) REFERENCES users(id)
        )
      `);
    } catch (tableError) {
      console.log("Table creation skipped or already exists");
    }

    // Insert response
    db.run(
      `
      INSERT INTO staff_responses (feedback_id, staff_id, response_text, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `,
      [feedbackId, userId, response.trim()],
    );

    // Update feedback status to show staff has responded
    db.run(
      `
      UPDATE feedback_complaints
      SET status = 'in_review', updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `,
      [feedbackId],
    );

    // Save database changes
    const { saveDatabase } = require("../database");
    saveDatabase();

    console.log(`✅ Staff response submitted for feedback ${feedbackId}`);

    res.json({ message: "Response submitted successfully" });
  } catch (error) {
    console.error("Respond to feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get staff inventory (ambulance supplies)
export const handleGetStaffInventory: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;

    if (role !== "staff") {
      return res.status(403).json({ error: "Only staff can access inventory" });
    }

    // Check if inventory table exists, if not create it with sample data
    try {
      const checkTable = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_items'",
      );
      if (checkTable.length === 0) {
        // Create table
        db.exec(`
          CREATE TABLE inventory_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            current_stock INTEGER NOT NULL DEFAULT 0,
            min_threshold INTEGER NOT NULL DEFAULT 10,
            max_capacity INTEGER NOT NULL DEFAULT 100,
            unit TEXT NOT NULL DEFAULT 'pieces',
            location TEXT NOT NULL DEFAULT 'Storage',
            description TEXT,
            expiry_date DATE,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Insert sample data
        const sampleItems = [
          [
            "Oxygen Masks",
            "respiratory",
            15,
            10,
            50,
            "pieces",
            "Ambulance A1",
            "Adult oxygen masks for emergency use",
            null,
          ],
          [
            "Defibrillator Pads",
            "cardiac",
            3,
            5,
            20,
            "sets",
            "Ambulance A1",
            "AED electrode pads",
            null,
          ],
          [
            "Bandages",
            "wound_care",
            2,
            10,
            100,
            "rolls",
            "Ambulance A2",
            "Sterile gauze bandages",
            null,
          ],
          [
            "IV Fluids",
            "medication",
            8,
            5,
            30,
            "bags",
            "Storage Room",
            "Normal saline IV bags",
            "2025-12-31",
          ],
          [
            "Disposable Gloves",
            "ppe",
            0,
            50,
            500,
            "pairs",
            "Ambulance A1",
            "Latex-free medical gloves",
            null,
          ],
          [
            "Emergency Blankets",
            "equipment",
            12,
            8,
            40,
            "pieces",
            "Ambulance A2",
            "Thermal emergency blankets",
            null,
          ],
          [
            "Blood Pressure Cuffs",
            "equipment",
            4,
            3,
            15,
            "pieces",
            "Storage Room",
            "Manual BP monitoring cuffs",
            null,
          ],
        ];

        sampleItems.forEach((item) => {
          db.run(
            `
            INSERT INTO inventory_items (name, category, current_stock, min_threshold, max_capacity, unit, location, description, expiry_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            item,
          );
        });
      }
    } catch (tableError) {
      console.log("Inventory table setup:", tableError);
    }

    // Get inventory items
    const result = db.exec(`
      SELECT 
        id,
        name,
        category,
        current_stock,
        min_threshold,
        max_capacity,
        unit,
        location,
        description,
        expiry_date,
        last_updated,
        CASE 
          WHEN current_stock = 0 THEN 'out_of_stock'
          WHEN current_stock <= min_threshold * 0.5 THEN 'critical'
          WHEN current_stock <= min_threshold THEN 'low'
          ELSE 'good'
        END as status
      FROM inventory_items
      ORDER BY 
        CASE 
          WHEN current_stock = 0 THEN 1
          WHEN current_stock <= min_threshold * 0.5 THEN 2
          WHEN current_stock <= min_threshold THEN 3
          ELSE 4
        END,
        name
    `);

    const inventory = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      rows.forEach((row) => {
        const item: any = {};
        columns.forEach((col, index) => {
          item[col] = row[index];
        });
        inventory.push(item);
      });
    }

    res.json({ inventory });
  } catch (error) {
    console.error("Get staff inventory error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Report low stock
export const handleReportLowStock: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "staff") {
      return res.status(403).json({ error: "Only staff can report low stock" });
    }

    const itemId = parseInt(req.params.itemId);

    // In a real system, this would create a notification or task for management
    // For now, we'll just log it and return success
    console.log(
      `🚨 Low stock reported by staff ${userId} for inventory item ${itemId}`,
    );

    res.json({ message: "Low stock report submitted successfully" });
  } catch (error) {
    console.error("Report low stock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
