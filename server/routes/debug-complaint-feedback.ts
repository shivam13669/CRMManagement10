import { RequestHandler } from "express";
import { db } from "../database";

// Debug endpoint to check complaint feedback data
export const handleComplaintFeedbackDebug: RequestHandler = async (
  req,
  res,
) => {
  try {
    console.log("🔍 DEBUG: Checking complaint feedback data...");

    // Get all complaints
    const complaintsResult = db.exec(`
      SELECT id, type, subject, status, customer_user_id, admin_response
      FROM feedback_complaints
      ORDER BY created_at DESC
    `);

    let allComplaints = [];
    if (complaintsResult && complaintsResult.length > 0) {
      const columns = complaintsResult[0].columns;
      allComplaints = complaintsResult[0].values.map((row) => {
        const item: any = {};
        columns.forEach((col, index) => {
          item[col] = row[index];
        });
        return item;
      });
    }

    // Get all complaint feedback
    const feedbackResult = db.exec(`
      SELECT
        cf.*,
        u.full_name as customer_name,
        fc.subject as complaint_subject,
        fc.status as complaint_status,
        fc.admin_response
      FROM complaint_feedback cf
      JOIN users u ON cf.customer_user_id = u.id
      JOIN feedback_complaints fc ON cf.complaint_id = fc.id
      ORDER BY cf.created_at DESC
    `);

    let complaintFeedbackData = [];
    if (feedbackResult && feedbackResult.length > 0) {
      const columns = feedbackResult[0].columns;
      complaintFeedbackData = feedbackResult[0].values.map((row) => {
        const item: any = {};
        columns.forEach((col, index) => {
          item[col] = row[index];
        });
        return item;
      });
    }

    // Get closed complaints (those that can be rated)
    const closedComplaints = allComplaints.filter((c) => c.status === "closed");

    console.log(`📊 Total complaints: ${allComplaints.length}`);
    console.log(`📊 Closed complaints: ${closedComplaints.length}`);
    console.log(
      `📊 Complaint feedback records: ${complaintFeedbackData.length}`,
    );

    res.json({
      success: true,
      data: {
        totalComplaints: allComplaints.length,
        closedComplaintsCount: closedComplaints.length,
        complaintFeedbackCount: complaintFeedbackData.length,
        allComplaints,
        closedComplaints,
        complaintFeedbackData,
      },
    });
  } catch (error) {
    console.error("❌ Error in complaint feedback debug:", error);
    res.status(500).json({
      error: "Internal server error during debug",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
