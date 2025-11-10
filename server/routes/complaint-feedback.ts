import { RequestHandler } from "express";
import { db, saveDatabase } from "../database";

export interface ComplaintFeedback {
  id?: number;
  complaint_id: number;
  customer_user_id: number;
  rating: number;
  feedback_text?: string;
  created_at?: string;
}

// Submit feedback on a closed complaint
export const handleSubmitComplaintFeedback: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { userId } = (req as any).user;
    const { complaintId } = req.params;
    const {
      rating,
      feedback_text,
    }: {
      rating: number;
      feedback_text?: string;
    } = req.body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Rating is required and must be between 1 and 5",
      });
    }

    // Check if complaint exists and belongs to the user and is closed
    const complaintResult = db.exec(
      `
      SELECT id, customer_user_id, status
      FROM feedback_complaints
      WHERE id = ? AND customer_user_id = ?
    `,
      [complaintId, userId],
    );

    if (
      !complaintResult ||
      complaintResult.length === 0 ||
      !complaintResult[0] ||
      complaintResult[0].values.length === 0
    ) {
      return res.status(404).json({
        error: "Complaint not found or does not belong to you",
      });
    }

    const complaint = complaintResult[0].values[0];
    const complaintStatus = complaint[2];

    if (complaintStatus !== "closed") {
      return res.status(400).json({
        error: "You can only provide feedback on closed complaints",
      });
    }

    // Check if feedback already exists
    const existingFeedbackResult = db.exec(
      `
      SELECT id FROM complaint_feedback
      WHERE complaint_id = ? AND customer_user_id = ?
    `,
      [complaintId, userId],
    );

    console.log(
      `🔍 Checking existing feedback for complaint ${complaintId} by user ${userId}:`,
      existingFeedbackResult,
    );

    if (
      existingFeedbackResult &&
      existingFeedbackResult.length > 0 &&
      existingFeedbackResult[0].values.length > 0
    ) {
      console.log(
        `⚠️ User ${userId} already provided feedback for complaint ${complaintId}`,
      );
      return res.status(400).json({
        error: "You have already provided feedback for this complaint",
      });
    }

    // Insert complaint feedback with error handling for duplicates
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

    let result;
    try {
      result = db.exec(
        `
        INSERT INTO complaint_feedback
        (complaint_id, customer_user_id, rating, feedback_text, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
        [complaintId, userId, rating, feedback_text || null, istTimestamp],
      );
    } catch (dbError: any) {
      if (
        dbError.message &&
        dbError.message.includes("UNIQUE constraint failed")
      ) {
        console.log(
          `⚠️ Database-level duplicate feedback attempt by user ${userId} for complaint ${complaintId}`,
        );
        return res.status(400).json({
          error: "You have already provided feedback for this complaint",
        });
      }
      throw dbError;
    }

    saveDatabase();

    // Get the last inserted ID
    const lastIdResult = db.exec("SELECT last_insert_rowid() as id");
    const feedbackId = lastIdResult[0]?.values[0]?.[0] || 0;

    console.log(
      `✅ Complaint feedback submitted with ID: ${feedbackId} for complaint: ${complaintId} by user: ${userId}`,
    );
    console.log(`📊 Rating: ${rating}, Text: ${feedback_text}`);

    res.status(201).json({
      message: "Feedback submitted successfully",
      id: feedbackId,
    });
  } catch (error: any) {
    console.error(`❌ Error submitting complaint feedback:`, error);
    res.status(500).json({
      error: "Internal server error while submitting feedback",
    });
  }
};

// Get feedback for a specific complaint
export const handleGetComplaintFeedback: RequestHandler = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const result = db.exec(
      `
      SELECT 
        cf.*,
        u.full_name as customer_name
      FROM complaint_feedback cf
      JOIN users u ON cf.customer_user_id = u.id
      WHERE cf.complaint_id = ?
    `,
      [complaintId],
    );

    if (result.length === 0) {
      return res.json({ feedback: null });
    }

    const columns = result[0].columns;
    const row = result[0].values[0];

    const feedback: any = {};
    columns.forEach((col, index) => {
      feedback[col] = row[index];
    });

    console.log(
      `📊 Retrieved feedback for complaint ${complaintId}:`,
      feedback,
    );

    res.json({ feedback });
  } catch (error) {
    console.error("❌ Error getting complaint feedback:", error);
    res.status(500).json({
      error: "Internal server error while fetching feedback",
    });
  }
};

// Get all complaint feedback for admin view
export const handleGetAllComplaintFeedback: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role } = (req as any).user;

    if (role !== "admin") {
      return res.status(403).json({
        error: "Access denied. Admin access required.",
      });
    }

    console.log("🔍 Checking complaint feedback tables...");

    // Check if tables exist
    try {
      const tablesResult = db.exec(`
        SELECT name FROM sqlite_master WHERE type='table'
        AND name IN ('complaint_feedback', 'feedback_complaints', 'users')
        ORDER BY name
      `);
      console.log(
        "📋 Available tables:",
        tablesResult[0]?.values || "None found",
      );
    } catch (tableError) {
      console.error("❌ Error checking tables:", tableError);
    }

    // Try the query with error handling
    let result;
    try {
      result = db.exec(`
        SELECT
          cf.*,
          u.full_name as customer_name,
          fc.subject as complaint_subject,
          fc.admin_response
        FROM complaint_feedback cf
        JOIN users u ON cf.customer_user_id = u.id
        JOIN feedback_complaints fc ON cf.complaint_id = fc.id
        ORDER BY cf.created_at DESC
      `);
      console.log(
        "✅ Query executed successfully, result length:",
        result.length,
      );
    } catch (queryError) {
      console.error("❌ Query execution error:", queryError);
      console.log(
        "🔄 Trying simpler query to check complaint_feedback table...",
      );

      try {
        const simpleResult = db.exec(
          "SELECT COUNT(*) as count FROM complaint_feedback",
        );
        console.log(
          "📊 Complaint feedback count:",
          simpleResult[0]?.values[0]?.[0] || 0,
        );
      } catch (simpleError) {
        console.error("❌ Simple query also failed:", simpleError);
        return res.status(500).json({
          error:
            "Database table structure issue. complaint_feedback table may not exist.",
        });
      }

      return res.status(500).json({
        error: "Database query failed. Please check server logs.",
      });
    }

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      console.log("ℹ️ No complaint feedback found, returning empty array");
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
      `📊 Retrieved ${feedback.length} complaint feedbacks for admin dashboard`,
    );
    console.log(`🔍 Sample feedback data:`, feedback.slice(0, 2));

    res.json({ feedback, total: feedback.length });
  } catch (error) {
    console.error("❌ Error getting all complaint feedback:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      error: "Internal server error while fetching feedback",
      details: error.message,
    });
  }
};
