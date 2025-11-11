import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import {
  createUser,
  createCustomer,
  createDoctor,
  getUserByEmail,
  getUserByPhone,
  verifyPassword,
  updateUserPassword,
  createPendingRegistration,
  getPendingRegistrationByEmail,
  createPasswordReset,
  getPasswordResetByToken,
  deletePasswordReset,
  User,
  Customer,
  Doctor,
  PendingRegistration,
} from "../database";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { isAdminSignupAllowed } from "../admin-init";

// Simple in-memory rate limiter for forgot-password to prevent abuse
// Limits: maxAttempts per windowMs per key (IP or email)
const rateLimitStore = new Map<string, { count: number; first: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry) {
    rateLimitStore.set(key, { count: 1, first: now });
    return false;
  }

  if (now - entry.first > RATE_LIMIT_WINDOW_MS) {
    // Reset window
    rateLimitStore.set(key, { count: 1, first: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count += 1;
  rateLimitStore.set(key, entry);
  return false;
}

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: "admin" | "doctor" | "customer" | "staff";
  full_name: string;
  phone?: string;
  // Customer specific fields
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  blood_group?: string;
  address?: string;
  signup_lat?: string;
  signup_lng?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  allergies?: string;
  medical_conditions?: string;
  current_medications?: string;
  insurance?: string;
  insurance_policy_number?: string;
  occupation?: string;
  // Doctor specific fields
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
  available_time_start?: string;
  available_time_end?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      full_name,
      phone,
      // Customer fields
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact,
      emergency_contact_name,
      emergency_contact_relation,
      allergies,
      medical_conditions,
      current_medications,
      insurance,
      insurance_policy_number,
      occupation,
      // Doctor fields
      specialization,
      license_number,
      experience_years,
      consultation_fee,
      available_days,
      available_time_start,
      available_time_end,
    }: RegisterRequest = req.body;

    // Validate required fields
    if (!username || !email || !password || !role || !full_name) {
      return res.status(400).json({
        error:
          "Missing required fields: username, email, password, role, full_name",
      });
    }

    // Restrict admin signup
    if (role === "admin" && !isAdminSignupAllowed(email)) {
      return res.status(403).json({
        error:
          "Admin registration is restricted. Only the system administrator can have admin access.",
      });
    }

    // Validate mobile number format if provided
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          error: "Mobile number must be exactly 10 digits",
        });
      }
    }

    // Check if user already exists by email
    console.log(`📧 Registration attempt for email: ${email}`);
    const existingUser = await getUserByEmail(email);
    console.log(
      `🔍 Existing user check result:`,
      existingUser ? "FOUND" : "NOT_FOUND",
    );

    if (existingUser) {
      console.log(`❌ Registration blocked - email exists: ${email}`);
      return res.status(409).json({ error: "Mobile or Email already in use" });
    }

    // Check if phone number already exists (if provided)
    if (phone) {
      console.log(`📱 Checking phone number: ${phone}`);
      const existingUserByPhone = await getUserByPhone(phone);
      console.log(
        `🔍 Phone check result:`,
        existingUserByPhone ? "FOUND" : "NOT_FOUND",
      );

      if (existingUserByPhone) {
        console.log(`❌ Registration blocked - phone exists: ${phone}`);
        return res
          .status(409)
          .json({ error: "Mobile or Email already in use" });
      }
    }

    console.log(`✅ Email available, proceeding with registration: ${email}`);

    // Handle role-specific registration
    if (role === "doctor" || role === "staff") {
      try {
        // Create pending registration for admin approval
        const pendingRegistration: PendingRegistration = {
          username,
          email,
          password,
          role,
          full_name,
          phone,
          // Doctor specific fields
          specialization,
          license_number,
          experience_years,
          consultation_fee,
          available_days,
          available_time_start,
          available_time_end,
          // Staff specific fields (if needed in future)
          department: role === "staff" ? "General" : undefined,
          employee_id: role === "staff" ? `EMP${Date.now()}` : undefined,
        };

        console.log(
          `📝 Attempting to create pending registration for: ${email}`,
        );
        const pendingId = await createPendingRegistration(pendingRegistration);
        console.log(`✅ Pending registration created with ID: ${pendingId}`);

        res.status(201).json({
          message: `Registration request submitted successfully. Your ${role} account will be activated after admin approval.`,
          pendingId,
          requiresApproval: true,
          role,
        });
      } catch (pendingError) {
        console.error("❌ Error creating pending registration:", pendingError);
        return res.status(500).json({
          error:
            "Failed to create pending registration: " + pendingError.message,
        });
      }
    } else if (role === "customer") {
      // Direct registration for customers (as before)
      const user: User = {
        username,
        email,
        password,
        role,
        full_name,
        phone,
      };

      const userId = await createUser(user);

      // Create customer record
      const customer: any = {
        user_id: userId,
        date_of_birth,
        gender,
        blood_group,
        address,
        // include signup coords when provided
        signup_lat: (req.body as any).signup_lat || null,
        signup_lng: (req.body as any).signup_lng || null,
        emergency_contact,
        emergency_contact_name,
        emergency_contact_relation,
        allergies,
        medical_conditions,
        current_medications,
        insurance,
        insurance_policy_number,
        occupation,
      };
      createCustomer(customer);

      // Generate JWT token for immediate login
      const token = jwt.sign({ userId, email, role, full_name }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        message: "Customer registered successfully",
        token,
        user: {
          id: userId,
          username,
          email,
          role,
          full_name,
          phone,
        },
      });
    }
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      if (error.message.includes("username")) {
        return res.status(409).json({ error: "Username already exists" });
      } else if (error.message.includes("email")) {
        return res
          .status(409)
          .json({ error: "Mobile or Email already in use" });
      }
    }

    res
      .status(500)
      .json({ error: "Internal server error during registration" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      // Check if it's a pending registration
      const pendingRegistration = getPendingRegistrationByEmail(email);
      if (pendingRegistration) {
        if (pendingRegistration.status === "pending") {
          return res.status(403).json({
            error:
              "Your account is pending admin approval. Please wait for approval before signing in.",
            status: "pending_approval",
          });
        } else if (pendingRegistration.status === "rejected") {
          return res.status(403).json({
            error: "Your registration request was rejected by admin.",
            status: "rejected",
          });
        }
      }
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password FIRST - before checking suspension status
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user account is suspended (AFTER password verification)
    if (user.status === "suspended") {
      return res.status(403).json({
        error:
          "Your account has been suspended by the administrator. Please contact support for assistance.",
        status: "suspended",
        type: "account_suspended",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
};

// Forgot Password Handler (email-based reset)

export const handleForgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security reasons
      return res.json({
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Ensure SMTP config exists
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.error(
        "❌ SMTP not configured - cannot send password reset email",
      );
      return res.status(500).json({
        error:
          "Password reset not configured. Please contact the administrator to enable email sending (SMTP).",
      });
    }

    // Rate-limit by IP and email
    const ip = (
      req.ip ||
      (req.headers["x-forwarded-for"] as string) ||
      ""
    ).toString();
    if (isRateLimited(`ip:${ip}`) || isRateLimited(`email:${email}`)) {
      console.warn(`⏱️ Rate limit reached for ${ip} or ${email}`);
      return res
        .status(429)
        .json({
          error: "Too many password reset requests. Please try again later.",
        });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token in DB
    await createPasswordReset(email, token, expiresAt);

    // Build reset link
    const resetLink = `${FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${token}`;

    // Send email using nodemailer
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your password",
      text: `Reset your password using the following link (valid for 1 hour): ${resetLink}`,
      html: `
      <div style="font-family: system-ui, -apple-system, Roboto, 'Segoe UI', Arial; color:#111;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#0b63c6">ML Support — Password Reset</h2>
          <p>We received a request to reset the password for your account. Click the button below to reset it. This link expires in 1 hour.</p>
          <p style="text-align:center;margin:30px 0;"><a href="${resetLink}" style="background:#0b63c6;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">Reset password</a></p>
          <p>If you did not request a password reset, you can ignore this email — your password will remain unchanged.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="font-size:12px;color:#666">If the button doesn't work, copy and paste the following link into your browser:</p>
          <p style="font-size:12px;color:#666;word-break:break-all">${resetLink}</p>
        </div>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    const mask = (e: string) => {
      const p = e.split("@");
      if (p.length !== 2) return "***";
      return p[0].slice(0, 1) + "***@" + p[1];
    };
    console.log(`✉️ Sent password reset email to: ${mask(email)}`);

    // Respond generically
    res.json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset password handler
export const handleResetPassword: RequestHandler = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and newPassword are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    const reset = getPasswordResetByToken(token);
    if (!reset) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const expiresAt = new Date(reset.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      // Cleanup expired token
      deletePasswordReset(token);
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Update password
    const updated = await updateUserPassword(reset.email, newPassword);
    if (!updated) {
      return res.status(500).json({ error: "Failed to update password" });
    }

    // Remove token
    deletePasswordReset(token);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to verify JWT token
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Check if user still exists and is not suspended
    try {
      const user = await getUserByEmail(decoded.email);
      if (!user) {
        return res.status(401).json({ error: "User account no longer exists" });
      }

      if (user.status === "suspended") {
        return res.status(403).json({
          error: "Your account has been suspended. Please contact support.",
          status: "suspended",
        });
      }

      // Add user info to request object, ensuring role is always present
      // Always use the database role as the source of truth
      (req as any).user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      };
      next();
    } catch (dbError) {
      console.error("Database error in auth middleware:", dbError);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};

// Get current user profile
export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const { email } = (req as any).user;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't send password in response
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Change password
export const handleChangePassword: RequestHandler = async (req, res) => {
  try {
    const { email } = (req as any).user;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    // Get current user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password
    const passwordUpdated = await updateUserPassword(email, newPassword);
    if (!passwordUpdated) {
      return res.status(500).json({ error: "Failed to update password" });
    }

    res.json({
      message: "Password changed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during password change" });
  }
};

// Create admin user (system admin only)
export const handleCreateAdminUser: RequestHandler = async (req, res) => {
  try {
    const { role, email: creatorEmail } = (req as any).user;

    // Only system admins can create other admins
    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only administrators can create admin users" });
    }

    const {
      full_name,
      email,
      password,
      confirmPassword,
      state,
      district,
      admin_type = "state",
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        error: "Name, Email, Password, and Confirm Password are required",
      });
    }

    // For state admins, state and district are required
    if (admin_type === "state" && (!state || !district)) {
      return res.status(400).json({
        error: "State and District are required for state admins",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match",
      });
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Create admin user
    const username = email.split("@")[0];
    const adminUser: any = {
      username,
      email,
      password,
      role: "admin",
      full_name,
      phone: null,
      admin_type: admin_type || "state",
      state: admin_type === "state" ? state : null,
      district: admin_type === "state" ? district : null,
    };

    const userId = await createUser(adminUser);

    const adminTypeLabel = admin_type === "state" ? `State Admin (${state}, ${district})` : "System Admin";
    console.log(
      `✅ New ${adminTypeLabel} created: ${email} (ID: ${userId}) by admin ${creatorEmail}`,
    );

    res.status(201).json({
      message: `${adminTypeLabel} created successfully`,
      user: {
        id: userId,
        username,
        email,
        role: "admin",
        admin_type: admin_type || "state",
        full_name,
        state: admin_type === "state" ? state : null,
        district: admin_type === "state" ? district : null,
      },
    });
  } catch (error) {
    console.error("Create admin user error:", error);

    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      if (error.message.includes("email")) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
