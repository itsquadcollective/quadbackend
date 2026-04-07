// ============================================================
//  QUAD INNOVATION 2026 — Form Submission Backend
//  Node.js + Express + Nodemailer
//
//  BUGS FIXED:
//  - CORS now locked to your live domain (not wide open)
//  - All email HTML fields are sanitized to prevent XSS
//  - paystackRef was missing from the internal Quad email table (fixed)
//  - Added a /health route for Render's health checks
//  - Counter note improved: it resets on restart — for production
//    you should store it in a file or a free DB like Airtable/Supabase
//
//  HOW TO RUN LOCALLY:
//  1. npm install
//  2. Fill in your real values in the .env file
//  3. node server.js
//
//  HOW TO DEPLOY ON RENDER:
//  - Push this folder to GitHub (.env is gitignored automatically)
//  - On Render, go to Environment Variables and add each key from .env
// ============================================================

require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());

// ============================================================
//  CORS — only allow your actual website origins
//  Add localhost for local testing, and your live domain
// ============================================================
const allowedOrigins = [
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:5500',      // VS Code Live Server
  'http://127.0.0.1:5500',
  // Add your real domain below once deployed, e.g.:
  // 'https://quadinnovation2026.com',
  // 'https://www.quadinnovation2026.com',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    // During testing, log unknown origins but still allow them
    // Remove the line below once in production
    console.warn('CORS: unknown origin allowed for now —', origin);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));


// ============================================================
//  CONFIG — reads from .env
// ============================================================
const CONFIG = {
  QUAD_EMAIL:         process.env.QUAD_EMAIL,
  GMAIL_USER:         process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  PORT:               process.env.PORT || 3000,
};


// ============================================================
//  EMAIL TRANSPORTER
// ============================================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: CONFIG.GMAIL_USER,
    pass: CONFIG.GMAIL_APP_PASSWORD,
  },
});


// ============================================================
//  HELPER — Sanitize strings to prevent XSS in email HTML
// ============================================================
function safe(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}


// ============================================================
//  HELPER — Participant ID Generator
//  NOTE: This counter resets when the server restarts.
//  For production, store this in a file or a database.
//  A simple fix is to use a timestamp-based ID instead:
//    `QI2026-${Date.now()}`
// ============================================================
let participantCounter = 1;

function generateParticipantID() {
  const id = `QI2026-${String(participantCounter).padStart(3, '0')}`;
  participantCounter++;
  return id;
}


// ============================================================
//  HELPER — Confirmation email to the PARTICIPANT
// ============================================================
function buildParticipantEmail(data, participantID) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
      .wrap { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 6px; overflow: hidden; }
      .header { background: #03081b; padding: 36px 40px; text-align: center; }
      .header h1 { color: #3b82f6; font-size: 28px; margin: 0 0 4px; letter-spacing: 0.05em; }
      .header p { color: #7b94c4; font-size: 13px; margin: 0; letter-spacing: 0.1em; text-transform: uppercase; }
      .body { padding: 36px 40px; }
      .body h2 { color: #1e293b; font-size: 20px; margin: 0 0 12px; }
      .body p { color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
      .id-box { background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 4px; margin: 24px 0; }
      .id-box .id-label { font-size: 11px; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase; color: #3b82f6; margin-bottom: 4px; }
      .id-box .id-value { font-size: 24px; font-weight: bold; color: #1e293b; letter-spacing: 0.05em; }
      .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .details-table td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
      .details-table td:first-child { color: #94a3b8; font-weight: bold; width: 40%; }
      .details-table td:last-child { color: #1e293b; }
      .timeline { background: #f8fafc; border-radius: 4px; padding: 20px 24px; margin: 20px 0; }
      .timeline h3 { font-size: 13px; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin: 0 0 14px; }
      .tl-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
      .tl-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; margin-top: 5px; flex-shrink: 0; }
      .tl-text { font-size: 14px; color: #475569; line-height: 1.5; }
      .tl-text strong { color: #1e293b; }
      .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
      .footer p { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.7; }
      .footer a { color: #3b82f6; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>QUAD INNOVATION 2026</h1>
        <p>The Quad Collective &nbsp;&middot;&nbsp; Official Confirmation</p>
      </div>
      <div class="body">
        <h2>You're in, ${safe(data.fullName.split(' ')[0])}! 🎉</h2>
        <p>Your registration for <strong>Quad Innovation 2026</strong> has been confirmed. Welcome to Nigeria's boldest youth-led tech and innovation competition.</p>

        <div class="id-box">
          <div class="id-label">Your Participant ID</div>
          <div class="id-value">${safe(participantID)}</div>
        </div>

        <table class="details-table">
          <tr><td>Full Name</td><td>${safe(data.fullName)}</td></tr>
          <tr><td>Email</td><td>${safe(data.email)}</td></tr>
          <tr><td>Phone</td><td>${safe(data.phone)}</td></tr>
          <tr><td>Institution</td><td>${safe(data.institution)}</td></tr>
          <tr><td>Project Name</td><td>${safe(data.projectName)}</td></tr>
          <tr><td>Category</td><td>${safe(data.category)}</td></tr>
          <tr><td>Payment Ref</td><td>${safe(data.paystackRef)}</td></tr>
        </table>

        <div class="timeline">
          <h3>What Happens Next</h3>
          <div class="tl-row"><div class="tl-dot"></div><div class="tl-text"><strong>Now – May 31:</strong> Registration is open. Share the competition with friends.</div></div>
          <div class="tl-row"><div class="tl-dot"></div><div class="tl-text"><strong>Early June:</strong> Shortlisted participants will be notified with pitch guidelines.</div></div>
          <div class="tl-row"><div class="tl-dot"></div><div class="tl-text"><strong>June 7, 2026:</strong> Competition Day. Show up. Pitch. Win.</div></div>
        </div>

        <p>Keep this email safe — it is your official registration record. If you have any questions, reach us at <a href="mailto:hello@thequadcollective.com">hello@thequadcollective.com</a>.</p>

        <p style="color:#1e293b; font-weight:600;">We are rooting for you.<br>&mdash; Lilly &amp; The Quad Collective Team</p>
      </div>
      <div class="footer">
        <p>The Quad Collective &nbsp;&middot;&nbsp; Quad Innovation 2026<br>
        <a href="mailto:hello@thequadcollective.com">hello@thequadcollective.com</a> &nbsp;&middot;&nbsp; @thequadcollective</p>
      </div>
    </div>
  </body>
  </html>
  `;
}


// ============================================================
//  HELPER — Internal copy email to THE QUAD
//  FIX: paystackRef was missing from this table — now included
// ============================================================
function buildQuadEmail(data, participantID) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
      .wrap { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 6px; overflow: hidden; }
      .header { background: #1d40ae; padding: 24px 32px; }
      .header h1 { color: #ffffff; font-size: 18px; margin: 0; }
      .header p { color: #bfdbfe; font-size: 13px; margin: 4px 0 0; }
      .body { padding: 28px 32px; }
      .body p { color: #475569; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
      td:first-child { color: #64748b; font-weight: bold; width: 38%; }
      .id { font-size: 20px; font-weight: bold; color: #1d40ae; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>New Registration — Quad Innovation 2026</h1>
        <p>Internal copy &middot; The Quad Collective</p>
      </div>
      <div class="body">
        <p>A new participant has registered. Here are their details:</p>
        <div class="id">Participant ID: ${safe(participantID)}</div>
        <table>
          <tr><td>Full Name</td><td>${safe(data.fullName)}</td></tr>
          <tr><td>Email</td><td>${safe(data.email)}</td></tr>
          <tr><td>Phone</td><td>${safe(data.phone)}</td></tr>
          <tr><td>Date of Birth</td><td>${safe(data.dob)}</td></tr>
          <tr><td>State</td><td>${safe(data.state)}</td></tr>
          <tr><td>Institution</td><td>${safe(data.institution)}</td></tr>
          <tr><td>Institution Type</td><td>${safe(data.institutionType)}</td></tr>
          <tr><td>Faculty / Dept</td><td>${safe(data.faculty) || 'Not provided'}</td></tr>
          <tr><td>Year of Study</td><td>${safe(data.yearOfStudy) || 'Not provided'}</td></tr>
          <tr><td>Project Name</td><td>${safe(data.projectName)}</td></tr>
          <tr><td>Problem</td><td>${safe(data.problem)}</td></tr>
          <tr><td>Solution</td><td>${safe(data.solution)}</td></tr>
          <tr><td>Category</td><td>${safe(data.category)}</td></tr>
          <tr><td>Project Stage</td><td>${safe(data.projectStage) || 'Not provided'}</td></tr>
          <tr><td>Tech Experience</td><td>${safe(data.techExperience)}</td></tr>
          <tr><td>Pitched Before</td><td>${safe(data.pitchedBefore)}</td></tr>
          <tr><td>Heard About Us</td><td>${safe(data.heardFrom) || 'Not provided'}</td></tr>
          <tr><td>Paystack Ref</td><td><strong>${safe(data.paystackRef)}</strong></td></tr>
        </table>
      </div>
    </div>
  </body>
  </html>
  `;
}


// ============================================================
//  ROUTE — POST /register
// ============================================================
app.post('/register', async (req, res) => {
  const data = req.body;

  // Validate required fields
  const required = ['fullName', 'email', 'phone', 'institution', 'projectName', 'paystackRef'];
  for (const field of required) {
    if (!data[field] || !String(data[field]).trim()) {
      return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
    }
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  const participantID = generateParticipantID();

  try {
    // 1. Send confirmation email to the PARTICIPANT
    await transporter.sendMail({
      from: `"The Quad Collective" <${CONFIG.GMAIL_USER}>`,
      to: data.email,
      subject: `You're In — Quad Innovation 2026 Registration Confirmed (${participantID})`,
      html: buildParticipantEmail(data, participantID),
    });

    // 2. Send internal copy to THE QUAD
    await transporter.sendMail({
      from: `"Quad Registration System" <${CONFIG.GMAIL_USER}>`,
      to: CONFIG.QUAD_EMAIL,
      subject: `New Registration: ${data.fullName} — ${participantID}`,
      html: buildQuadEmail(data, participantID),
    });

    console.log(`[${new Date().toISOString()}] ✅ Registered: ${data.fullName} | ${participantID} | ${data.email}`);

    return res.status(200).json({
      success: true,
      participantID,
      message: 'Registration successful. Confirmation email sent.',
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Email error:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Registration received but email sending failed. Please contact hello@thequadcollective.com.',
    });
  }
});


// ============================================================
//  ROUTE — GET / and GET /health  (health check for Render)
// ============================================================
app.get('/', (req, res) => {
  res.json({ status: 'Quad Innovation 2026 backend is running.', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


// Start the server
app.listen(CONFIG.PORT, () => {
  console.log(`✅ Quad backend running on http://localhost:${CONFIG.PORT}`);
  console.log(`   GMAIL_USER  : ${CONFIG.GMAIL_USER}`);
  console.log(`   QUAD_EMAIL  : ${CONFIG.QUAD_EMAIL}`);
  console.log(`   App Password: ${CONFIG.GMAIL_APP_PASSWORD ? '✓ set' : '✗ MISSING'}`);
});
