import fs from "fs";
import { app } from "./app.js";

const PORT = process.env.PORT ?? 3000;

// Ensure the uploads directory exists before multer tries to write to it.
// This runs once at startup so a missing folder never causes a silent crash.
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
    console.log("Created uploads/ directory");
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});