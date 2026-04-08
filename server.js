require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app  = express();
app.use(express.json());
app.use(cors()); // allow all origins — frontend is on Netlify

const PORT               = process.env.PORT || 3000;
const GMAIL_USER         = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const QUAD_EMAIL         = process.env.QUAD_EMAIL;

// ── email transporter ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
});

// ── sanitise user input before putting it in HTML emails ───────
function s(v) {
  if (v == null) return '';
  return String(v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── participant ID counter ─────────────────────────────────────
let counter = 1;
function newID() {
  return `QI2026-${String(counter++).padStart(3,'0')}`;
}

// ── email to the PARTICIPANT ───────────────────────────────────
function participantEmail(d, id) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0}
    .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:6px;overflow:hidden}
    .hd{background:#03081b;padding:36px 40px;text-align:center}
    .hd h1{color:#3b82f6;font-size:26px;margin:0 0 4px;letter-spacing:.05em}
    .hd p{color:#7b94c4;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:.1em}
    .bd{padding:36px 40px}
    .bd h2{color:#1e293b;font-size:20px;margin:0 0 12px}
    .bd p{color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px}
    .id-box{background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:4px;margin:24px 0}
    .id-label{font-size:11px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;color:#3b82f6;margin-bottom:4px}
    .id-val{font-size:26px;font-weight:bold;color:#1e293b;letter-spacing:.05em}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    td{padding:10px 12px;font-size:14px;border-bottom:1px solid #f1f5f9}
    td:first-child{color:#94a3b8;font-weight:bold;width:40%}
    td:last-child{color:#1e293b}
    .tl{background:#f8fafc;border-radius:4px;padding:20px 24px;margin:20px 0}
    .tl h3{font-size:12px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin:0 0 14px}
    .tl-row{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
    .dot{width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-top:5px;flex-shrink:0}
    .tl-text{font-size:14px;color:#475569;line-height:1.5}
    .tl-text strong{color:#1e293b}
    .ft{background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0}
    .ft p{font-size:12px;color:#94a3b8;margin:0;line-height:1.7}
    .ft a{color:#3b82f6;text-decoration:none}
  </style></head><body>
  <div class="wrap">
    <div class="hd">
      <h1>QUAD INNOVATION 2026</h1>
      <p>The Quad Collective &middot; Official Confirmation</p>
    </div>
    <div class="bd">
      <h2>You're in, ${s(d.fullName.split(' ')[0])}! &#x1F389;</h2>
      <p>Your registration for <strong>Quad Innovation 2026</strong> is confirmed. Welcome to Nigeria's boldest youth-led tech and innovation competition.</p>
      <div class="id-box">
        <div class="id-label">Your Participant ID</div>
        <div class="id-val">${s(id)}</div>
      </div>
      <table>
        <tr><td>Full Name</td><td>${s(d.fullName)}</td></tr>
        <tr><td>Email</td><td>${s(d.email)}</td></tr>
        <tr><td>Phone</td><td>${s(d.phone)}</td></tr>
        <tr><td>Institution</td><td>${s(d.institution)}</td></tr>
        <tr><td>Project Name</td><td>${s(d.projectName)}</td></tr>
        <tr><td>Category</td><td>${s(d.category)}</td></tr>
        <tr><td>Payment Ref</td><td>${s(d.paystackRef)}</td></tr>
      </table>
      <div class="tl">
        <h3>What Happens Next</h3>
        <div class="tl-row"><div class="dot"></div><div class="tl-text"><strong>Now &ndash; May 31:</strong> Registration is open. Share with friends.</div></div>
        <div class="tl-row"><div class="dot"></div><div class="tl-text"><strong>Early June:</strong> Shortlisted participants notified with pitch guidelines.</div></div>
        <div class="tl-row"><div class="dot"></div><div class="tl-text"><strong>June 7, 2026:</strong> Competition Day. Show up. Pitch. Win.</div></div>
      </div>
      <p>Keep this email &mdash; it is your official registration record.<br>Questions? <a href="mailto:hello@thequadcollective.com" style="color:#3b82f6">hello@thequadcollective.com</a></p>
      <p style="color:#1e293b;font-weight:600">We are rooting for you.<br>&mdash; Lilly &amp; The Quad Collective Team</p>
    </div>
    <div class="ft">
      <p>The Quad Collective &middot; Quad Innovation 2026<br>
      <a href="mailto:hello@thequadcollective.com">hello@thequadcollective.com</a> &middot; @thequadcollective</p>
    </div>
  </div></body></html>`;
}

// ── internal copy email to THE QUAD ───────────────────────────
function quadEmail(d, id) {
  const row = (label, val) =>
    `<tr><td style="color:#64748b;font-weight:bold;width:38%;padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:14px">${label}</td>`+
    `<td style="color:#1e293b;padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:14px">${s(val)||'—'}</td></tr>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:6px;overflow:hidden">
    <div style="background:#1d40ae;padding:24px 32px">
      <h1 style="color:#fff;font-size:18px;margin:0">New Registration &mdash; Quad Innovation 2026</h1>
      <p style="color:#bfdbfe;font-size:13px;margin:4px 0 0">Internal copy &middot; The Quad Collective</p>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#475569;font-size:14px;margin:0 0 16px">A new participant has registered.</p>
      <div style="font-size:22px;font-weight:bold;color:#1d40ae;margin-bottom:20px">Participant ID: ${s(id)}</div>
      <table style="width:100%;border-collapse:collapse">
        ${row('Full Name',       d.fullName)}
        ${row('Email',           d.email)}
        ${row('Phone',           d.phone)}
        ${row('Date of Birth',   d.dob)}
        ${row('State',           d.state)}
        ${row('Institution',     d.institution)}
        ${row('Institution Type',d.institutionType)}
        ${row('Faculty / Dept',  d.faculty)}
        ${row('Year of Study',   d.yearOfStudy)}
        ${row('Project Name',    d.projectName)}
        ${row('Problem',         d.problem)}
        ${row('Solution',        d.solution)}
        ${row('Category',        d.category)}
        ${row('Project Stage',   d.projectStage)}
        ${row('Tech Experience', d.techExperience)}
        ${row('Pitched Before',  d.pitchedBefore)}
        ${row('Heard From',      d.heardFrom)}
        <tr>
          <td style="color:#64748b;font-weight:bold;width:38%;padding:9px 12px;font-size:14px">Paystack Ref</td>
          <td style="color:#1e293b;padding:9px 12px;font-size:14px;font-weight:bold">${s(d.paystackRef)}</td>
        </tr>
      </table>
    </div>
  </div></body></html>`;
}

// ── POST /register ─────────────────────────────────────────────
app.post('/register', async (req, res) => {
  const d = req.body || {};

  // required field check
  const required = ['fullName','email','phone','institution','projectName','paystackRef'];
  for (const f of required) {
    if (!String(d[f]||'').trim()) {
      return res.status(400).json({ success:false, message:`Missing field: ${f}` });
    }
  }

  // basic email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    return res.status(400).json({ success:false, message:'Invalid email address.' });
  }

  const id = newID();

  try {
    // email to participant
    await transporter.sendMail({
      from: `"The Quad Collective" <${GMAIL_USER}>`,
      to: d.email,
      subject: `You're In — Quad Innovation 2026 (${id})`,
      html: participantEmail(d, id),
    });

    // internal copy to The Quad
    await transporter.sendMail({
      from: `"Quad Registration" <${GMAIL_USER}>`,
      to: QUAD_EMAIL,
      subject: `New Registration: ${d.fullName} — ${id}`,
      html: quadEmail(d, id),
    });

    console.log(`✅  ${id} | ${d.fullName} | ${d.email}`);
    return res.status(200).json({ success:true, participantID:id });

  } catch (err) {
    console.error('❌ Email error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Registration received but email failed. Contact hello@thequadcollective.com',
    });
  }
});

// ── health check ───────────────────────────────────────────────
app.get('/',       (_,res) => res.json({ status:'Quad backend running' }));
app.get('/health', (_,res) => res.json({ ok:true }));

app.listen(PORT, () => {
  console.log(`🚀  Quad backend on port ${PORT}`);
  console.log(`    GMAIL_USER : ${GMAIL_USER}`);
  console.log(`    QUAD_EMAIL : ${QUAD_EMAIL}`);
  console.log(`    PASSWORD   : ${GMAIL_APP_PASSWORD ? 'set ✓' : 'MISSING ✗'}`);
});
