const initSqlJs = require("sql.js");
const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const DB_PATH = join(process.cwd(), "healthcare.db");
const statesDistrictsPath = join(
  process.cwd(),
  "shared/india-states-districts.json",
);

let SQL;
let db;

async function migrateHospitalAddresses() {
  try {
    console.log("🔧 Starting hospital address migration...");

    // Initialize sql.js
    SQL = await initSqlJs();

    // Load database
    const data = readFileSync(DB_PATH);
    db = new SQL.Database(data);

    // Load states and districts
    const statesDistricts = JSON.parse(
      readFileSync(statesDistrictsPath, "utf-8"),
    );
    const districts = new Set();
    const stateMap = {};

    statesDistricts.states.forEach((state) => {
      stateMap[state.name.toLowerCase()] = state.name;
      if (Array.isArray(state.districts)) {
        state.districts.forEach((district) => {
          if (district) {
            districts.add(district.toLowerCase());
            districts.add(district);
          }
        });
      }
    });

    // Get all hospitals with empty state or district
    const result = db.exec(`
      SELECT id, address, state, district, address_lane1
      FROM hospitals
      WHERE (state IS NULL OR state = '' OR district IS NULL OR district = '')
      AND address IS NOT NULL AND address != ''
    `);

    if (!result || result.length === 0) {
      console.log("✅ No hospitals need migration");
      return;
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    console.log(`📝 Found ${rows.length} hospitals to migrate`);

    let updated = 0;

    for (const row of rows) {
      const hospital = {};
      columns.forEach((col, index) => {
        hospital[col] = row[index];
      });

      const { id, address, state, district, address_lane1 } = hospital;

      let extractedState = state || "";
      let extractedDistrict = district || "";

      // Parse address to find state and district
      const addressParts = address.split(",").map((part) => part.trim());

      // Try to find district and state in address parts
      for (const part of addressParts) {
        const lowerPart = part.toLowerCase();

        // Check if this part is a state
        for (const [stateKey, stateName] of Object.entries(stateMap)) {
          if (lowerPart === stateKey || part === stateName) {
            extractedState = stateName;
            break;
          }
        }

        // Check if this part is a district
        if (districts.has(lowerPart)) {
          extractedDistrict = part;
        } else if (districts.has(part)) {
          extractedDistrict = part;
        }
      }

      // Update if we found state or district
      if (extractedState || extractedDistrict) {
        const updates = [];
        const values = [];

        if (extractedState && !state) {
          updates.push("state = ?");
          values.push(extractedState);
        }
        if (extractedDistrict && !district) {
          updates.push("district = ?");
          values.push(extractedDistrict);
        }

        if (updates.length > 0) {
          values.push(id);
          const query = `UPDATE hospitals SET ${updates.join(", ")} WHERE id = ?`;
          console.log(
            `  ✓ Hospital ${id}: state="${extractedState}", district="${extractedDistrict}"`,
          );
          db.run(query, values);
          updated++;
        }
      }
    }

    // Save database
    const data_export = db.export();
    writeFileSync(DB_PATH, data_export);

    console.log(`✅ Migration complete! Updated ${updated} hospitals`);
    console.log("💾 Database saved");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
}

migrateHospitalAddresses();
