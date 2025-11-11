import { RequestHandler } from "express";
import { db } from "../database";

// Test endpoint to check customer ambulance requests without auth
export const handleTestPatientAmbulanceRequests: RequestHandler = async (
  req,
  res,
) => {
  try {
    console.log("🔍 Testing customer ambulance requests for user ID 2...");

    // Direct query for customer ID 2 (shivam288e@gmail.com)
    const result = db.exec(`
      SELECT
        ar.*,
        staff.full_name as assigned_staff_name,
        staff.phone as assigned_staff_phone
      FROM ambulance_requests ar
      LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
      WHERE ar.customer_user_id = 2
      ORDER BY ar.created_at DESC
    `);

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
    }

    console.log(
      `✅ Found ${requests.length} ambulance requests for customer ID 2`,
    );
    requests.forEach((req) => {
      console.log(
        `   - Request #${req.id}: ${req.emergency_type} (${req.status})`,
      );
    });

    res.json({
      success: true,
      message: `Found ${requests.length} ambulance requests for customer ID 2`,
      customerUserId: 2,
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error("❌ Error testing customer ambulance requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test customer ambulance requests",
      details: error.message,
    });
  }
};
