import { RequestHandler } from "express";
import {
  getAllPatients,
  getAllDoctors,
  getDatabaseStats,
  createPendingRegistrationsTable,
  db,
} from "../database";

// Debug endpoint to check database contents
export const handleDatabaseDebug: RequestHandler = async (req, res) => {
  try {
    const stats = getDatabaseStats();

    // Get all users for debugging
    let allUsers = [];
    let pendingRegistrations = [];
    let tableStructure = {};

    try {
      if (db) {
        // Get users
        const userResult = db.exec(
          "SELECT id, username, email, role, full_name, created_at FROM users ORDER BY id",
        );
        if (userResult.length > 0) {
          const columns = userResult[0].columns;
          const rows = userResult[0].values;

          allUsers = rows.map((row) => {
            const user: any = {};
            columns.forEach((col, index) => {
              user[col] = row[index];
            });
            return user;
          });
        }

        // Check if pending_registrations table exists and get structure
        try {
          const tableInfoResult = db.exec(
            "PRAGMA table_info(pending_registrations)",
          );
          if (tableInfoResult.length > 0) {
            tableStructure = {
              pending_registrations_exists: true,
              columns: tableInfoResult[0].values,
            };

            // Get pending registrations
            const pendingResult = db.exec(
              "SELECT * FROM pending_registrations ORDER BY id",
            );
            if (pendingResult.length > 0) {
              const columns = pendingResult[0].columns;
              const rows = pendingResult[0].values;

              pendingRegistrations = rows.map((row) => {
                const reg: any = {};
                columns.forEach((col, index) => {
                  reg[col] = row[index];
                });
                return reg;
              });
            }
          }
        } catch (tableError) {
          tableStructure = {
            pending_registrations_exists: false,
            error: tableError.message,
          };
        }
      }
    } catch (error) {
      console.log("Error getting debug data:", error);
    }

    // Get ambulance requests for debugging
    let ambulanceRequests = [];
    try {
      const ambulanceResult = db.exec(
        "SELECT * FROM ambulance_requests ORDER BY created_at DESC",
      );
      if (ambulanceResult.length > 0) {
        const columns = ambulanceResult[0].columns;
        const rows = ambulanceResult[0].values;

        ambulanceRequests = rows.map((row) => {
          const request: any = {};
          columns.forEach((col, index) => {
            request[col] = row[index];
          });
          return request;
        });
      }
    } catch (ambulanceError) {
      console.log("Error getting ambulance requests:", ambulanceError);
    }

    res.json({
      stats,
      users: allUsers,
      pendingRegistrations,
      ambulanceRequests,
      tableStructure,
      message: "Database debug info",
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: "Debug endpoint error" });
  }
};

// Clear all users (for testing only)
export const handleClearUsers: RequestHandler = async (req, res) => {
  try {
    if (db) {
      db.run("DELETE FROM customers");
      db.run("DELETE FROM doctors");
      db.run("DELETE FROM users");

      // Save database
      const fs = require("fs");
      const path = require("path");
      const data = db.export();
      fs.writeFileSync(path.join(process.cwd(), "healthcare.db"), data);

      console.log("✅ All users cleared from database");
    }

    res.json({ message: "All users cleared successfully" });
  } catch (error) {
    console.error("Clear users error:", error);
    res.status(500).json({ error: "Error clearing users" });
  }
};

// Create pending registrations table manually
export const handleCreatePendingTable: RequestHandler = async (req, res) => {
  try {
    await createPendingRegistrationsTable();

    // Verify table creation
    const tableCheck = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='pending_registrations'",
    );

    res.json({
      message: "Pending registrations table created successfully",
      tableExists: tableCheck.length > 0,
    });
  } catch (error) {
    console.error("Create table error:", error);
    res
      .status(500)
      .json({
        error: "Error creating pending registrations table: " + error.message,
      });
  }
};
