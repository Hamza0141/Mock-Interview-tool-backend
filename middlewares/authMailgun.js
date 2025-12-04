
const FormData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

const FROM_NAME = "Prepare With AI";
const FROM_EMAIL = `Prepare With AI <support@${process.env.MAILGUN_DOMAIN}>`;

// ---------- Brand-aware base template helper ----------
function baseTemplate({ title, intro, contentHtml, footerNote }) {
  return `
    <div style="
      background: radial-gradient(circle at top, #111827 0, #020617 45%, #000 100%);
      padding: 24px;
      font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      color: #e5e7eb;
      border-radius: 18px;
      max-width: 640px;
      margin: 24px auto;
      box-shadow: 0 20px 60px rgba(15,23,42,0.9);
      border: 1px solid rgba(148,163,184,0.25);
    ">
      <!-- Brand header -->
      <div style="text-align:center;margin-bottom:18px;">
        <div style="display:inline-flex;align-items:center;gap:10px;">
          <span style="
            width: 36px;
            height: 36px;
            border-radius: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: conic-gradient(from 180deg at 50% 50%, #4f46e5, #7c3aed, #ec4899, #4f46e5);
            color:#0b1020;
            font-weight: 800;
            font-size: 18px;
            box-shadow: 0 0 18px rgba(129,140,248,0.7);
          ">
            P
          </span>
          <div style="text-align:left;">
            <div style="font-weight:600;font-size:18px;color:#f9fafb;letter-spacing:0.04em;text-transform:uppercase;">
              Prepare With AI
            </div>
            <div style="font-size:11px;color:#9ca3af;">
              AI-powered interview & speech practice
            </div>
          </div>
        </div>
      </div>

      <!-- Title -->
      <h2 style="
        color:#e5e7eb;
        text-align:left;
        font-size:22px;
        margin: 10px 0 8px;
      ">
        ${title}
      </h2>

      <!-- Intro -->
      <p style="
        font-size:14px;
        line-height:1.7;
        margin:0 0 14px;
        color:#d1d5db;
      ">
        ${intro}
      </p>

      <!-- Main content card -->
      <div style="
        margin: 14px 0 18px;
        padding: 14px 16px;
        border-radius: 14px;
        background: radial-gradient(circle at top left, rgba(129,140,248,0.14), rgba(15,23,42,0.95));
        border: 1px solid rgba(75,85,99,0.9);
      ">
        ${contentHtml}
      </div>

      <!-- Footer note -->
      <p style="
        font-size:12px;
        line-height:1.6;
        margin-top:10px;
        color:#9ca3af;
      ">
        ${
          footerNote ||
          `If you didn't expect this email, you can safely ignore it.`
        }
      </p>

      <!-- Signature -->
      <p style="margin-top:18px;font-size:12px;color:#6b7280;">
        — The Prepare With AI Team<br />
        Practice interviews & public speaking with AI
      </p>
    </div>
  `;
}

// ---------- Base mail sender ----------
async function sendMail({ to, subject, text, html }) {
  try {
    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
    });

    console.log("📧 Mail sent:", subject, data.id || data.message);
    return true;
  } catch (err) {
    console.error("❌ Failed to send mail:", subject, err.message);
    return false;
  }
}

// =============== 1) OTP EMAIL (as you had) ===============
async function sendOTPEmail(email, otp, note) {
  const subject = `🔐 ${note} – Prepare With AI`;
  const text = `Your verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`;

  const html = baseTemplate({
    title: `🔐 ${note}`,
    intro: `
      You're almost done. Use the one-time code below to continue.
    `,
    contentHtml: `
      <p style="font-size:14px;margin:0 0 10px;color:#e5e7eb;">
        This code is valid for <b>10 minutes</b>.
      </p>
      <div style="
        text-align:center;
        background:linear-gradient(135deg,#4f46e5,#7c3aed);
        color:#f9fafb;
        font-size:28px;
        font-weight:700;
        letter-spacing:0.25em;
        padding:14px 0;
        border-radius:12px;
        margin-top:6px;
        box-shadow:0 0 20px rgba(129,140,248,0.6);
      ">
        ${otp}
      </div>
    `,
    footerNote: `
      If you didn't request this code, you can safely ignore this email.
    `,
  });

  return sendMail({ to: email, subject, text, html });
}

// =============== 2) TRANSFER EMAILS (sender + receiver) ===============

async function sendTransferEmails({
  senderEmail,
  receiverEmail,
  senderName,
  receiverName,
  amount,
  credits,
}) {
  const amountStr = `${amount} credit${amount === 1 ? "" : "s"}`;

  // For sender
  const senderSubject = `📤 Credit Transfer Confirmed – ${amountStr}`;
  const senderText = `You successfully transferred ${amountStr} to ${receiverName}.`;

  const senderHtml = baseTemplate({
    title: "📤 Credit Transfer Confirmed",
    intro: `Hi ${senderName || "there"}, your credit transfer was successful.`,
    contentHtml: `
      <p style="margin:0 0 8px;font-size:14px;color:#e5e7eb;">
        You’ve transferred:
      </p>
      <p style="font-size:26px;font-weight:700;color:#f97316;margin:0 0 8px;">
        ${amountStr}
      </p>
      <p style="font-size:14px;margin:0 0 6px;">
        Recipient: <b>${receiverName || receiverEmail}</b><br/>
        Email: <span style="color:#facc15;">${receiverEmail}</span>
      </p>
      
    `,
    footerNote:
      "If you did not authorize this transfer, please contact us immediately at +816-335-5277 or create urgent ticket .",
  });

  // For receiver
  const receiverSubject = `📥 You Received ${amountStr} on Prepare With AI`;
  const receiverText = `You received ${amountStr} from ${senderName || senderEmail}.`;

  const receiverHtml = baseTemplate({
    title: "📥 Credits Received",
    intro: `Hi ${
      receiverName || "there"
    }, credits have been added to your Prepare With AI account.`,
    contentHtml: `
      <p style="margin:0 0 8px;font-size:14px;">
        Amount received:
      </p>
      <p style="font-size:26px;font-weight:700;color:#22c55e;margin:0 0 8px;">
        ${amountStr}
      </p>
      <p style="font-size:14px;margin:0;">
        Sender: <b>${senderName || senderEmail}</b><br/>
        Email: <span style="color:#facc15;">${senderEmail}</span>
      </p>
    `,
    footerNote:
      "You can view your updated credit balance in your Prepare With AI dashboard.",
  });

  const senderOk = await sendMail({
    to: senderEmail,
    subject: senderSubject,
    text: senderText,
    html: senderHtml,
  });

  const receiverOk = await sendMail({
    to: receiverEmail,
    subject: receiverSubject,
    text: receiverText,
    html: receiverHtml,
  });

  return senderOk && receiverOk;
}

// =============== 3) WELCOME EMAIL FOR NEW ACCOUNT ===============
async function sendWelcomeEmail({ email, firstName }) {
  const subject = "🎉 Welcome to Prepare With AI!";
  const text =
    "Welcome to Prepare With AI! You can now start practicing job interviews and public speeches with AI-powered feedback.";

  const html = baseTemplate({
    title: "🎉 Welcome to Prepare With AI",
    intro: `Hi ${
      firstName || "there"
    }, thanks for creating an account with Prepare With AI.`,
    contentHtml: `
      <p style="font-size:14px;margin:0 0 8px;">
        With Us you can:
      </p>
      <ul style="font-size:14px;line-height:1.6;margin:0 0 4px 18px;color:#e5e7eb;">
        <li>Run realistic, AI-powered mock interviews.</li>
        <li>Practice public speeches with live transcription.</li>
        <li>Get structured feedback so you can improve session by session.</li>
      </ul>
      <p style="font-size:13px;margin-top:10px;color:#9ca3af;">
        You can manage your credits, sessions, and feedback anytime from your dashboard.
      </p>
    `,
    footerNote:
      "If you didn’t create this account, please contact us: support@prepwithai.net.",
  });

  return sendMail({ to: email, subject, text, html });
}

// // =============== 4) STRIPE PAYMENT RECEIPT ===============
// async function sendPaymentReceiptEmail({
//   email,
//   firstName,
//   amount, 
//   credits, 
//   paymentIntentId,
//   createdAt,
// }) {
//   const amountStr = `$${Number(amount || 0).toFixed(2)}`;
//   const creditsStr = `${credits} credit${credits === 1 ? "" : "s"}`;
//   const subject = `🧾 Payment Receipt – ${amountStr}`;

//   const text = `Thank you for your purchase on Prepare With AI.\nAmount: ${amountStr}\nCredits: ${creditsStr}\nReference: ${paymentIntentId}`;

//   const dateLabel = createdAt
//     ? new Date(createdAt).toLocaleString()
//     : new Date().toLocaleString();

//   const html = baseTemplate({
//     title: "🧾 Payment Receipt",
//     intro: `Hi ${
//       firstName || "there"
//     }, thank you for your purchase on Prepare With AI.`,
//     contentHtml: `
//       <p style="font-size:14px;margin:0 0 8px;">
//         Here are your payment details:
//       </p>
//       <table style="width:100%;font-size:14px;border-collapse:collapse;">
//         <tr>
//           <td style="padding:4px 0;color:#9ca3af;">Amount</td>
//           <td style="padding:4px 0;text-align:right;color:#f97316;font-weight:600;">
//             ${amountStr}
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:4px 0;color:#9ca3af;">Credits</td>
//           <td style="padding:4px 0;text-align:right;color:#22c55e;font-weight:600;">
//             ${creditsStr}
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:4px 0;color:#9ca3af;">Date</td>
//           <td style="padding:4px 0;text-align:right;">
//             ${dateLabel}
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:4px 0;color:#9ca3af;">Reference</td>
//           <td style="padding:4px 0;text-align:right;font-family:monospace;font-size:12px;">
//             ${paymentIntentId}
//           </td>
//         </tr>
//       </table>
//       <p style="font-size:13px;margin-top:10px;color:#9ca3af;">
//         If you have any questions about this charge, please reply to this email.
//       </p>
//     `,
//     footerNote:
//       "Card processing is handled securely by Stripe. Prepare With AI only stores non-sensitive transaction references for record keeping.",
//   });

//   return sendMail({ to: email, subject, text, html });
// }
async function sendCreditReceiptEmail({
  email,
  firstName,
  credits,
  amount,
  currency = "USD",
  transactionId,
  paymentIntentId,
  balanceAfter,
  createdAt,
}) {
  const safeName = firstName || "there";
  const subject = `🧾 Your credits receipt – Prepare With AI`;
  const text = `
Hi ${safeName},

Thanks for purchasing ${credits} practice credits on Prepare With AI.

Amount: ${currency.toUpperCase()} ${Number(amount).toFixed(2)}
Credits purchased: ${credits}
Transaction ID: ${paymentIntentId || transactionId}
Date: ${createdAt}

Your new credit balance: ${balanceAfter} credits.

If you didn’t make this purchase or have any questions, just reply to this email.

— The Prepare With AI Team
`.trim();

  const frontendUrl = process.env.FRONTEND_URL || "https://prepwithai.net";

  const html = baseTemplate({
    title: "🧾 Your credits receipt",
    intro: `
      Hi <b>${safeName}</b>,<br/>
      Thanks for adding more practice credits to your Prepare With AI account.
      Here’s a summary of your purchase.
    `,
    contentHtml: `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#e5e7eb;">
        <tr>
          <td align="left" style="padding:4px 0;color:#9ca3af;">
            Credits purchased
          </td>
          <td align="right" style="padding:4px 0;font-weight:600;">
            ${credits}
          </td>
        </tr>
        <tr>
          <td align="left" style="padding:4px 0;color:#9ca3af;">
            Amount
          </td>
          <td align="right" style="padding:4px 0;font-weight:600;">
            ${currency.toUpperCase()} ${Number(amount).toFixed(2)}
          </td>
        </tr>
        <tr>
          <td align="left" style="padding:4px 0;color:#9ca3af;">
            Transaction ID
          </td>
          <td align="right" style="padding:4px 0;font-family:monospace;font-size:12px;">
            ${paymentIntentId || transactionId}
          </td>
        </tr>
        <tr>
          <td align="left" style="padding:4px 0;color:#9ca3af;">
            Date
          </td>
          <td align="right" style="padding:4px 0;">
            ${createdAt}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 0 0;border-top:1px dashed rgba(148,163,184,0.6);"></td>
        </tr>
        <tr>
          <td align="left" style="padding:6px 0;color:#9ca3af;">
            New credit balance
          </td>
          <td align="right" style="padding:6px 0;font-weight:600;">
            ${balanceAfter} credits
          </td>
        </tr>
      </table>

      <div style="margin-top:18px;text-align:center;">
        <a
          href="${frontendUrl}/dashboard"
          style="
            display:inline-block;
            padding:10px 20px;
            border-radius:999px;
            background:linear-gradient(135deg,#4f46e5,#7c3aed);
            color:#f9fafb;
            font-size:13px;
            font-weight:600;
            text-decoration:none;
            letter-spacing:0.06em;
            text-transform:uppercase;
          "
        >
          START PRACTICING NOW
        </a>
      </div>
    `,
    footerNote: `
      If you didn’t make this purchase, please reply to this email so we can help.
    `,
  });

  return sendMail({ to: email, subject, text, html });
}



// =============== 6) SUPPORT TICKET UPDATE ===============
async function sendTicketUpdateEmail({
  email,
  firstName,
  ticketId,
  subject: ticketSubject,
  status,
  updatedBy,
}) {
  const subject = `🎧 Ticket #${ticketId} Status: ${status}`;
  const text = `Your support ticket "${ticketSubject}" (ID: ${ticketId}) has been updated to status: ${status}.`;

  const statusLabel = String(status || "").toUpperCase();

  const html = baseTemplate({
    title: "🎧 Support Ticket Update",
    intro: `Hi ${firstName || "there"}, your support ticket has been updated.`,
    contentHtml: `
      <p style="font-size:14px;margin:0 0 6px;">
        Ticket: <b>#${ticketId}</b>
      </p>
      <p style="font-size:14px;margin:0 0 6px;">
        Subject: <span style="color:#e5e7eb;">${ticketSubject}</span>
      </p>
      <p style="font-size:14px;margin:0 0 8px;">
        New status:
        <span style="
          display:inline-block;
          padding:2px 10px;
          border-radius:999px;
          background-color:#0f172a;
          border:1px solid #1e293b;
          color:#fbbf24;
          font-size:12px;
          font-weight:600;
        ">
          ${statusLabel}
        </span>
      </p>
      ${
        updatedBy
          ? `<p style="font-size:13px;margin:0;color:#9ca3af;">
               Updated by: <b>${updatedBy}</b>
             </p>`
          : ""
      }
      <p style="font-size:13px;margin-top:10px;color:#9ca3af;">
        You can reply to this email or continue the conversation inside the support ticket page in your dashboard.
      </p>
    `,
    footerNote:
      "If you no longer need help on this issue, you can mark the ticket as resolved in your Prepare With AI account.",
  });

  return sendMail({ to: email, subject, text, html });
}

module.exports = {
  sendOTPEmail,
  sendTransferEmails,
  sendWelcomeEmail,
  // sendPaymentReceiptEmail,
  sendCreditReceiptEmail,
  sendTicketUpdateEmail,
};


