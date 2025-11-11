import { RequestHandler } from "express";
import { db, saveDatabase } from "../database";

export interface FeedbackComplaint {
  id?: number;
  customer_user_id: number;
  type: "feedback" | "complaint";
  subject: string;
  description: string;
  category?: "service" | "facility" | "staff" | "doctor" | "billing" | "other";
  priority?: "low" | "normal" | "high" | "urgent";
  status?: "pending" | "in_review" | "resolved" | "closed";
  rating?: number;
  admin_response?: string;
  admin_user_id?: number;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Create new feedback/complaint
export const handleCreateFeedback: RequestHandler = async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const {
      type,
      subject,
      description,
      category = "other",
      priority = "normal",
      rating,
    }: {
      type: "feedback" | "complaint";
      subject: string;
      description: string;
      category?: string;
      priority?: string;
      rating?: number;
    } = req.body;

    // Validate required fields
    if (!type || !subject || !description) {
      return res.status(400).json({
        error: "Type, subject, and description are required",
      });
    }

    if (!["feedback", "complaint"].includes(type)) {
      return res.status(400).json({
        error: "Type must be either 'feedback' or 'complaint'",
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5",
      });
    }

    // Map frontend categories to database-allowed values
    const mapCategory = (inputCategory: string): string => {
      const categoryMap: { [key: string]: string } = {
        // Feedback categories
        "General Feedback": "other",
        "Service Quality": "service",
        "Staff Behavior": "staff",
        "Facility Cleanliness": "facility",
        "Wait Time": "service",
        "Treatment Quality": "doctor",

        // Department/Complaint categories
        Reception: "service",
        Nursing: "staff",
        Doctors: "doctor",
        Billing: "billing",
        Pharmacy: "service",
        Laboratory: "service",
        Emergency: "service",
        Administration: "other",

        // Complaint types
        "Service Issue": "service",
        "Billing Problem": "billing",
        "Staff Complaint": "staff",
        "Facility Issue": "facility",
        "Treatment Concern": "doctor",
        Other: "other",
      };

      return categoryMap[inputCategory] || "other";
    };

    const mappedCategory = mapCategory(category);

    // Map frontend priority to database-allowed values
    const mapPriority = (inputPriority: string): string => {
      const priorityMap: { [key: string]: string } = {
        Low: "low",
        Medium: "normal",
        High: "high",
        Urgent: "urgent",
        low: "low",
        normal: "normal",
        high: "high",
        urgent: "urgent",
      };

      return priorityMap[inputPriority] || "normal";
    };

    const mappedPriority = mapPriority(priority);

    // Get current IST timestamp
    const istNow = new Date();
    const istTime = new Date(
      istNow.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );

    // Format as SQLite datetime: YYYY-MM-DD HH:MM:SS
    const year = istTime.getFullYear();
    const month = (istTime.getMonth() + 1).toString().padStart(2, "0");
    const day = istTime.getDate().toString().padStart(2, "0");
    const hours = istTime.getHours().toString().padStart(2, "0");
    const minutes = istTime.getMinutes().toString().padStart(2, "0");
    const seconds = istTime.getSeconds().toString().padStart(2, "0");
    const istTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Insert feedback/complaint
    const result = db.exec(
      `
      INSERT INTO feedback_complaints
      (customer_user_id, type, subject, description, category, priority, rating, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `,
      [
        userId,
        type,
        subject,
        description,
        mappedCategory,
        mappedPriority,
        rating || null,
        istTimestamp,
      ],
    );

    saveDatabase();

    // Get the last inserted ID
    const lastIdResult = db.exec("SELECT last_insert_rowid() as id");
    const feedbackId = lastIdResult[0]?.values[0]?.[0] || 0;

    console.log(`✅ ${type} created with ID: ${feedbackId}`);

    res.status(201).json({
      message: `${type} submitted successfully`,
      id: feedbackId,
    });
  } catch (error: any) {
    console.error(`❌ Error creating feedback/complaint:`, error);
    res.status(500).json({
      error: "Internal server error while submitting feedback",
    });
  }
};

// Get all feedback/complaints (admin only)
export const handleGetAllFeedback: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;

    if (role !== "admin") {
      return res.status(403).json({
        error: "Access denied. Admin access required.",
      });
    }

    const result = db.exec(`
      SELECT 
        fc.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        admin_u.full_name as admin_name
      FROM feedback_complaints fc
      JOIN users u ON fc.customer_user_id = u.id
      LEFT JOIN users admin_u ON fc.admin_user_id = admin_u.id
      ORDER BY fc.created_at DESC
    `);

    if (result.length === 0) {
      return res.json({ feedback: [], total: 0 });
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    const feedback = rows.map((row) => {
      const item: any = {};
      columns.forEach((col, index) => {
        item[col] = row[index];
      });
      return item;
    });

    console.log(`📊 Retrieved ${feedback.length} feedback/complaints`);

    res.json({ feedback, total: feedback.length });
  } catch (error) {
    console.error("❌ Error getting feedback/complaints:", error);
    res.status(500).json({
      error: "Internal server error while fetching feedback",
    });
  }
};

// Get customer's own feedback/complaints
export const handleGetMyFeedback: RequestHandler = async (req, res) => {
  try {
    const { userId } = (req as any).user;

    const result = db.exec(
      `
      SELECT *
      FROM feedback_complaints
      WHERE customer_user_id = ?
      ORDER BY created_at DESC
    `,
      [userId],
    );

    if (result.length === 0) {
      return res.json({ feedback: [], total: 0 });
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    const feedback = rows.map((row) => {
      const item: any = {};
      columns.forEach((col, index) => {
        item[col] = row[index];
      });
      return item;
    });

    console.log(
      `📊 Retrieved ${feedback.length} feedback/complaints for user ${userId}`,
    );

    res.json({ feedback, total: feedback.length });
  } catch (error) {
    console.error("❌ Error getting user feedback/complaints:", error);
    res.status(500).json({
      error: "Internal server error while fetching feedback",
    });
  }
};

// Update feedback/complaint status (admin only)
export const handleUpdateFeedbackStatus: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { feedbackId } = req.params;
    const {
      status,
      admin_response,
    }: { status: string; admin_response?: string } = req.body;

    if (role !== "admin") {
      return res.status(403).json({
        error: "Access denied. Admin access required.",
      });
    }

    if (!["pending", "in_review", "resolved", "closed"].includes(status)) {
      return res.status(400).json({
        error:
          "Invalid status. Must be pending, in_review, resolved, or closed",
      });
    }

    // Get current IST timestamp
    const istNow = new Date();
    const istTime = new Date(
      istNow.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );

    // Format as SQLite datetime: YYYY-MM-DD HH:MM:SS
    const year = istTime.getFullYear();
    const month = (istTime.getMonth() + 1).toString().padStart(2, "0");
    const day = istTime.getDate().toString().padStart(2, "0");
    const hours = istTime.getHours().toString().padStart(2, "0");
    const minutes = istTime.getMinutes().toString().padStart(2, "0");
    const seconds = istTime.getSeconds().toString().padStart(2, "0");
    const istTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const updateQuery =
      status === "resolved"
        ? `UPDATE feedback_complaints
         SET status = ?, admin_response = ?, admin_user_id = ?, resolved_at = ?, updated_at = ?
         WHERE id = ?`
        : `UPDATE feedback_complaints
         SET status = ?, admin_response = ?, admin_user_id = ?, updated_at = ?
         WHERE id = ?`;

    const queryParams =
      status === "resolved"
        ? [
            status,
            admin_response || null,
            userId,
            istTimestamp,
            istTimestamp,
            feedbackId,
          ]
        : [status, admin_response || null, userId, istTimestamp, feedbackId];

    const result = db.exec(updateQuery, queryParams);
    saveDatabase();

    // Check if any rows were affected by checking if the feedback exists
    const checkResult = db.exec(
      "SELECT id FROM feedback_complaints WHERE id = ?",
      [feedbackId],
    );
    if (checkResult.length === 0 || checkResult[0].values.length === 0) {
      return res.status(404).json({
        error: "Feedback/complaint not found",
      });
    }

    console.log(`✅ Feedback ${feedbackId} status updated to: ${status}`);

    res.json({
      message: "Feedback status updated successfully",
      status,
    });
  } catch (error) {
    console.error("❌ Error updating feedback status:", error);
    res.status(500).json({
      error: "Internal server error while updating feedback",
    });
  }
};

// Get feedback statistics (admin only)
export const handleGetFeedbackStats: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;

    if (role !== "admin") {
      return res.status(403).json({
        error: "Access denied. Admin access required.",
      });
    }

    const result = db.exec(`
      SELECT 
        type,
        status,
        COUNT(*) as count
      FROM feedback_complaints
      GROUP BY type, status
      ORDER BY type, status
    `);

    let stats = {
      total: 0,
      feedback: { pending: 0, in_review: 0, resolved: 0, closed: 0 },
      complaints: { pending: 0, in_review: 0, resolved: 0, closed: 0 },
    };

    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      rows.forEach((row) => {
        const type = row[0] as "feedback" | "complaint";
        const status = row[1] as keyof typeof stats.feedback;
        const count = row[2] as number;

        stats.total += count;
        if (stats[type] && typeof stats[type][status] === "number") {
          stats[type][status] = count;
        }
      });
    }

    res.json({ stats });
  } catch (error) {
    console.error("❌ Error getting feedback stats:", error);
    res.status(500).json({
      error: "Internal server error while fetching feedback statistics",
    });
  }
};
