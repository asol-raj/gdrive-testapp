/**
 * Google Drive Upload Test App
 * Node.js + Express + EJS
 * Uploads files directly to a specific Google Drive folder using Drive API
 */

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { google } = require("googleapis");

const app = express();

/* -------------------- BASIC EXPRESS SETUP -------------------- */

const PORT = process.env.PORT || 3031;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* -------------------- MULTER SETUP -------------------- */
/**
 * Files are stored temporarily and deleted after upload
 */
const upload = multer({
  dest: path.join(__dirname, "uploads"),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

/* -------------------- GOOGLE OAUTH SETUP -------------------- */

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost" // loopback redirect (required by Google)
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

/* -------------------- ROUTES -------------------- */

/**
 * Home page
 */
app.get("/", (req, res) => {
  res.render("index");
});

/**
 * Upload file to Google Drive
 */
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("❌ No file uploaded");
  }

  try {
    /* ---- 1. VERIFY FOLDER ACCESS (one-time safety check) ---- */
    await drive.files.get({
      fileId: process.env.FOLDER_ID,
      fields: "id, name",
      supportsAllDrives: true,
    });

    /* ---- 2. UPLOAD FILE ---- */
    const response = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [process.env.FOLDER_ID],
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      },
      supportsAllDrives: true,
    });

    /* ---- 3. CLEAN UP TEMP FILE ---- */
    fs.unlinkSync(req.file.path);

    res.send(`
      <h2>✅ Upload Successful</h2>
      <p><strong>File name:</strong> ${req.file.originalname}</p>
      <p><strong>Google Drive File ID:</strong> ${response.data.id}</p>
      <br/>
      <a href="/">⬅ Upload another file</a>
    `);
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    // Clean up temp file if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).send(`
      <h2>❌ Upload Failed</h2>
      <pre>${err.message}</pre>
      <a href="/">⬅ Go back</a>
    `);
  }
});

/* -------------------- START SERVER -------------------- */

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
