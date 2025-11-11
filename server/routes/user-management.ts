import { RequestHandler } from "express";
import {
  getAllUsers,
  getUsersByRole,
  suspendUser,
  reactivateUser,
  deleteUser,
  suspendAdminById,
  reactivateAdminById,
  deleteAdminById,
  createUser,
  createDoctor,
  getUserByEmail,
  getUserByPhone,
  getAdminUsers,
  getUserById,
  updateUserPasswordById,
} from "../database";
import bcrypt from "bcryptjs";

// Get all users (admin only)
export const handleGetAllUsers: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;

    // Only admin can access user management
    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    const users = getAllUsers();

    res.json({
      users,
      total: users.length,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching users" });
  }
};

// Get users by role (admin only)
export const handleGetUsersByRole: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    const { userRole } = req.params;

    // Only admin can access user management
    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    // Validate role parameter
    const validRoles = ["doctor", "customer", "staff"];
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const users = getUsersByRole(userRole);

    res.json({
      users,
      total: users.length,
      role: userRole,
      message: `${userRole}s retrieved successfully`,
    });
  } catch (error) {
    console.error("Get users by role error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching users" });
  }
};

// Get admin users (admin only)
export const handleGetAdminUsers: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }
    const users = getAdminUsers();
    res.json({
      users,
      total: users.length,
      message: "Admins retrieved successfully",
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching admins" });
  }
};

// Promote an admin user to system admin (system admins only)
export const handlePromoteToSystemAdmin: RequestHandler = async (req, res) => {
  try {
    const caller = (req as any).user;
    const { role: callerRole, email: callerEmail } = caller || {};

    // Must be an admin to perform this action
    if (callerRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    // Ensure caller is a system admin
    const callerUser = getUserByEmail(callerEmail);
    if (!callerUser || callerUser.admin_type !== "system") {
      return res
        .status(403)
        .json({
          error:
            "Only system administrators can promote other admins to system level.",
        });
    }

    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Target email is required" });
    }

    const targetUser = getUserByEmail(email);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    if (targetUser.role !== "admin") {
      return res.status(400).json({ error: "Target user is not an admin" });
    }

    const ok = setAdminTypeByEmail(email, "system");
    if (!ok) {
      return res.status(500).json({ error: "Failed to promote user" });
    }

    res.json({ message: "User promoted to system admin successfully", email });
  } catch (error) {
    console.error("Promote to system admin error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while promoting user" });
  }
};

// Admin set user password (no current password required)
export const handleAdminSetUserPassword: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    const { userId } = req.params;
    const { newPassword, confirmPassword } = req.body || {};

    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    const id = parseInt(userId);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const user = getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ok = await updateUserPasswordById(id, newPassword);
    if (!ok) {
      return res.status(500).json({ error: "Failed to update password" });
    }

    res.json({ message: "Password updated successfully", userId: id });
  } catch (error) {
    console.error("Admin set user password error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while updating password" });
  }
};

// Suspend user (admin only)
export const handleSuspendUser: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    const { userId } = req.params;

    // Only admin can suspend users
    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const targetUser = getUserById(userIdNum);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // If target is an admin, only system admins can suspend state admins
    if (targetUser.role === "admin") {
      const caller = (req as any).user;
      const callerUser = getUserByEmail(caller.email);
      if (!callerUser || callerUser.admin_type !== "system") {
        return res
          .status(403)
          .json({ error: "Only system admins can suspend admin accounts" });
      }

      // Only allow suspending state-level admins, not system admins
      if (targetUser.admin_type === "system") {
        return res
          .status(403)
          .json({ error: "Cannot suspend system administrator" });
      }

      const success = await suspendAdminById(userIdNum);
      if (success) {
        return res.json({
          message: "Admin suspended successfully",
          userId: userIdNum,
          action: "suspended",
        });
      }

      return res.status(500).json({ error: "Failed to suspend admin user" });
    }

    // Non-admin users follow regular flow
    const success = await suspendUser(userIdNum);

    if (success) {
      res.json({
        message: "User suspended successfully",
        userId: userIdNum,
        action: "suspended",
      });
    } else {
      res.status(500).json({ error: "Failed to suspend user" });
    }
  } catch (error) {
    console.error("Suspend user error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while suspending user" });
  }
};

// Reactivate user (admin only)
export const handleReactivateUser: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    const { userId } = req.params;

    // Only admin can reactivate users
    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const targetUser = getUserById(userIdNum);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // If target is an admin, only system admins can reactivate state admins
    if (targetUser.role === "admin") {
      const caller = (req as any).user;
      const callerUser = getUserByEmail(caller.email);
      if (!callerUser || callerUser.admin_type !== "system") {
        return res
          .status(403)
          .json({ error: "Only system admins can reactivate admin accounts" });
      }

      // Only allow reactivating state-level admins, not system admins
      if (targetUser.admin_type === "system") {
        return res
          .status(403)
          .json({ error: "Cannot reactivate system administrator" });
      }

      const success = await reactivateAdminById(userIdNum);
      if (success) {
        return res.json({
          message: "Admin reactivated successfully",
          userId: userIdNum,
          action: "reactivated",
        });
      }

      return res.status(500).json({ error: "Failed to reactivate admin user" });
    }

    const success = await reactivateUser(userIdNum);

    if (success) {
      res.json({
        message: "User reactivated successfully",
        userId: userIdNum,
        action: "reactivated",
      });
    } else {
      res.status(500).json({ error: "Failed to reactivate user" });
    }
  } catch (error) {
    console.error("Reactivate user error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while reactivating user" });
  }
};

// Delete user (admin only)
export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    const { userId } = req.params;

    // Only admin can delete users
    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const targetUser = getUserById(userIdNum);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // If target is an admin, only system admins can delete state admins
    if (targetUser.role === "admin") {
      const caller = (req as any).user;
      const callerUser = getUserByEmail(caller.email);
      if (!callerUser || callerUser.admin_type !== "system") {
        return res
          .status(403)
          .json({ error: "Only system admins can delete admin accounts" });
      }

      // Prevent deleting system admins
      if (targetUser.admin_type === "system") {
        return res
          .status(403)
          .json({ error: "Cannot delete system administrator" });
      }

      const success = await deleteAdminById(userIdNum);
      if (success) {
        return res.json({
          message: "Admin deleted successfully",
          userId: userIdNum,
          action: "deleted",
        });
      }

      return res.status(500).json({ error: "Failed to delete admin user" });
    }

    const success = await deleteUser(userIdNum);

    if (success) {
      res.json({
        message: "User deleted successfully",
        userId: userIdNum,
        action: "deleted",
      });
    } else {
      res.status(500).json({ error: "Failed to delete user" });
    }
  } catch (error) {
    console.error("Delete user error:", error);
    if (error.message === "Cannot delete admin user") {
      res.status(403).json({ error: "Cannot delete admin user" });
    } else {
      res
        .status(500)
        .json({ error: "Internal server error while deleting user" });
    }
  }
};

// Add doctor directly (admin only)
export const handleAddDoctor: RequestHandler = async (req, res) => {
  try {
    console.log("🩺 Add doctor request received");
    const { role } = (req as any).user;
    console.log(`👤 User role: ${role}`);

    // Only admin can add doctors directly
    if (role !== "admin") {
      console.log("❌ Unauthorized: Only admin can add doctors");
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    const {
      full_name,
      email,
      password,
      phone,
      specialization,
      experience_years,
      consultation_fee,
      available_days,
      bio,
    } = req.body;

    console.log("📝 Request data:", {
      full_name,
      email,
      phone,
      specialization,
    });

    // Validate required fields
    if (!full_name || !email || !password) {
      console.log("❌ Validation failed: Missing required fields");
      return res.status(400).json({
        error: "Full name, email, and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    // Validate mobile number format if provided
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          error: "Mobile number must be exactly 10 digits",
          message: "Mobile number must be exactly 10 digits",
        });
      }
    }

    // Check for duplicate email across all users
    console.log("🔍 Checking for duplicate email...");
    const existingUserByEmail = getUserByEmail(email);
    if (existingUserByEmail) {
      console.log(`❌ Email already exists: ${email}`);
      const errorResponse = {
        error: "Mobile or Email already in use",
        message: "Mobile or Email already in use",
      };
      console.log("📤 Sending response:", JSON.stringify(errorResponse));
      return res.status(400).json(errorResponse);
    }

    // Check for duplicate phone number if provided
    if (phone) {
      console.log("🔍 Checking for duplicate phone...");
      const existingUserByPhone = getUserByPhone(phone);
      if (existingUserByPhone) {
        console.log(`❌ Phone already exists: ${phone}`);
        const errorResponse = {
          error: "Mobile or Email already in use",
          message: "Mobile or Email already in use",
        };
        console.log("📤 Sending response:", JSON.stringify(errorResponse));
        return res.status(400).json(errorResponse);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      console.log("🔐 Creating user account...");
      // Create user with active status (no approval needed for admin-created doctors)
      const newUserId = await createUser({
        username: email.split("@")[0], // Generate username from email
        email,
        password: hashedPassword,
        role: "doctor",
        full_name,
        phone: phone || undefined,
      });

      console.log(
        `✅ Admin created new doctor user: ${full_name} (${email}) - ID: ${newUserId}`,
      );

      // Create doctor profile in doctors table
      console.log("🩺 Creating doctor profile...");
      const doctorId = createDoctor({
        user_id: newUserId,
        specialization: specialization || null,
        experience_years: experience_years
          ? parseInt(experience_years.toString())
          : null,
        consultation_fee: consultation_fee
          ? parseFloat(consultation_fee.toString())
          : null,
        available_days: available_days || null,
      });

      console.log(`✅ Doctor profile created - Doctor ID: ${doctorId}`);

      res.status(201).json({
        message: `Doctor ${full_name} has been successfully added and activated`,
        doctor: {
          id: newUserId,
          doctor_id: doctorId,
          full_name,
          email,
          phone,
          specialization,
          experience_years,
          consultation_fee,
          available_days,
          status: "active",
        },
      });
    } catch (dbError: any) {
      console.error("Database error creating doctor:", dbError);

      if (
        dbError.message &&
        dbError.message.includes("UNIQUE constraint failed")
      ) {
        if (
          dbError.message.includes("username") ||
          dbError.message.includes("email") ||
          dbError.message.includes("phone")
        ) {
          return res.status(400).json({
            error: "Mobile or Email already in use",
          });
        }
      }

      res.status(500).json({
        error: "Failed to create doctor account",
      });
    }
  } catch (error) {
    console.error("Add doctor error:", error);
    res.status(500).json({
      error: "Internal server error while adding doctor",
    });
  }
};
