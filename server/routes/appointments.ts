import { RequestHandler } from "express";
import { db } from "../database";

export interface Appointment {
  id?: number;
  customer_user_id: number;
  doctor_user_id?: number;
  appointment_date: string;
  appointment_time: string;
  status?: string;
  reason: string;
  symptoms?: string;
  notes?: string;
  created_at?: string;
}

// Create appointment (for customers)
export const handleCreateAppointment: RequestHandler = async (req, res) => {
  try {
    const { userId, role } = (req as any).user;

    if (role !== "customer") {
      return res
        .status(403)
        .json({ error: "Only customers can book appointments" });
    }

    const {
      doctor_user_id,
      appointment_date,
      appointment_time,
      reason,
      symptoms,
    } = req.body;

    if (!appointment_date || !appointment_time || !reason) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: appointment_date, appointment_time, reason",
        });
    }

    // Verify doctor exists if doctor_user_id is provided
    if (doctor_user_id) {
      const doctorResult = db.exec(
        "SELECT id FROM users WHERE id = ? AND role = 'doctor'",
        [doctor_user_id],
      );
      if (doctorResult.length === 0 || doctorResult[0].values.length === 0) {
        return res.status(400).json({ error: "Invalid doctor selected" });
      }
    }

    // Insert appointment
    db.run(
      `
      INSERT INTO appointments (
        customer_user_id, doctor_user_id, appointment_date, appointment_time,
        reason, symptoms, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `,
      [
        userId,
        doctor_user_id || null,
        appointment_date,
        appointment_time,
        reason,
        symptoms || null,
      ],
    );

    // Get the created appointment
    const result = db.exec("SELECT last_insert_rowid() as id");
    const appointmentId = result[0].values[0][0];

    console.log(
      `📅 Appointment created: ID ${appointmentId} for customer ${userId}`,
    );

    res.status(201).json({
      message: "Appointment booked successfully",
      appointmentId,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get appointments (for doctors and admin)
export const handleGetAppointments: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;

    if (role !== "doctor" && role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only doctors and admin can view appointments" });
    }

    let query = `
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        a.symptoms,
        a.notes,
        a.created_at,
        customer.full_name as customer_name,
        customer.email as customer_email,
        customer.phone as customer_phone,
        doctor.full_name as doctor_name
      FROM appointments a
      JOIN users customer ON a.customer_user_id = customer.id
      LEFT JOIN users doctor ON a.doctor_user_id = doctor.id
    `;

    let params: any[] = [];

    // If doctor, only show their appointments
    if (role === "doctor") {
      query += ` WHERE (a.doctor_user_id = ? OR a.doctor_user_id IS NULL)`;
      params.push(userId);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    const result = db.exec(query, params);

    let appointments = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      appointments = rows.map((row) => {
        const appointment: any = {};
        columns.forEach((col, index) => {
          appointment[col] = row[index];
        });
        return appointment;
      });
    }

    res.json({
      appointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update appointment (for doctors and admin)
export const handleUpdateAppointment: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { appointmentId } = req.params;
    const { status, doctor_user_id, notes } = req.body;

    if (role !== "doctor" && role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only doctors and admin can update appointments" });
    }

    // If doctor, verify they can only update their own appointments or unassigned ones
    if (role === "doctor") {
      const appointmentResult = db.exec(
        "SELECT doctor_user_id FROM appointments WHERE id = ?",
        [appointmentId],
      );

      if (
        appointmentResult.length > 0 &&
        appointmentResult[0].values.length > 0
      ) {
        const currentDoctorId = appointmentResult[0].values[0][0];
        if (currentDoctorId && currentDoctorId !== userId) {
          return res
            .status(403)
            .json({ error: "You can only update your own appointments" });
        }
      }
    }

    // Update appointment
    db.run(
      `
      UPDATE appointments 
      SET status = ?, doctor_user_id = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [status, doctor_user_id || null, notes || null, appointmentId],
    );

    console.log(`📅 Appointment ${appointmentId} updated by user ${userId}`);

    res.json({ message: "Appointment updated successfully" });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get customer's own appointments
export const handleGetCustomerAppointments: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { userId, role } = (req as any).user;

    if (role !== "customer") {
      return res
        .status(403)
        .json({ error: "Only customers can view their own appointments" });
    }

    const result = db.exec(
      `
      SELECT 
        a.*,
        doctor.full_name as doctor_name,
        doctor.phone as doctor_phone
      FROM appointments a
      LEFT JOIN users doctor ON a.doctor_user_id = doctor.id
      WHERE a.customer_user_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `,
      [userId],
    );

    let appointments = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      appointments = rows.map((row) => {
        const appointment: any = {};
        columns.forEach((col, index) => {
          appointment[col] = row[index];
        });
        return appointment;
      });
    }

    res.json({
      appointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error("Get customer appointments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get available doctors for appointment booking
export const handleGetAvailableDoctors: RequestHandler = async (req, res) => {
  try {
    const result = db.exec(`
      SELECT 
        u.id,
        u.full_name,
        u.phone,
        d.specialization,
        d.experience_years,
        d.consultation_fee,
        d.available_days
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor'
      ORDER BY u.full_name
    `);

    let doctors = [];
    if (result.length > 0) {
      const columns = result[0].columns;
      const rows = result[0].values;

      doctors = rows.map((row) => {
        const doctor: any = {};
        columns.forEach((col, index) => {
          doctor[col] = row[index];
        });
        return doctor;
      });
    }

    res.json({
      doctors,
      total: doctors.length,
    });
  } catch (error) {
    console.error("Get available doctors error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
