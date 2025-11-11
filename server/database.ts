import initSqlJs from "sql.js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";

function maskEmail(email: string) {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const [local, domain] = parts;
  const visible = local.length > 1 ? local[0] : "*";
  const maskedLocal =
    visible + "*".repeat(Math.max(1, Math.min(4, local.length - 1)));
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  const last = digits.slice(-2);
  return "****" + last;
}

// Database file path - real SQLite database file!
const DB_PATH = join(process.cwd(), "healthcare.db");

let SQL: any;
let db: any;

export async function initDatabase(): Promise<void> {
  try {
    // Initialize sql.js
    SQL = await initSqlJs();

    if (existsSync(DB_PATH)) {
      // Load existing database
      const data = readFileSync(DB_PATH);
      db = new SQL.Database(data);
      console.log("✅ SQLite database loaded from healthcare.db");
    } else {
      // Create new database
      db = new SQL.Database();
      console.log("✅ New SQLite database created: healthcare.db");
    }

    // Always ensure tables exist
    createTables();

    // Run migrations
    await runMigrations();

    saveDatabase();

    // Verify pending_registrations table exists
    try {
      const tableCheck = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='pending_registrations'",
      );
      if (tableCheck.length > 0) {
        console.log("✅ pending_registrations table verified");
      } else {
        console.log(
          "⚠️ pending_registrations table not found, creating manually...",
        );
        await createPendingRegistrationsTable();
      }
    } catch (error) {
      console.log("⚠️ Table verification failed, creating manually...");
      await createPendingRegistrationsTable();
    }
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}

// Manual table creation function
export async function createPendingRegistrationsTable(): Promise<void> {
  try {
    console.log("🔧 Creating pending_registrations table manually...");

    db.run(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        approved_by INTEGER,
        specialization TEXT,
        license_number TEXT,
        experience_years INTEGER,
        consultation_fee REAL,
        available_days TEXT,
        available_time_start TEXT,
        available_time_end TEXT,
        department TEXT,
        employee_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    saveDatabase();
    console.log("✅ pending_registrations table created successfully");
  } catch (error) {
    console.error("❌ Error creating pending_registrations table:", error);
    throw error;
  }
}

function createTables(): void {
  try {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'customer', 'staff', 'hospital')),
        full_name TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date_of_birth DATE,
        gender TEXT CHECK(gender IN ('male', 'female', 'other')),
        blood_group TEXT,
        address TEXT,
        signup_lat TEXT,
        signup_lng TEXT,
        emergency_contact TEXT,
        emergency_contact_name TEXT,
        emergency_contact_relation TEXT,
        allergies TEXT,
        medical_conditions TEXT,
        current_medications TEXT,
        insurance TEXT,
        insurance_policy_number TEXT,
        occupation TEXT,
        height INTEGER,
        weight INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Doctors table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        specialization TEXT,
        license_number TEXT UNIQUE,
        experience_years INTEGER,
        consultation_fee DECIMAL(10,2),
        available_days TEXT,
        available_time_start TIME,
        available_time_end TIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Appointments table - improved structure
    db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_user_id INTEGER NOT NULL,
        doctor_user_id INTEGER,
        appointment_date DATE NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        reason TEXT,
        symptoms TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Ambulance requests table - new table
    db.run(`
      CREATE TABLE IF NOT EXISTS ambulance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_user_id INTEGER NOT NULL,
        pickup_address TEXT NOT NULL,
        destination_address TEXT NOT NULL,
        emergency_type TEXT NOT NULL,
        customer_condition TEXT,
        contact_number TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'on_the_way', 'completed', 'cancelled', 'forwarded_to_hospital', 'hospital_accepted', 'hospital_rejected')),
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
        assigned_staff_id INTEGER,
        assigned_ambulance_id INTEGER,
        notes TEXT,
        is_read INTEGER DEFAULT 0,
        forwarded_to_hospital_id INTEGER,
        hospital_response TEXT CHECK(hospital_response IN ('pending', 'accepted', 'rejected')),
        hospital_response_notes TEXT,
        hospital_response_date DATETIME,
        customer_state TEXT,
        customer_district TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_staff_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_ambulance_id) REFERENCES hospital_ambulances (id) ON DELETE SET NULL,
        FOREIGN KEY (forwarded_to_hospital_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Pending registrations table - for doctor/staff approval
    db.run(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        approved_by INTEGER,
        specialization TEXT,
        license_number TEXT,
        experience_years INTEGER,
        consultation_fee REAL,
        available_days TEXT,
        available_time_start TEXT,
        available_time_end TEXT,
        department TEXT,
        employee_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Feedback/Complaints table - for customer feedback and complaints
    db.run(`
      CREATE TABLE IF NOT EXISTS feedback_complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('feedback', 'complaint')),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT CHECK(category IN ('service', 'facility', 'staff', 'doctor', 'billing', 'other')),
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_review', 'resolved', 'closed')),
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        admin_response TEXT,
        admin_user_id INTEGER,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (admin_user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Customer feedback on closed complaints - for rating admin response
    db.run(`
      CREATE TABLE IF NOT EXISTS complaint_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        customer_user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        feedback_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES feedback_complaints (id) ON DELETE CASCADE,
        FOREIGN KEY (customer_user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(complaint_id, customer_user_id)
      )
    `);

    // Hospitals table
    db.run(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        hospital_name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone_number TEXT,
        hospital_type TEXT CHECK(hospital_type IN ('General', 'Specialty', 'Private', 'Government', 'Other')),
        license_number TEXT UNIQUE,
        number_of_ambulances INTEGER DEFAULT 0,
        number_of_beds INTEGER DEFAULT 0,
        departments TEXT,
        google_map_enabled BOOLEAN DEFAULT 0,
        google_map_link TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Hospital service requests
    db.run(`
      CREATE TABLE IF NOT EXISTS hospital_service_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_user_id INTEGER NOT NULL,
        customer_user_id INTEGER,
        service_type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
        assigned_staff_id INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (customer_user_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_staff_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Hospital inventory
    db.run(`
      CREATE TABLE IF NOT EXISTS hospital_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_user_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit TEXT,
        reorder_level INTEGER,
        supplier TEXT,
        cost_per_unit DECIMAL(10,2),
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Hospital staff
    db.run(`
      CREATE TABLE IF NOT EXISTS hospital_staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_user_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        department TEXT,
        position TEXT,
        employee_id TEXT UNIQUE,
        salary DECIMAL(10,2),
        hire_date DATE,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'on_leave', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Hospital ambulances table
    db.run(`
      CREATE TABLE IF NOT EXISTS hospital_ambulances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_user_id INTEGER NOT NULL,
        registration_number TEXT NOT NULL UNIQUE,
        ambulance_type TEXT NOT NULL CHECK(ambulance_type IN ('Basic Life Support', 'Advanced Life Support', 'Ventilator Support')),
        model TEXT,
        manufacturer TEXT,
        registration_year INTEGER,
        driver_name TEXT,
        driver_phone TEXT,
        driver_license_number TEXT,
        equipment TEXT,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'assigned', 'maintenance', 'parked')),
        current_location TEXT,
        assigned_request_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_request_id) REFERENCES ambulance_requests (id) ON DELETE SET NULL
      )
    `);

    // Hospital reports
    db.run(`
      CREATE TABLE IF NOT EXISTS hospital_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_user_id INTEGER NOT NULL,
        report_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        data TEXT,
        generated_by INTEGER,
        generated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (generated_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Notifications table
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        related_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    console.log("✅ All SQLite tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  try {
    console.log("🔄 Running database migrations...");

    // Migration 1: Add status column to users table
    try {
      const tableInfo = db.exec("PRAGMA table_info(users)");
      const hasStatusColumn = tableInfo[0]?.values.some(
        (row) => row[1] === "status",
      );

      if (!hasStatusColumn) {
        console.log("��� Adding status column to users table...");
        db.run(
          "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended'))",
        );
        db.run("UPDATE users SET status = 'active' WHERE status IS NULL");
        console.log("✅ Status column added successfully");
      }
    } catch (error) {
      console.log("⚠️ Status column migration skipped:", error.message);
    }

    // Migration 2: Add rating column to feedback_complaints table
    try {
      const feedbackTableInfo = db.exec(
        "PRAGMA table_info(feedback_complaints)",
      );
      const hasRatingColumn = feedbackTableInfo[0]?.values.some(
        (row) => row[1] === "rating",
      );

      if (!hasRatingColumn) {
        console.log("📝 Adding rating column to feedback_complaints table...");
        db.run(
          "ALTER TABLE feedback_complaints ADD COLUMN rating INTEGER CHECK(rating >= 1 AND rating <= 5)",
        );
        console.log("✅ Rating column added successfully");
      }
    } catch (error) {
      console.log("⚠️ Rating column migration skipped:", error.message);
    }

    // Migration 3: Add address breakdown columns to hospitals table
    try {
      const hospitalTableInfo = db.exec("PRAGMA table_info(hospitals)");
      const hasAddressLane1 = hospitalTableInfo[0]?.values.some(
        (row) => row[1] === "address_lane1",
      );

      if (!hasAddressLane1) {
        console.log("📝 Adding address fields to hospitals table...");
        db.run("ALTER TABLE hospitals ADD COLUMN address_lane1 TEXT");
        db.run("ALTER TABLE hospitals ADD COLUMN address_lane2 TEXT");
        db.run("ALTER TABLE hospitals ADD COLUMN state TEXT");
        db.run("ALTER TABLE hospitals ADD COLUMN district TEXT");
        db.run("ALTER TABLE hospitals ADD COLUMN pin_code TEXT");
        console.log("✅ Address fields added successfully");
      }
    } catch (error) {
      console.log("⚠️ Address fields migration skipped:", error.message);
    }

    // Migration 4: Add state and district columns to users table (for admin state-wise filtering)
    try {
      const usersTableInfo = db.exec("PRAGMA table_info(users)");
      const hasState = usersTableInfo[0]?.values.some(
        (row) => row[1] === "state",
      );

      if (!hasState) {
        console.log("📝 Adding state and district columns to users table...");
        db.run("ALTER TABLE users ADD COLUMN state TEXT");
        db.run("ALTER TABLE users ADD COLUMN district TEXT");
        console.log("✅ State and district columns added successfully");
      }
    } catch (error) {
      console.log(
        "⚠️ State and district columns migration skipped:",
        error.message,
      );
    }

    // Migration 5: Add ambulance request forwarding columns
    try {
      const ambulanceTableInfo = db.exec(
        "PRAGMA table_info(ambulance_requests)",
      );
      const hasIsRead = ambulanceTableInfo[0]?.values.some(
        (row) => row[1] === "is_read",
      );

      if (!hasIsRead) {
        console.log(
          "📝 Adding forwarding and read tracking columns to ambulance_requests...",
        );
        db.run(
          "ALTER TABLE ambulance_requests ADD COLUMN is_read INTEGER DEFAULT 0",
        );
        db.run(
          "ALTER TABLE ambulance_requests ADD COLUMN forwarded_to_hospital_id INTEGER",
        );
        db.run(
          "ALTER TABLE ambulance_requests ADD COLUMN hospital_response TEXT",
        );
        db.run(
          "ALTER TABLE ambulance_requests ADD COLUMN hospital_response_notes TEXT",
        );
        db.run(
          "ALTER TABLE ambulance_requests ADD COLUMN hospital_response_date DATETIME",
        );
        db.run("ALTER TABLE ambulance_requests ADD COLUMN customer_state TEXT");
        db.run(
          "ALTER TABLE ambulance_requests ADD COLUMN customer_district TEXT",
        );
        console.log(
          "✅ Ambulance request forwarding columns added successfully",
        );
      }

      // Ensure status CHECK includes forwarded_to_hospital and hospital response statuses
      try {
        const tableSqlRes = db.exec(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='ambulance_requests'",
        );
        const createSql = tableSqlRes[0]?.values[0][0] || "";
        if (createSql && !createSql.includes("hospital_accepted")) {
          console.log(
            "🛠️ Updating ambulance_requests status CHECK to include forwarded statuses...",
          );

          // Recreate table with new schema including additional statuses
          db.run("BEGIN TRANSACTION");

          db.run(`
            CREATE TABLE IF NOT EXISTS ambulance_requests_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              customer_user_id INTEGER NOT NULL,
              pickup_address TEXT NOT NULL,
              destination_address TEXT NOT NULL,
              emergency_type TEXT NOT NULL,
              customer_condition TEXT,
              contact_number TEXT NOT NULL,
              status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'on_the_way', 'completed', 'cancelled', 'forwarded_to_hospital', 'hospital_accepted', 'hospital_rejected')),
              priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
              assigned_staff_id INTEGER,
              notes TEXT,
              is_read INTEGER DEFAULT 0,
              forwarded_to_hospital_id INTEGER,
              hospital_response TEXT CHECK(hospital_response IN ('pending', 'accepted', 'rejected')),
              hospital_response_notes TEXT,
              hospital_response_date DATETIME,
              customer_state TEXT,
              customer_district TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Copy existing columns that exist into the new table
          const existingInfo = db.exec("PRAGMA table_info(ambulance_requests)");
          const existingCols = (existingInfo[0]?.values || []).map(
            (r: any) => r[1],
          );

          const colsToCopy = [
            "id",
            "customer_user_id",
            "pickup_address",
            "destination_address",
            "emergency_type",
            "customer_condition",
            "contact_number",
            "status",
            "priority",
            "assigned_staff_id",
            "notes",
            "is_read",
            "forwarded_to_hospital_id",
            "hospital_response",
            "hospital_response_notes",
            "hospital_response_date",
            "customer_state",
            "customer_district",
            "created_at",
            "updated_at",
          ].filter((c) => existingCols.includes(c));

          if (colsToCopy.length > 0) {
            db.run(`
              INSERT INTO ambulance_requests_new (${colsToCopy.join(",")})
              SELECT ${colsToCopy.join(",")} FROM ambulance_requests;
            `);
          }

          db.run("DROP TABLE ambulance_requests");
          db.run(
            "ALTER TABLE ambulance_requests_new RENAME TO ambulance_requests",
          );

          db.run("COMMIT");

          console.log("✅ ambulance_requests table updated successfully");
        }
      } catch (innerErr) {
        console.log(
          "⚠️ Could not update ambulance_requests status CHECK:",
          innerErr.message,
        );
      }
    } catch (error) {
      console.log(
        "⚠️ Ambulance request columns migration skipped:",
        error.message,
      );
    }

    // Migration 6: Add admin_type column to users table
    try {
      const usersTableInfo = db.exec("PRAGMA table_info(users)");
      const hasAdminType = usersTableInfo[0]?.values.some(
        (row) => row[1] === "admin_type",
      );

      if (!hasAdminType) {
        console.log("📝 Adding admin_type column to users table...");
        db.run(
          "ALTER TABLE users ADD COLUMN admin_type TEXT DEFAULT 'system' CHECK(admin_type IN ('system', 'state'))",
        );
        console.log("✅ admin_type column added successfully");
      }
    } catch (error) {
      console.log("⚠️ admin_type column migration skipped:", error.message);
    }

    // Migration 7: Add signup_lat and signup_lng columns to customers table
    try {
      const customersTableInfo = db.exec("PRAGMA table_info(customers)");
      const hasSignupLat = customersTableInfo[0]?.values.some(
        (row) => row[1] === "signup_lat",
      );

      if (!hasSignupLat) {
        console.log(
          "📝 Adding signup_lat and signup_lng columns to customers table...",
        );
        db.run("ALTER TABLE customers ADD COLUMN signup_lat TEXT");
        db.run("ALTER TABLE customers ADD COLUMN signup_lng TEXT");
        console.log("✅ Signup location columns added successfully");
      }
    } catch (error) {
      console.log(
        "⚠️ Signup location columns migration skipped:",
        error.message,
      );
    }

    // Migration 8: Add assigned_ambulance_id column to ambulance_requests table
    try {
      const ambulanceTableInfo = db.exec(
        "PRAGMA table_info(ambulance_requests)",
      );
      const hasAssignedAmbulanceId = ambulanceTableInfo[0]?.values.some(
        (row) => row[1] === "assigned_ambulance_id",
      );

      if (!hasAssignedAmbulanceId) {
        console.log(
          "📝 Adding assigned_ambulance_id column to ambulance_requests table...",
        );
        db.run(
          "ALTER TABLE ambulance_requests ADD COLUMN assigned_ambulance_id INTEGER",
        );
        console.log("✅ assigned_ambulance_id column added successfully");
      }
    } catch (error) {
      console.log(
        "⚠️ assigned_ambulance_id column migration skipped:",
        error.message,
      );
    }

    console.log("🔄 All migrations completed");
  } catch (error) {
    console.error("❌ Error running migrations:", error);
  }
}

export function saveDatabase(): void {
  try {
    const data = db.export();
    writeFileSync(DB_PATH, data);
    console.log("💾 Database saved to healthcare.db");
  } catch (error) {
    console.error("❌ Error saving database:", error);
  }
}

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: "admin" | "doctor" | "customer" | "staff";
  full_name: string;
  phone?: string;
  admin_type?: "system" | "state";
  state?: string;
  district?: string;
  created_at?: string;
}

export interface Customer {
  id?: number;
  user_id: number;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  blood_group?: string;
  address?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  allergies?: string;
  medical_conditions?: string;
  current_medications?: string;
  insurance?: string;
  insurance_policy_number?: string;
  occupation?: string;
  height?: number;
  weight?: number;
  created_at?: string;
}

export interface Doctor {
  id?: number;
  user_id: number;
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
  available_time_start?: string;
  available_time_end?: string;
  created_at?: string;
}

export interface Hospital {
  id?: number;
  user_id: number;
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
  status?: "active" | "suspended";
  created_at?: string;
}

export interface PendingRegistration {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: "doctor" | "staff";
  full_name: string;
  phone?: string;
  status?: "pending" | "approved" | "rejected";
  admin_notes?: string;
  approved_by?: number;

  // Doctor specific fields
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
  available_time_start?: string;
  available_time_end?: string;

  // Staff specific fields
  department?: string;
  employee_id?: string;

  created_at?: string;
}

// User operations
export async function createUser(user: User): Promise<number> {
  try {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    console.log(`👤 Creating user: ${maskEmail(user.email)} (${user.role})`);

    // Use db.run for INSERT statements
    db.run(
      `
      INSERT INTO users (username, email, password, role, full_name, phone, admin_type, state, district, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        user.username,
        user.email,
        hashedPassword,
        user.role,
        user.full_name,
        user.phone || null,
        user.admin_type || "system",
        user.state || null,
        user.district || null,
      ],
    );

    // Get the last inserted ID
    const result = db.exec("SELECT last_insert_rowid() as id");
    const userId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ User created in SQLite: ${maskEmail(user.email)} (${user.role}) - ID: ${userId}`,
    );

    return userId as number;
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw error;
  }
}

export function getUserByEmail(email: string): User | undefined {
  try {
    console.log(`🔍 Checking email: ${maskEmail(email)}`);

    if (!db) {
      console.log("❌ Database not initialized");
      return undefined;
    }

    // Use exec instead of prepare for sql.js
    const result = db.exec("SELECT * FROM users WHERE email = ?", [email]);

    console.log(
      "🔍 Query executed for email, rows:",
      result && result[0] && result[0].values ? result[0].values.length : 0,
    );

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      console.log(`✅ Email ${maskEmail(email)} is available`);
      return undefined;
    }

    // Convert array result to object
    const columns = result[0].columns;
    const row = result[0].values[0];

    const user: any = {};
    columns.forEach((col, index) => {
      user[col] = row[index];
    });

    console.log(`⚠️ Email ${maskEmail(email)} already exists (id=${user.id})`);
    return user as User;
  } catch (error) {
    console.error("❌ Error getting user by email:", error);
    // Return undefined if error - assume email is available
    return undefined;
  }
}

export function getUserByPhone(phone: string): User | undefined {
  try {
    console.log(`🔍 Checking phone: ${maskPhone(phone)}`);

    if (!db) {
      console.log("❌ Database not initialized");
      return undefined;
    }

    // Use exec instead of prepare for sql.js
    const result = db.exec("SELECT * FROM users WHERE phone = ?", [phone]);

    console.log(
      "🔍 Phone query executed, rows:",
      result && result[0] && result[0].values ? result[0].values.length : 0,
    );

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      console.log(`✅ Phone ${maskPhone(phone)} is available`);
      return undefined;
    }

    // Convert array result to object
    const columns = result[0].columns;
    const row = result[0].values[0];

    const user: any = {};
    columns.forEach((col, index) => {
      user[col] = row[index];
    });

    console.log(`⚠️ Phone ${maskPhone(phone)} already exists (id=${user.id})`);
    return user as User;
  } catch (error) {
    console.error("❌ Error getting user by phone:", error);
    // Return undefined if error - assume phone is available
    return undefined;
  }
}

export function getUserByUsername(username: string): User | undefined {
  try {
    console.log(`�� Checking username: ${username}`);

    if (!db) {
      console.log("❌ Database not initialized");
      return undefined;
    }

    const result = db.exec("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      console.log(`✅ Username ${username} is available`);
      return undefined;
    }

    // Convert array result to object
    const columns = result[0].columns;
    const row = result[0].values[0];

    const user: any = {};
    columns.forEach((col, index) => {
      user[col] = row[index];
    });

    console.log(`⚠️ Username ${username} already exists`);
    return user as User;
  } catch (error) {
    console.error("❌ Error getting user by username:", error);
    return undefined;
  }
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("❌ Error verifying password:", error);
    return false;
  }
}

export async function updateUserPassword(
  email: string,
  newPassword: string,
): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`🔒 Updating password for user: ${maskEmail(email)}`);

    db.run(
      `
      UPDATE users
      SET password = ?, updated_at = datetime('now')
      WHERE email = ?
    `,
      [hashedPassword, email],
    );

    console.log(`✅ Password updated successfully for: ${maskEmail(email)}`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error updating password:", error);
    return false;
  }
}

// Customer operations
export function createCustomer(customer: Customer): number {
  try {
    const stmt = db.prepare(`
      INSERT INTO customers (
        user_id, date_of_birth, gender, blood_group, address, signup_lat, signup_lng,
        emergency_contact, emergency_contact_name, emergency_contact_relation,
        allergies, medical_conditions, current_medications, insurance,
        insurance_policy_number, occupation, height, weight
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      customer.user_id,
      customer.date_of_birth || null,
      customer.gender || null,
      customer.blood_group || null,
      customer.address || null,
      (customer as any).signup_lat || null,
      (customer as any).signup_lng || null,
      customer.emergency_contact || null,
      customer.emergency_contact_name || null,
      customer.emergency_contact_relation || null,
      customer.allergies || null,
      customer.medical_conditions || null,
      customer.current_medications || null,
      customer.insurance || null,
      customer.insurance_policy_number || null,
      customer.occupation || null,
      customer.height || null,
      customer.weight || null,
    ]);

    const result = db.exec("SELECT last_insert_rowid() as id");
    const customerId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ Customer created in SQLite for user_id: ${customer.user_id} - ID: ${customerId}`,
    );

    return customerId as number;
  } catch (error) {
    console.error("❌ Error creating customer:", error);
    throw error;
  }
}

// Doctor operations
export function createDoctor(doctor: Doctor): number {
  try {
    const stmt = db.prepare(`
      INSERT INTO doctors (
        user_id, specialization, license_number, experience_years,
        consultation_fee, available_days, available_time_start, 
        available_time_end, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run([
      doctor.user_id,
      doctor.specialization || null,
      doctor.license_number || null,
      doctor.experience_years || null,
      doctor.consultation_fee || null,
      doctor.available_days || null,
      doctor.available_time_start || null,
      doctor.available_time_end || null,
    ]);

    const result = db.exec("SELECT last_insert_rowid() as id");
    const doctorId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ Doctor created in SQLite for user_id: ${doctor.user_id} - ID: ${doctorId}`,
    );

    return doctorId as number;
  } catch (error) {
    console.error("❌ Error creating doctor:", error);
    throw error;
  }
}

// Get all customers (for doctors/admin)
export function getAllCustomers(): any[] {
  try {
    const result = db.exec(`
      SELECT
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        c.date_of_birth,
        c.gender,
        c.blood_group,
        c.address,
        c.medical_conditions,
        c.height,
        c.weight,
        c.created_at
      FROM users u
      JOIN customers c ON u.id = c.user_id
      ORDER BY u.full_name
    `);

    if (result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    const customers = rows.map((row) => {
      const customer: any = {};
      columns.forEach((col, index) => {
        customer[col] = row[index];
      });
      return customer;
    });

    console.log(`📊 Retrieved ${customers.length} customers from SQLite`);
    return customers;
  } catch (error) {
    console.error("❌ Error getting customers:", error);
    return [];
  }
}

// Get all doctors
export function getAllDoctors(): any[] {
  try {
    const result = db.exec(`
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        d.specialization,
        d.experience_years,
        d.consultation_fee,
        d.available_days
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      ORDER BY u.full_name
    `);

    if (result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    const doctors = rows.map((row) => {
      const doctor: any = {};
      columns.forEach((col, index) => {
        doctor[col] = row[index];
      });
      return doctor;
    });

    console.log(`📊 Retrieved ${doctors.length} doctors from SQLite`);
    return doctors;
  } catch (error) {
    console.error("❌ Error getting doctors:", error);
    return [];
  }
}

// Get database stats
export function getDatabaseStats() {
  try {
    const userCount = db.exec("SELECT COUNT(*) as count FROM users")[0]
      .values[0][0];
    const customerCount = db.exec("SELECT COUNT(*) as count FROM customers")[0]
      .values[0][0];
    const doctorCount = db.exec("SELECT COUNT(*) as count FROM doctors")[0]
      .values[0][0];
    const appointmentCount = db.exec(
      "SELECT COUNT(*) as count FROM appointments",
    )[0].values[0][0];

    return {
      users: userCount,
      customers: customerCount,
      doctors: doctorCount,
      appointments: appointmentCount,
    };
  } catch (error) {
    console.error("❌ Error getting database stats:", error);
    return { users: 0, customers: 0, doctors: 0, appointments: 0 };
  }
}

// Pending registration operations
export async function createPendingRegistration(
  registration: PendingRegistration,
): Promise<number> {
  try {
    const hashedPassword = await bcrypt.hash(registration.password, 10);

    console.log(
      `📝 Creating pending registration: ${maskEmail(registration.email)} (${registration.role})`,
    );

    // Simplified insert without datetime('now') for better compatibility
    db.run(
      `
      INSERT INTO pending_registrations (
        username, email, password, role, full_name, phone,
        specialization, license_number, experience_years, consultation_fee,
        available_days, available_time_start, available_time_end,
        department, employee_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        registration.username,
        registration.email,
        hashedPassword,
        registration.role,
        registration.full_name,
        registration.phone || null,
        registration.specialization || null,
        registration.license_number || null,
        registration.experience_years || null,
        registration.consultation_fee || null,
        registration.available_days || null,
        registration.available_time_start || null,
        registration.available_time_end || null,
        registration.department || null,
        registration.employee_id || null,
      ],
    );

    const result = db.exec("SELECT last_insert_rowid() as id");
    const pendingId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ Pending registration created: ${maskEmail(registration.email)} - ID: ${pendingId}`,
    );

    return pendingId as number;
  } catch (error) {
    console.error("❌ Error creating pending registration:", error);
    console.error("Error details:", error.message);
    throw error;
  }
}

export function getPendingRegistrations(): any[] {
  try {
    const result = db.exec(`
      SELECT
        pr.*,
        admin.full_name as approved_by_name
      FROM pending_registrations pr
      LEFT JOIN users admin ON pr.approved_by = admin.id
      ORDER BY pr.created_at DESC
    `);

    if (result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    const registrations = rows.map((row) => {
      const registration: any = {};
      columns.forEach((col, index) => {
        registration[col] = row[index];
      });
      return registration;
    });

    console.log(`📊 Retrieved ${registrations.length} pending registrations`);
    return registrations;
  } catch (error) {
    console.error("❌ Error getting pending registrations:", error);
    return [];
  }
}

export function getPendingRegistrationByEmail(email: string): any | undefined {
  try {
    const result = db.exec(
      "SELECT * FROM pending_registrations WHERE email = ?",
      [email],
    );

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      return undefined;
    }

    const columns = result[0].columns;
    const row = result[0].values[0];

    const registration: any = {};
    columns.forEach((col, index) => {
      registration[col] = row[index];
    });

    return registration;
  } catch (error) {
    console.error("❌ Error getting pending registration by email:", error);
    return undefined;
  }
}

export async function approvePendingRegistration(
  pendingId: number,
  adminUserId: number,
  adminNotes?: string,
): Promise<boolean> {
  try {
    // Get the pending registration
    const result = db.exec("SELECT * FROM pending_registrations WHERE id = ?", [
      pendingId,
    ]);

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      throw new Error("Pending registration not found");
    }

    const columns = result[0].columns;
    const row = result[0].values[0];

    const registration: any = {};
    columns.forEach((col, index) => {
      registration[col] = row[index];
    });

    // Create user without hashing password again (already hashed)
    db.run(
      `
      INSERT INTO users (username, email, password, role, full_name, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        registration.username,
        registration.email,
        registration.password, // Already hashed
        registration.role,
        registration.full_name,
        registration.phone || null,
      ],
    );

    const userResult = db.exec("SELECT last_insert_rowid() as id");
    const userId = userResult[0].values[0][0] as number;

    // Create role-specific record
    if (registration.role === "doctor") {
      const doctor: Doctor = {
        user_id: userId,
        specialization: registration.specialization,
        license_number: registration.license_number,
        experience_years: registration.experience_years,
        consultation_fee: registration.consultation_fee,
        available_days: registration.available_days,
        available_time_start: registration.available_time_start,
        available_time_end: registration.available_time_end,
      };
      createDoctor(doctor);
    }

    // Update pending registration status
    db.run(
      `
      UPDATE pending_registrations
      SET status = 'approved', approved_by = ?, admin_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [adminUserId, adminNotes || null, pendingId],
    );

    saveDatabase();
    console.log(
      `✅ Approved registration: ${maskEmail(registration.email)} -> User ID: ${userId}`,
    );

    return true;
  } catch (error) {
    console.error("❌ Error approving registration:", error);
    throw error;
  }
}

export function rejectPendingRegistration(
  pendingId: number,
  adminUserId: number,
  adminNotes: string,
): boolean {
  try {
    db.run(
      `
      UPDATE pending_registrations
      SET status = 'rejected', approved_by = ?, admin_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [adminUserId, adminNotes, pendingId],
    );

    saveDatabase();
    console.log(`❌ Rejected registration ID: ${pendingId}`);

    return true;
  } catch (error) {
    console.error("�� Error rejecting registration:", error);
    return false;
  }
}

// User Management Functions

export async function suspendUser(userId: number): Promise<boolean> {
  try {
    console.log(`⏸️ Suspending user ID: ${userId}`);

    // Suspend user (do not allow suspending admin)
    db.run(
      `
      UPDATE users
      SET status = 'suspended', updated_at = datetime('now')
      WHERE id = ? AND role != 'admin'
    `,
      [userId],
    );

    // Also suspend corresponding hospital record if one exists for this user
    try {
      db.run(
        `
        UPDATE hospitals
        SET status = 'suspended', updated_at = datetime('now')
        WHERE user_id = ?
      `,
        [userId],
      );
    } catch (e) {
      console.warn(
        `⚠️ Failed to update hospital status for user ${userId}:`,
        e,
      );
    }

    console.log(`✅ User ${userId} suspended successfully`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error suspending user:", error);
    return false;
  }
}

export async function reactivateUser(userId: number): Promise<boolean> {
  try {
    console.log(`▶️ Reactivating user ID: ${userId}`);

    // Reactivate user (do not allow reactivating admin via this path)
    db.run(
      `
      UPDATE users
      SET status = 'active', updated_at = datetime('now')
      WHERE id = ? AND role != 'admin'
    `,
      [userId],
    );

    // Also reactivate corresponding hospital record if one exists for this user
    try {
      db.run(
        `
        UPDATE hospitals
        SET status = 'active', updated_at = datetime('now')
        WHERE user_id = ?
      `,
        [userId],
      );
    } catch (e) {
      console.warn(
        `⚠️ Failed to update hospital status for user ${userId}:`,
        e,
      );
    }

    console.log(`✅ User ${userId} reactivated successfully`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error reactivating user:", error);
    return false;
  }
}

// Admin-specific operations allowing system admins to manage state admin accounts
export async function suspendAdminById(userId: number): Promise<boolean> {
  try {
    db.run(
      `
      UPDATE users
      SET status = 'suspended', updated_at = datetime('now')
      WHERE id = ?
    `,
      [userId],
    );

    saveDatabase();
    console.log(`✅ Admin ${userId} suspended successfully`);
    return true;
  } catch (error) {
    console.error("❌ Error suspending admin:", error);
    return false;
  }
}

export async function reactivateAdminById(userId: number): Promise<boolean> {
  try {
    db.run(
      `
      UPDATE users
      SET status = 'active', updated_at = datetime('now')
      WHERE id = ?
    `,
      [userId],
    );

    saveDatabase();
    console.log(`✅ Admin ${userId} reactivated successfully`);
    return true;
  } catch (error) {
    console.error("❌ Error reactivating admin:", error);
    return false;
  }
}

export async function deleteAdminById(userId: number): Promise<boolean> {
  try {
    // Delete related records first (customers/doctors entries should not exist for admins but keep for safety)
    db.run("DELETE FROM customers WHERE user_id = ?", [userId]);
    db.run("DELETE FROM doctors WHERE user_id = ?", [userId]);

    db.run("DELETE FROM users WHERE id = ?", [userId]);
    saveDatabase();
    console.log(`✅ Admin ${userId} deleted successfully`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting admin:", error);
    return false;
  }
}

export async function deleteUser(userId: number): Promise<boolean> {
  try {
    console.log(`���️ Deleting user ID: ${userId}`);

    // Check if user is admin
    const userResult = db.exec("SELECT role FROM users WHERE id = ?", [userId]);
    if (
      userResult &&
      userResult[0] &&
      userResult[0].values[0] &&
      userResult[0].values[0][0] === "admin"
    ) {
      throw new Error("Cannot delete admin user");
    }

    // Delete related records first
    db.run("DELETE FROM customers WHERE user_id = ?", [userId]);
    db.run("DELETE FROM doctors WHERE user_id = ?", [userId]);

    // Delete the user
    db.run("DELETE FROM users WHERE id = ? AND role != 'admin'", [userId]);

    console.log(`✅ User ${userId} deleted successfully`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return false;
  }
}

export function getAllUsers(): any[] {
  try {
    const result = db.exec(`
      SELECT u.id, u.username, u.email, u.role, u.full_name, u.phone,
             u.status, u.created_at, u.updated_at
      FROM users u
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);

    if (!result || result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const users = result[0].values.map((row) => {
      const user: any = {};
      columns.forEach((col, index) => {
        user[col] = row[index];
      });
      return user;
    });

    console.log(`📊 Retrieved ${users.length} users`);
    return users;
  } catch (error) {
    console.error("❌ Error getting all users:", error);
    return [];
  }
}

export function getUsersByRole(role: string): any[] {
  try {
    const result = db.exec(
      `
      SELECT u.id, u.username, u.email, u.role, u.full_name, u.phone,
             u.status, u.created_at, u.updated_at
      FROM users u
      WHERE u.role = ? AND u.role != 'admin'
      ORDER BY u.created_at DESC
    `,
      [role],
    );

    if (!result || result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const users = result[0].values.map((row) => {
      const user: any = {};
      columns.forEach((col, index) => {
        user[col] = row[index];
      });
      return user;
    });

    console.log(`📊 Retrieved ${users.length} ${role}s`);
    return users;
  } catch (error) {
    console.error(`❌ Error getting ${role} users:`, error);
    return [];
  }
}

// Admin helpers
export function getAdminUsers(): any[] {
  try {
    const result = db.exec(`
      SELECT u.id, u.username, u.email, u.role, u.full_name, u.phone,
             u.status, u.admin_type, u.state, u.district, u.created_at, u.updated_at
      FROM users u
      WHERE u.role = 'admin'
      ORDER BY u.created_at DESC
    `);

    if (!result || result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const users = result[0].values.map((row) => {
      const user: any = {};
      columns.forEach((col, index) => {
        user[col] = row[index];
      });
      return user;
    });

    return users;
  } catch (error) {
    console.error("❌ Error getting admin users:", error);
    return [];
  }
}

export function setAdminTypeByEmail(
  email: string,
  adminType: "system" | "state" | null,
): boolean {
  try {
    if (!db) {
      console.error("❌ Database not initialized");
      return false;
    }

    const user = getUserByEmail(email);
    if (!user) {
      console.error(`❌ User not found for email: ${email}`);
      return false;
    }

    db.run(
      `
      UPDATE users
      SET admin_type = ?, updated_at = datetime('now')
      WHERE email = ?
    `,
      [adminType, email],
    );

    saveDatabase();
    console.log(`✅ Updated admin_type for ${email} -> ${adminType}`);
    return true;
  } catch (error) {
    console.error("❌ Error setting admin_type:", error);
    return false;
  }
}

export function getUserById(userId: number): User | undefined {
  try {
    const result = db.exec("SELECT * FROM users WHERE id = ?", [userId]);
    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      return undefined;
    }
    const columns = result[0].columns;
    const row = result[0].values[0];
    const user: any = {};
    columns.forEach((col, index) => {
      user[col] = row[index];
    });
    return user as User;
  } catch (error) {
    console.error("❌ Error getting user by id:", error);
    return undefined;
  }
}

export async function updateUserPasswordById(
  userId: number,
  newPassword: string,
): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run(
      `
      UPDATE users
      SET password = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [hashedPassword, userId],
    );
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error updating password by id:", error);
    return false;
  }
}

// Hospital operations
export function createHospital(hospital: Hospital): number {
  try {
    db.run(
      `
      INSERT INTO hospitals (
        user_id, hospital_name, address, address_lane1, address_lane2, state, district, pin_code,
        phone_number, hospital_type,
        license_number, number_of_ambulances, number_of_beds, departments,
        google_map_enabled, google_map_link, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        hospital.user_id,
        hospital.hospital_name,
        hospital.address,
        hospital.address_lane1 || null,
        hospital.address_lane2 || null,
        hospital.state || null,
        hospital.district || null,
        hospital.pin_code || null,
        hospital.phone_number || null,
        hospital.hospital_type || null,
        hospital.license_number || null,
        hospital.number_of_ambulances || 0,
        hospital.number_of_beds || 0,
        hospital.departments || null,
        hospital.google_map_enabled ? 1 : 0,
        hospital.google_map_link || null,
      ],
    );

    const result = db.exec("SELECT last_insert_rowid() as id");
    const hospitalId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ Hospital created: ${hospital.hospital_name} - ID: ${hospitalId}`,
    );

    return hospitalId as number;
  } catch (error) {
    console.error("❌ Error creating hospital:", error);
    throw error;
  }
}

export function getHospitalByUserId(userId: number): any | undefined {
  try {
    const result = db.exec(
      `
      SELECT h.*, u.email, u.full_name, u.phone as user_phone
      FROM hospitals h
      JOIN users u ON h.user_id = u.id
      WHERE h.user_id = ?
    `,
      [userId],
    );

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      return undefined;
    }

    const columns = result[0].columns;
    const row = result[0].values[0];

    const hospital: any = {};
    columns.forEach((col, index) => {
      hospital[col] = row[index];
    });

    // Parse address to extract state and district if they're empty
    if ((!hospital.state || !hospital.district) && hospital.address) {
      const parsed = parseAddressForStateDistrict(hospital.address);
      if (!hospital.state && parsed.state) {
        hospital.state = parsed.state;
      }
      if (!hospital.district && parsed.district) {
        hospital.district = parsed.district;
      }
    }

    return hospital;
  } catch (error) {
    console.error("❌ Error getting hospital by user ID:", error);
    return undefined;
  }
}

export function getHospitalById(hospitalId: number): any | undefined {
  try {
    const result = db.exec(
      `
      SELECT h.*, u.email, u.full_name, u.phone as user_phone
      FROM hospitals h
      JOIN users u ON h.user_id = u.id
      WHERE h.id = ?
    `,
      [hospitalId],
    );

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      return undefined;
    }

    const columns = result[0].columns;
    const row = result[0].values[0];

    const hospital: any = {};
    columns.forEach((col, index) => {
      hospital[col] = row[index];
    });

    // Parse address to extract state and district if they're empty
    if ((!hospital.state || !hospital.district) && hospital.address) {
      const parsed = parseAddressForStateDistrict(hospital.address);
      if (!hospital.state && parsed.state) {
        hospital.state = parsed.state;
      }
      if (!hospital.district && parsed.district) {
        hospital.district = parsed.district;
      }
    }

    return hospital;
  } catch (error) {
    console.error("❌ Error getting hospital by ID:", error);
    return undefined;
  }
}

export function getAllHospitals(): any[] {
  try {
    const result = db.exec(`
      SELECT h.*, u.email, u.full_name, u.phone as user_phone
      FROM hospitals h
      JOIN users u ON h.user_id = u.id
      ORDER BY h.hospital_name
    `);

    if (!result || result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const hospitals = result[0].values.map((row) => {
      const hospital: any = {};
      columns.forEach((col, index) => {
        hospital[col] = row[index];
      });

      // Parse address to extract state and district if they're empty
      if ((!hospital.state || !hospital.district) && hospital.address) {
        const parsed = parseAddressForStateDistrict(hospital.address);
        if (!hospital.state && parsed.state) {
          hospital.state = parsed.state;
        }
        if (!hospital.district && parsed.district) {
          hospital.district = parsed.district;
        }
      }

      return hospital;
    });

    console.log(`📊 Retrieved ${hospitals.length} hospitals`);
    return hospitals;
  } catch (error) {
    console.error("❌ Error getting hospitals:", error);
    return [];
  }
}

export function parseAddressForStateDistrict(address: string): {
  state: string | null;
  district: string | null;
} {
  try {
    // Load states and districts data
    const statesDistrictsPath = join(
      process.cwd(),
      "shared/india-states-districts.json",
    );
    const statesDistrictsData = readFileSync(statesDistrictsPath, "utf-8");
    const statesDistricts = JSON.parse(statesDistrictsData);

    // Build lookup maps
    const stateMap: Record<string, string> = {};
    const districtMap: Record<string, string> = {};

    statesDistricts.states.forEach((state: any) => {
      stateMap[state.name.toLowerCase()] = state.name;
      if (Array.isArray(state.districts)) {
        state.districts.forEach((district: string) => {
          if (district) {
            districtMap[district.toLowerCase()] = district;
          }
        });
      }
    });

    // Parse address - split by comma first, then by space to get individual words
    const addressParts = address.split(",").map((part) => part.trim());

    let extractedState: string | null = null;
    let extractedDistrict: string | null = null;

    for (const part of addressParts) {
      const lowerPart = part.toLowerCase();

      // Check if the entire part is a state (exact match)
      if (stateMap[lowerPart]) {
        extractedState = stateMap[lowerPart];
      } else {
        // Split by space and check each word for state
        const words = part.split(/\s+/);
        for (const word of words) {
          const lowerWord = word.toLowerCase();
          if (stateMap[lowerWord]) {
            extractedState = stateMap[lowerWord];
            break;
          }
        }
      }

      // Check if the entire part is a district (exact match)
      if (districtMap[lowerPart]) {
        extractedDistrict = districtMap[lowerPart];
      } else {
        // Split by space and check each word for district
        const words = part.split(/\s+/);
        for (const word of words) {
          const lowerWord = word.toLowerCase();
          if (districtMap[lowerWord]) {
            extractedDistrict = districtMap[lowerWord];
            break;
          }
        }
      }
    }

    return {
      state: extractedState,
      district: extractedDistrict,
    };
  } catch (error) {
    console.error("⚠️ Error parsing address:", error);
    return { state: null, district: null };
  }
}

export function updateHospital(
  userId: number,
  updates: Partial<Hospital>,
): boolean {
  try {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.hospital_name) {
      updateFields.push("hospital_name = ?");
      values.push(updates.hospital_name);
    }
    if (updates.address) {
      updateFields.push("address = ?");
      values.push(updates.address);
    }
    if (updates.address_lane1) {
      updateFields.push("address_lane1 = ?");
      values.push(updates.address_lane1);
    }
    if (updates.address_lane2 !== undefined) {
      updateFields.push("address_lane2 = ?");
      values.push(updates.address_lane2 || null);
    }
    if (updates.state) {
      updateFields.push("state = ?");
      values.push(updates.state);
    }
    if (updates.district) {
      updateFields.push("district = ?");
      values.push(updates.district);
    }
    if (updates.pin_code) {
      updateFields.push("pin_code = ?");
      values.push(updates.pin_code);
    }
    if (updates.phone_number) {
      updateFields.push("phone_number = ?");
      values.push(updates.phone_number);
    }
    if (updates.hospital_type) {
      updateFields.push("hospital_type = ?");
      values.push(updates.hospital_type);
    }
    if (updates.license_number) {
      updateFields.push("license_number = ?");
      values.push(updates.license_number);
    }
    if (typeof updates.number_of_ambulances !== "undefined") {
      updateFields.push("number_of_ambulances = ?");
      values.push(updates.number_of_ambulances);
    }
    if (typeof updates.number_of_beds !== "undefined") {
      updateFields.push("number_of_beds = ?");
      values.push(updates.number_of_beds);
    }
    if (updates.departments) {
      updateFields.push("departments = ?");
      values.push(updates.departments);
    }
    if (typeof updates.google_map_enabled !== "undefined") {
      updateFields.push("google_map_enabled = ?");
      values.push(updates.google_map_enabled ? 1 : 0);
    }
    if (updates.google_map_link) {
      updateFields.push("google_map_link = ?");
      values.push(updates.google_map_link);
    }
    if (updates.status) {
      updateFields.push("status = ?");
      values.push(updates.status);
    }

    if (updateFields.length === 0) {
      return false;
    }

    updateFields.push("updated_at = datetime('now')");
    values.push(userId);

    db.run(
      `UPDATE hospitals SET ${updateFields.join(", ")} WHERE user_id = ?`,
      values,
    );

    saveDatabase();
    console.log(`✅ Hospital updated: User ID ${userId}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating hospital:", error);
    return false;
  }
}

// Password reset helpers
export async function createPasswordReset(
  email: string,
  token: string,
  expiresAt: string,
): Promise<number> {
  try {
    // Ensure table exists
    db.run(
      `CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    );

    // Remove any existing tokens for this email
    db.run("DELETE FROM password_resets WHERE email = ?", [email]);

    db.run(
      `INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)`,
      [email, token, expiresAt],
    );

    const result = db.exec("SELECT last_insert_rowid() as id");
    const id = result[0].values[0][0];

    saveDatabase();
    console.log(`🔐 Created password reset for ${maskEmail(email)} (id=${id})`);
    return id as number;
  } catch (error) {
    console.error("❌ Error creating password reset:", error);
    throw error;
  }
}

export function getPasswordResetByToken(token: string): any | undefined {
  try {
    const result = db.exec("SELECT * FROM password_resets WHERE token = ?", [
      token,
    ]);
    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      return undefined;
    }

    const columns = result[0].columns;
    const row = result[0].values[0];
    const reset: any = {};
    columns.forEach((col, index) => {
      reset[col] = row[index];
    });

    return reset;
  } catch (error) {
    console.error("❌ Error getting password reset by token:", error);
    return undefined;
  }
}

export function deletePasswordReset(token: string): boolean {
  try {
    db.run("DELETE FROM password_resets WHERE token = ?", [token]);
    saveDatabase();
    console.log(`🗑️ Deleted password reset token`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting password reset:", error);
    return false;
  }
}

export function closeDatabase(): void {
  try {
    if (db) {
      saveDatabase();
      db.close();
      console.log("💾 SQLite database saved and closed");
    }
  } catch (error) {
    console.error("❌ Error closing database:", error);
  }
}

// Export database instance for debugging
export { db };
