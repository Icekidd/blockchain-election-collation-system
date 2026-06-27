import emailjs from "@emailjs/browser";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const RESULTS_URL = window.location.origin + "/results";

function getOfficersByRole(role) {
  const officers = JSON.parse(localStorage.getItem("approvedOfficers") || "[]");
  return officers.filter(o => o.role === role && o.email);
}

async function sendEmail(toName, toEmail, title, message, stationId, constituency) {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name:      toName,
        to_email:     toEmail,
        title,
        message,
        station_id:   stationId || "N/A",
        constituency: constituency || "N/A",
        time:         new Date().toLocaleString("en-GH"),
        results_url:  RESULTS_URL,
      },
      PUBLIC_KEY
    );
    console.log(`Email sent to ${toEmail}`);
  } catch (err) {
    console.error(`Email failed for ${toEmail}:`, err);
  }
}

export async function notifyResultSubmitted(stationId, constituency, officerName) {
  const officers = getOfficersByRole("RETURNING");
  for (const o of officers) {
    await sendEmail(
      o.name, o.email,
      "New Result Submitted — Action Required",
      `Presiding Officer ${officerName} has submitted results for polling station ${stationId} in ${constituency} constituency. Please log in to review and confirm.`,
      stationId, constituency
    );
  }
}

export async function notifyResultFlagged(stationId, constituency, reason) {
  const officers = [
    ...getOfficersByRole("RETURNING"),
    ...getOfficersByRole("SENIOR"),
  ];
  for (const o of officers) {
    await sendEmail(
      o.name, o.email,
      "Result Flagged — Dispute Requires Attention",
      `A result has been flagged for polling station ${stationId} in ${constituency}.\n\nReason: ${reason}\n\nPlease log in to review the dispute.`,
      stationId, constituency
    );
  }
}

export async function notifyResultConfirmed(stationId, constituency) {
  const officers = getOfficersByRole("SENIOR");
  for (const o of officers) {
    await sendEmail(
      o.name, o.email,
      "Result Confirmed",
      `The result for polling station ${stationId} in ${constituency} has been confirmed by the Returning Officer.`,
      stationId, constituency
    );
  }
}

export async function notifyConstituencyLocked(constituency) {
  const officers = getOfficersByRole("SENIOR");
  for (const o of officers) {
    await sendEmail(
      o.name, o.email,
      "Constituency Locked — Collation Complete",
      `${constituency} constituency has been locked. All results are final.`,
      "N/A", constituency
    );
  }
}