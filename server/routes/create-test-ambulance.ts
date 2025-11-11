import { RequestHandler } from "express";
import { db, saveDatabase } from "../database";

// Debug endpoint to create a test ambulance request
export const handleCreateTestAmbulanceRequest: RequestHandler = async (
  req,
  res,
) => {
  try {
    console.log("🚑 Creating test ambulance request for customer ID 2...");

    // Insert test ambulance request for customer ID 2 (shivam288e@gmail.com)
    db.run(
      `
      INSERT INTO ambulance_requests (
        customer_user_id, pickup_address, destination_address, emergency_type,
        customer_condition, contact_number, status, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
      [
        2, // Customer ID for shivam288e@gmail.com
        "123 Test Emergency Street, Test City, 12345",
        "City General Hospital, Emergency Department",
        "Heart Attack",
        "Test Customer: Shivam Anand, Age: 25, Gender: Male. Experiencing severe chest pain and shortness of breath. Customer is conscious but in distress.",
        "8709356155",
        "pending",
        "high",
      ],
    );

    // Get the created request ID
    const result = db.exec("SELECT last_insert_rowid() as id");
    const requestId = result[0].values[0][0];

    saveDatabase();

    console.log(`✅ Test ambulance request created with ID: ${requestId}`);

    // Verify the request was created by fetching it
    const verifyResult = db.exec(
      `
      SELECT
        ar.*,
        u.full_name as customer_name,
        u.email as customer_email
      FROM ambulance_requests ar
      JOIN users u ON ar.customer_user_id = u.id
      WHERE ar.id = ?
    `,
      [requestId],
    );

    let createdRequest = null;
    if (verifyResult.length > 0) {
      const columns = verifyResult[0].columns;
      const row = verifyResult[0].values[0];

      createdRequest = {};
      columns.forEach((col, index) => {
        createdRequest[col] = row[index];
      });
    }

    res.json({
      success: true,
      message: "Test ambulance request created successfully",
      requestId,
      request: createdRequest,
    });
  } catch (error) {
    console.error("❌ Error creating test ambulance request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create test ambulance request",
      details: error.message,
    });
  }
};
