import pool from "./database.js";

async function main() {
    const res = await pool.query("SELECT * FROM clio.users");
    console.log("DB responded:", res.rows[0]);
    await pool.end();
}

main().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});