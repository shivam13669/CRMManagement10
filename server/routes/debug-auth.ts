import { RequestHandler } from "express";

// Debug endpoint to check what's in the JWT token
export const handleDebugAuth: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    console.log("🔍 Debug Auth - JWT Token Contents:", user);

    res.json({
      success: true,
      message: "JWT token contents",
      jwtData: user,
      userId: user?.userId,
      email: user?.email,
      role: user?.role,
      full_name: user?.full_name,
    });
  } catch (error) {
    console.error("❌ Error in auth debug:", error);
    res.status(500).json({
      success: false,
      error: "Failed to debug auth",
      details: error.message,
    });
  }
};

// Debug endpoint to check customer ambulance with JWT
export const handleDebugPatientAmbulanceWithAuth: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { userId, role } = (req as any).user;

    console.log("🔍 Debug Customer Ambulance - JWT Data:");
    console.log("   userId:", userId);
    console.log("   role:", role);
    console.log("   Full JWT:", (req as any).user);

    if (role !== "customer") {
      return res
        .status(403)
        .json({ error: "Only customers can view their own requests" });
    }

    // Import db here to avoid circular imports
    const { db } = require("../database");

    console.log(
      `🔍 Querying ambulance_requests WHERE customer_user_id = ${userId}`,
    );

    const result = db.exec(
      `
      SELECT
        ar.*,
        staff.full_name as assigned_staff_name,
        staff.phone as assigned_staff_phone
      FROM ambulance_requests ar
      LEFT JOIN users staff ON ar.assigned_staff_id = staff.id
      WHERE ar.customer_user_id = ?
      ORDER BY ar.created_at DESC
    `,
      [userId],
    );

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
      `✅ Found ${requests.length} ambulance requests for userId ${userId}`,
    );

    res.json({
      success: true,
      message: `Debug customer ambulance requests`,
      jwtUserId: userId,
      jwtRole: role,
      jwtFull: (req as any).user,
      queryUsed: `SELECT * FROM ambulance_requests WHERE customer_user_id = ${userId}`,
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error("❌ Error in debug customer ambulance with auth:", error);
    res.status(500).json({
      success: false,
      error: "Failed to debug customer ambulance with auth",
      details: error.message,
    });
  }
};
