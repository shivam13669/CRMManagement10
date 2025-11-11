import { RequestHandler } from "express";
import { getAllCustomers, getAllDoctors } from "../database";

// Get all customers (for doctors and admin)
export const handleGetCustomers: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;

    // Only doctors and admin can view all customers
    if (role !== "doctor" && role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to view customers list" });
    }

    const customers = await getAllCustomers();

    res.json({
      customers,
      total: customers.length,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching customers" });
  }
};

// Get all doctors
export const handleGetDoctors: RequestHandler = async (req, res) => {
  try {
    const doctors = await getAllDoctors();

    res.json({
      doctors,
      total: doctors.length,
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching doctors" });
  }
};

// Get dashboard stats
export const handleGetDashboardStats: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;

    const customers = await getAllCustomers();
    const doctors = await getAllDoctors();

    const stats = {
      totalCustomers: customers.length,
      totalDoctors: doctors.length,
      todayAppointments: 0, // This would be calculated from appointments table
      pendingReports: 0, // This would be calculated from reports table
    };

    // Role-specific stats
    if (role === "doctor") {
      // For doctors, show their specific stats
      stats.todayAppointments = 12; // Mock data for now
      stats.pendingReports = 7;
    } else if (role === "admin") {
      // For admin, show overall stats
      stats.todayAppointments = 45; // Mock data for now
      stats.pendingReports = 23;
    }

    res.json({ stats });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching stats" });
  }
};
