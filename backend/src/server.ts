import fs from "fs";
import { app } from "./app.js";
import pool from "./database.js";
import { sqlFailOrphanedStatements } from "./api/statements/sql.js";

const PORT = process.env.PORT ?? 3000;

// Ensure the uploads directory exists before multer tries to write to it.
// This runs once at startup so a missing folder never causes a silent crash.
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
    console.log("Created uploads/ directory");
}

// Recover statements orphaned in 'queued'/'processing' by a previous crash or
// restart, so they don't sit "processing forever" with no pipeline to finish them.
sqlFailOrphanedStatements(pool)
    .then((rows) => {
        if (rows.length > 0) {
            console.log(`Reconciled ${rows.length} orphaned statement(s) to 'failed' on startup`);
        }
    })
    .catch((err) => console.error("Startup statement reconciliation failed:", err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});