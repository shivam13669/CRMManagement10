import { RequestHandler } from "express";
import { db } from "../database";

export interface HospitalAmbulance {
  id?: number;
  hospital_user_id: number;
  registration_number: string;
  ambulance_type: string;
  model?: string;
  manufacturer?: string;
  registration_year?: number;
  driver_name?: string;
  driver_phone?: string;
  driver_license_number?: string;
  equipment?: string;
  status?: string;
  current_location?: string;
  assigned_request_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Get all ambulances for a hospital
export const handleGetHospitalAmbulances: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "hospital") {
      return res.status(403).json({
        error: "Only hospitals can view their ambulances",
      });
    }

    const result = db.exec(
      `
      SELECT
        ha.*,
        ar.id as assigned_request_id,
        ar.emergency_type,
        ar.pickup_address,
        ar.customer_condition,
        u.full_name as patient_name,
        u.phone as patient_phone
      FROM hospital_ambulances ha
      LEFT JOIN ambulance_requests ar ON ha.assigned_request_id = ar.id
      LEFT JOIN users u ON ar.customer_user_id = u.id
      WHERE ha.hospital_user_id = ?
      ORDER BY ha.created_at DESC
    `,
      [userId],
    );

    let ambulances: any[] = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      ambulances = result[0].values.map((row) => {
        const ambulance: any = {};
        columns.forEach((col, index) => {
          ambulance[col] = row[index];
        });
        return ambulance;
      });
    }

    res.json({
      ambulances,
      total: ambulances.length,
    });
  } catch (error) {
    console.error("Get hospital ambulances error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new ambulance for hospital
export const handleCreateHospitalAmbulance: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "hospital") {
      return res.status(403).json({
        error: "Only hospitals can add ambulances",
      });
    }

    const {
      registration_number,
      ambulance_type,
      model,
      manufacturer,
      registration_year,
      driver_name,
      driver_phone,
      driver_license_number,
      equipment,
      current_location,
    } = req.body;

    // Validate required fields
    if (!registration_number || !ambulance_type) {
      return res.status(400).json({
        error: "Registration number and ambulance type are required",
      });
    }

    // Check if registration number already exists for this hospital
    const checkResult = db.exec(
      `SELECT id FROM hospital_ambulances WHERE registration_number = ? AND hospital_user_id = ?`,
      [registration_number, userId],
    );

    if (checkResult.length > 0 && checkResult[0].values.length > 0) {
      return res.status(400).json({
        error: "Ambulance with this registration number already exists",
      });
    }

    db.run(
      `
      INSERT INTO hospital_ambulances (
        hospital_user_id, registration_number, ambulance_type, model, manufacturer,
        registration_year, driver_name, driver_phone, driver_license_number, equipment,
        current_location, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', datetime('now'), datetime('now'))
    `,
      [
        userId,
        registration_number,
        ambulance_type,
        model || null,
        manufacturer || null,
        registration_year || null,
        driver_name || null,
        driver_phone || null,
        driver_license_number || null,
        equipment || null,
        current_location || null,
      ],
    );

    // Get the created ambulance
    const result = db.exec("SELECT last_insert_rowid() as id");
    const ambulanceId = result[0].values[0][0];

    // Update hospital's ambulance count
    db.run(
      `
      UPDATE hospitals
      SET number_of_ambulances = number_of_ambulances + 1,
          updated_at = datetime('now')
      WHERE user_id = ?
    `,
      [userId],
    );

    console.log(
      `🚑 Ambulance ${registration_number} created for hospital ${userId}`,
    );

    res.status(201).json({
      message: "Ambulance created successfully",
      ambulanceId,
    });
  } catch (error) {
    console.error("Create hospital ambulance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update ambulance details
export const handleUpdateHospitalAmbulance: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;
    const { ambulanceId } = req.params;

    if (role !== "hospital") {
      return res.status(403).json({
        error: "Only hospitals can update ambulances",
      });
    }

    // Check if ambulance belongs to this hospital
    const checkResult = db.exec(
      `SELECT hospital_user_id FROM hospital_ambulances WHERE id = ?`,
      [ambulanceId],
    );

    if (
      checkResult.length === 0 ||
      checkResult[0].values.length === 0 ||
      checkResult[0].values[0][0] !== userId
    ) {
      return res.status(403).json({
        error: "You can only update your own ambulances",
      });
    }

    const {
      registration_number,
      ambulance_type,
      model,
      manufacturer,
      registration_year,
      driver_name,
      driver_phone,
      driver_license_number,
      equipment,
      current_location,
    } = req.body;

    const updates = [];
    const values = [];

    if (registration_number !== undefined) {
      updates.push("registration_number = ?");
      values.push(registration_number);
    }
    if (ambulance_type !== undefined) {
      updates.push("ambulance_type = ?");
      values.push(ambulance_type);
    }
    if (model !== undefined) {
      updates.push("model = ?");
      values.push(model);
    }
    if (manufacturer !== undefined) {
      updates.push("manufacturer = ?");
      values.push(manufacturer);
    }
    if (registration_year !== undefined) {
      updates.push("registration_year = ?");
      values.push(registration_year);
    }
    if (driver_name !== undefined) {
      updates.push("driver_name = ?");
      values.push(driver_name);
    }
    if (driver_phone !== undefined) {
      updates.push("driver_phone = ?");
      values.push(driver_phone);
    }
    if (driver_license_number !== undefined) {
      updates.push("driver_license_number = ?");
      values.push(driver_license_number);
    }
    if (equipment !== undefined) {
      updates.push("equipment = ?");
      values.push(equipment);
    }
    if (current_location !== undefined) {
      updates.push("current_location = ?");
      values.push(current_location);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push("updated_at = datetime('now')");
    values.push(ambulanceId);

    db.run(
      `UPDATE hospital_ambulances SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    console.log(`🚑 Ambulance ${ambulanceId} updated`);

    res.json({ message: "Ambulance updated successfully" });
  } catch (error) {
    console.error("Update hospital ambulance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete ambulance
export const handleDeleteHospitalAmbulance: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;
    const { ambulanceId } = req.params;

    if (role !== "hospital") {
      return res.status(403).json({
        error: "Only hospitals can delete ambulances",
      });
    }

    // Check if ambulance belongs to this hospital and is not assigned
    const checkResult = db.exec(
      `SELECT hospital_user_id, status, assigned_request_id FROM hospital_ambulances WHERE id = ?`,
      [ambulanceId],
    );

    if (
      checkResult.length === 0 ||
      checkResult[0].values.length === 0 ||
      checkResult[0].values[0][0] !== userId
    ) {
      return res.status(403).json({
        error: "You can only delete your own ambulances",
      });
    }

    const row = checkResult[0].values[0];
    const status = row[1];
    const assignedRequestId = row[2];

    if (status === "assigned") {
      return res.status(400).json({
        error:
          "Cannot delete ambulance that is currently assigned to a request",
      });
    }

    db.run("DELETE FROM hospital_ambulances WHERE id = ?", [ambulanceId]);

    // Update hospital's ambulance count
    db.run(
      `
      UPDATE hospitals
      SET number_of_ambulances = MAX(0, number_of_ambulances - 1),
          updated_at = datetime('now')
      WHERE user_id = ?
    `,
      [userId],
    );

    console.log(`🚑 Ambulance ${ambulanceId} deleted`);

    res.json({ message: "Ambulance deleted successfully" });
  } catch (error) {
    console.error("Delete hospital ambulance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark ambulance as parked (available again)
export const handleParkAmbulance: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { ambulanceId } = req.params;

    if (role !== "hospital") {
      return res.status(403).json({
        error: "Only hospitals can mark ambulances as parked",
      });
    }

    // Check if ambulance belongs to this hospital
    const checkResult = db.exec(
      `SELECT hospital_user_id FROM hospital_ambulances WHERE id = ?`,
      [ambulanceId],
    );

    if (
      checkResult.length === 0 ||
      checkResult[0].values.length === 0 ||
      checkResult[0].values[0][0] !== userId
    ) {
      return res.status(403).json({
        error: "You can only park your own ambulances",
      });
    }

    db.run(
      `
      UPDATE hospital_ambulances
      SET status = 'available', assigned_request_id = NULL, updated_at = datetime('now')
      WHERE id = ?
    `,
      [ambulanceId],
    );

    console.log(`🚑 Ambulance ${ambulanceId} marked as parked (available)`);

    res.json({ message: "Ambulance marked as available successfully" });
  } catch (error) {
    console.error("Park ambulance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Assign ambulance to a service request
export const handleAssignAmbulanceToRequest: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;
    const { ambulanceId, requestId } = req.params;

    if (role !== "hospital") {
      return res.status(403).json({
        error: "Only hospitals can assign ambulances",
      });
    }

    // Check if ambulance belongs to this hospital and is available
    const ambulanceResult = db.exec(
      `SELECT hospital_user_id, status FROM hospital_ambulances WHERE id = ?`,
      [ambulanceId],
    );

    if (
      ambulanceResult.length === 0 ||
      ambulanceResult[0].values.length === 0 ||
      ambulanceResult[0].values[0][0] !== userId
    ) {
      return res.status(403).json({
        error: "You can only assign your own ambulances",
      });
    }

    const ambulanceStatus = ambulanceResult[0].values[0][1];
    if (ambulanceStatus === "assigned") {
      return res.status(400).json({
        error: "Ambulance is already assigned to another request",
      });
    }

    // Check if request is forwarded to this hospital
    const requestResult = db.exec(
      `SELECT forwarded_to_hospital_id FROM ambulance_requests WHERE id = ?`,
      [requestId],
    );

    if (
      requestResult.length === 0 ||
      requestResult[0].values.length === 0 ||
      requestResult[0].values[0][0] !== userId
    ) {
      return res.status(403).json({
        error: "This request is not forwarded to your hospital",
      });
    }

    // Assign ambulance
    db.run(
      `
      UPDATE hospital_ambulances
      SET status = 'assigned', assigned_request_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [requestId, ambulanceId],
    );

    // Update request with assigned ambulance
    db.run(
      `
      UPDATE ambulance_requests
      SET assigned_ambulance_id = ?, status = 'hospital_accepted', updated_at = datetime('now')
      WHERE id = ?
    `,
      [ambulanceId, requestId],
    );

    console.log(`🚑 Ambulance ${ambulanceId} assigned to request ${requestId}`);

    res.json({ message: "Ambulance assigned successfully" });
  } catch (error) {
    console.error("Assign ambulance to request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get available ambulances for a hospital
export const handleGetAvailableAmbulances: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "hospital") {
      return res.status(403).json({
        error: "Only hospitals can view their ambulances",
      });
    }

    const result = db.exec(
      `
      SELECT * FROM hospital_ambulances
      WHERE hospital_user_id = ? AND status = 'available'
      ORDER BY created_at DESC
    `,
      [userId],
    );

    let ambulances: any[] = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      ambulances = result[0].values.map((row) => {
        const ambulance: any = {};
        columns.forEach((col, index) => {
          ambulance[col] = row[index];
        });
        return ambulance;
      });
    }

    res.json({
      ambulances,
      total: ambulances.length,
    });
  } catch (error) {
    console.error("Get available ambulances error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
