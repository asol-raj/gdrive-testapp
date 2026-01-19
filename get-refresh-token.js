require("dotenv").config();
const { google } = require("googleapis");
const readline = require("readline");

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

// ✅ NEW supported redirect URI
const REDIRECT_URI = "http://localhost";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // 🔥 forces refresh token
});

console.log("\nOpen this URL in INCOGNITO mode:\n");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nPaste authorization code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("\n✅ REFRESH TOKEN:\n", tokens.refresh_token);
  } catch (err) {
    console.error("❌ Error getting token", err);
  }
  rl.close();
});
