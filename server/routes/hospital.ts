import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import {
  createUser,
  createHospital,
  getHospitalByUserId,
  getHospitalById,
  getAllHospitals,
  updateHospital,
  getUserByEmail,
  getUserByUsername,
  verifyPassword,
  User,
  Hospital,
} from "../database";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface CreateHospitalRequest {
  email: string;
  password: string;
  hospital_name: string;
  address?: string;
  address_lane1?: string;
  address_lane2?: string;
  state?: string;
  district?: string;
  pin_code?: string;
  phone_number?: string;
  hospital_type?: "General" | "Specialty" | "Private" | "Government" | "Other";
  license_number?: string;
  number_of_ambulances?: number;
  number_of_beds?: number;
  departments?: string;
  google_map_enabled?: boolean;
  google_map_link?: string;
  full_name: string;
}

interface UpdateHospitalRequest {
  hospital_name?: string;
  address?: string;
  phone_number?: string;
  hospital_type?: string;
  license_number?: string;
  number_of_ambulances?: number;
  number_of_beds?: number;
  departments?: string;
  google_map_enabled?: boolean;
  google_map_link?: string;
}

// Admin creates hospital account
export const handleCreateHospital: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      password,
      hospital_name,
      address,
      address_lane1,
      address_lane2,
      state,
      district,
      pin_code,
      phone_number,
      hospital_type,
      license_number,
      number_of_ambulances,
      number_of_beds,
      departments,
      google_map_enabled,
      google_map_link,
      full_name,
    }: CreateHospitalRequest = req.body;

    // Validate required fields
    if (
      !email ||
      !password ||
      !hospital_name ||
      !full_name ||
      !address_lane1 ||
      !state ||
      !district ||
      !pin_code
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: email, password, hospital_name, address_lane1, state, district, pin_code, full_name",
      });
    }

    if (!/^\d{6}$/.test(pin_code)) {
      return res
        .status(400)
        .json({ error: "PIN code must be a valid 6-digit number" });
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Check if license number already exists if provided
    if (license_number) {
      const allHospitals = getAllHospitals();
      const licenseExists = allHospitals.some(
        (h) => h.license_number === license_number,
      );
      if (licenseExists) {
        return res.status(409).json({ error: "License number already in use" });
      }
    }

    // Auto-generate unique username from email/hospital name
    const base =
      (email?.split("@")[0] || hospital_name || "hospital")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 20) || "hospital";
    let generated = base;
    let suffix = 1;
    while (getUserByUsername(generated)) {
      generated = `${base}${suffix}`;
      suffix += 1;
      if (suffix > 9999) break;
    }

    // Create user account for hospital
    const user: User = {
      username: generated,
      email,
      password,
      role: "hospital",
      full_name,
    };

    const userId = await createUser(user);
    console.log(`✅ Hospital user created: ${email} - ID: ${userId}`);

    // Create hospital record
    const hospital: Hospital = {
      user_id: userId,
      hospital_name,
      address:
        `${address_lane1}${address_lane2 ? ", " + address_lane2 : ""}, ${district}, ${state} ${pin_code || ""}`.trim(),
      address_lane1,
      address_lane2,
      state,
      district,
      pin_code,
      phone_number,
      hospital_type,
      license_number,
      number_of_ambulances,
      number_of_beds,
      departments,
      google_map_enabled: google_map_enabled || false,
      google_map_link: google_map_enabled ? google_map_link : null,
    };

    const hospitalId = createHospital(hospital);
    console.log(`✅ Hospital created: ${hospital_name} - ID: ${hospitalId}`);

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { userId, email, role: "hospital", full_name, hospitalId },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(201).json({
      message: "Hospital account created successfully",
      token,
      hospital: {
        id: hospitalId,
        user_id: userId,
        hospital_name,
        address,
        email,
      },
    });
  } catch (error: any) {
    console.error("❌ Error creating hospital:", error);
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
};

// Hospital login
export const handleHospitalLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user is a hospital
    if (user.role !== "hospital") {
      return res
        .status(401)
        .json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if account is suspended
    if (user.status === "suspended") {
      return res.status(403).json({
        error: "This hospital account has been suspended by the administrator.",
        status: "suspended",
      });
    }

    // Get hospital details
    const hospital = getHospitalByUserId(user.id);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital details not found" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        hospitalId: hospital.id,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Hospital login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      hospital: {
        id: hospital.id,
        hospital_name: hospital.hospital_name,
        address: hospital.address,
      },
    });
  } catch (error) {
    console.error("❌ Hospital login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
};

// Get hospital details
export const handleGetHospital: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hospital = getHospitalByUserId(userId);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    res.json({ hospital });
  } catch (error) {
    console.error("❌ Error getting hospital:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all hospitals (admin only)
export const handleGetAllHospitals: RequestHandler = async (req, res) => {
  try {
    const hospitals = getAllHospitals();
    res.json({ hospitals });
  } catch (error) {
    console.error("❌ Error getting hospitals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update hospital (admin or hospital user)
export const handleUpdateHospital: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const updates: UpdateHospitalRequest = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const success = updateHospital(userId, updates as any);
    if (!success) {
      return res
        .status(400)
        .json({ error: "No updates provided or hospital not found" });
    }

    const hospital = getHospitalByUserId(userId);
    res.json({ message: "Hospital updated successfully", hospital });
  } catch (error) {
    console.error("❌ Error updating hospital:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Admin update by hospital id
export const handleAdminUpdateHospital: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const hospitalId = parseInt(req.params.id, 10);
    const updates: UpdateHospitalRequest = req.body;
    if (Number.isNaN(hospitalId)) {
      return res.status(400).json({ error: "Invalid hospital id" });
    }

    // Find hospital by id
    const hospital = getHospitalById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    // Use existing update logic but target by user_id
    const success = updateHospital(hospital.user_id, updates as any);
    if (!success) {
      return res
        .status(400)
        .json({ error: "No updates provided or hospital not updated" });
    }

    const updated = getHospitalById(hospitalId);
    res.json({ message: "Hospital updated by admin", hospital: updated });
  } catch (error) {
    console.error("❌ Error in admin update hospital:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
