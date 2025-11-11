import { createUser, getUserByEmail } from "./database";

/**
 * Initialize a default admin user if ADMIN_EMAIL and ADMIN_PASSWORD env vars are provided.
 * This function will NOT log plaintext passwords. If env vars are missing, admin creation is skipped.
 */
export async function initializeAdmin(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "";
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminEmail || !adminPassword) {
      console.log(
        "ℹ️ ADMIN_EMAIL or ADMIN_PASSWORD not set - skipping default admin creation",
      );
      return;
    }

    // Check if admin already exists
    const existingAdmin = await getUserByEmail(adminEmail);

    if (!existingAdmin) {
      // Create the admin user. createUser handles password hashing.
      const username = adminEmail.split("@")[0];
      const adminUser = {
        username,
        email: adminEmail,
        password: adminPassword,
        role: "admin" as const,
        full_name: "System Administrator",
        phone: null,
      };

      const adminId = await createUser(adminUser);
      console.log("✅ Default admin user created successfully");
      console.log(`📧 Admin Email: ${adminEmail}`);
      console.log(`👤 Admin ID: ${adminId}`);
      console.log(
        "🔐 Admin password has been set from environment variables and is NOT logged for security.",
      );
    } else {
      console.log("ℹ️ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error initializing admin:", error);
  }
}

// Function to check if signup as admin should be allowed
export function isAdminSignupAllowed(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || "";
  // Only allow signup if ADMIN_EMAIL is configured and matches the requested admin email
  if (!adminEmail) return false;
  return email === adminEmail;
}
