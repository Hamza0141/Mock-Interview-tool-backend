// const FormData = require("form-data");
// const Mailgun = require("mailgun.js");

// const mailgun = new Mailgun(FormData);
// const mg = mailgun.client({
//   username: "api",
//   key: process.env.MAILGUN_API_KEY,
// });

// async function sendOTPEmail(email, otp, note ) {
//   try {
//     const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
//       from: `Self Mock AI <postmaster@${process.env.MAILGUN_DOMAIN}>`,
//       to: [email],
//       subject: `🔐 ${note} - Self Mock AI`,
//       text: `Your verification code is ${otp}. It expires in 10 minutes.`,
//       html: `
//         <div style="
//           background-color:#f9fafc;
//           padding:25px;
//           font-family:'Segoe UI',sans-serif;
//           color:#333;
//           border-radius:10px;
//           max-width:600px;
//           margin:auto;
//           box-shadow:0 4px 10px rgba(0,0,0,0.1);
//         ">
//           <h2 style="color:#007bff;text-align:center;">🔐 ${note} </h2>
//           <p style="font-size:16px;line-height:1.6;">
//             Thank you for signing up for <b>Self Mock AI</b>!  
//             To activate your account, please use the verification code below.
//           </p>
//           <div style="
//             text-align:center;
//             background:#007bff;
//             color:#fff;
//             font-size:28px;
//             font-weight:bold;
//             letter-spacing:3px;
//             padding:15px 0;
//             border-radius:8px;
//             margin:25px 0;
//           ">
//             ${otp}
//           </div>
//           <p style="font-size:15px;line-height:1.6;text-align:center;">
//             This code will expire in <b>10 minutes</b>.  
//             If you didn’t request this, please ignore this message.
//           </p>
//           <p style="margin-top:25px;font-size:13px;color:#888;text-align:center;">
//             — The Self Mock Team
//           </p>
//         </div>
//       `,
//     });

//     console.log("✅ OTP email sent:", data.id || data.message);
//     return true;
//   } catch (error) {
//     console.error("❌ Failed to send OTP email:", error);
//     return false;
//   }
// }

// module.exports = {
//   sendOTPEmail,
// };


const FormData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

const FROM_NAME = "SelfMock";
const FROM_EMAIL = `SelfMock <postmaster@${process.env.MAILGUN_DOMAIN}>`;

// ---------- Base template helper ----------
function baseTemplate({ title, intro, contentHtml, footerNote }) {
  return `
    <div style="
      background-color:#0b1020;
      padding:24px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      color:#e5e7eb;
      border-radius:16px;
      max-width:640px;
      margin:auto;
      box-shadow:0 18px 45px rgba(0,0,0,0.55);
      border:1px solid #1f2937;
    ">
      <div style="text-align:center;margin-bottom:18px;">
        <div style="display:inline-flex;align-items:center;gap:8px;">
          <span style="
            width:34px;height:34px;border-radius:12px;
            display:inline-flex;align-items:center;justify-content:center;
            background:linear-gradient(135deg,#f97316,#fb923c);
            color:#0b1020;font-weight:700;font-size:18px;
          ">
            M
          </span>
          <span style="font-weight:600;font-size:18px;color:#f9fafb;">
            SelfMock
          </span>
        </div>
      </div>

      <h2 style="color:#f97316;text-align:left;font-size:22px;margin:0 0 10px;">
        ${title}
      </h2>

      <p style="font-size:14px;line-height:1.6;margin:0 0 14px;color:#e5e7eb;">
        ${intro}
      </p>

      <div style="
        margin:14px 0 18px;
        padding:14px 16px;
        border-radius:12px;
        background-color:#020617;
        border:1px solid #1e293b;
      ">
        ${contentHtml}
      </div>

      <p style="font-size:12px;line-height:1.5;margin-top:10px;color:#9ca3af;">
        ${footerNote ||
          `If you didn't expect this email, you can safely ignore it.`}
      </p>

      <p style="margin-top:18px;font-size:12px;color:#6b7280;">
        — The SelfMock Team<br />
        AI-powered mock interviews & speech practice
      </p>
    </div>
  `;
}

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

// =============== 1) OTP EMAIL (generic) ===============
async function sendOTPEmail(email, otp, note) {
  const subject = `🔐 ${note} – SelfMock`;
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
        background:linear-gradient(135deg,#f97316,#fb923c);
        color:#111827;
        font-size:28px;
        font-weight:700;
        letter-spacing:0.25em;
        padding:14px 0;
        border-radius:10px;
        margin-top:6px;
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
  const receiverSubject = `📥 You Received ${amountStr} on SelfMock`;
  const receiverText = `You received ${amountStr} from ${senderName || senderEmail}.`;

  const receiverHtml = baseTemplate({
    title: "📥 Credits Received",
    intro: `Hi ${receiverName || "there"}, credits have been added to your SelfMock account.`,
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
      "You can view your updated credit balance in your SelfMock dashboard.",
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
  const subject = "🎉 Welcome to SelfMock!";
  const text =
    "Welcome to SelfMock! You can now start practicing job interviews and public speeches with AI-powered feedback.";

  const html = baseTemplate({
    title: "🎉 Welcome to SelfMock",
    intro: `Hi ${firstName || "there"}, thanks for creating an account with SelfMock.`,
    contentHtml: `
      <p style="font-size:14px;margin:0 0 8px;">
        With SelfMock you can:
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
      "If you didn’t create this account, please contact us: hamzaserke@gmail.com.",
  });

  return sendMail({ to: email, subject, text, html });
}

// =============== 4) STRIPE PAYMENT RECEIPT ===============
async function sendPaymentReceiptEmail({
  email,
  firstName,
  amount, 
  credits, 
  paymentIntentId,
  createdAt,
}) {
  const amountStr = `$${Number(amount || 0).toFixed(2)}`;
  const creditsStr = `${credits} credit${credits === 1 ? "" : "s"}`;
  const subject = `🧾 Payment Receipt – ${amountStr}`;

  const text = `Thank you for your purchase on SelfMock.\nAmount: ${amountStr}\nCredits: ${creditsStr}\nReference: ${paymentIntentId}`;

  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleString()
    : new Date().toLocaleString();

  const html = baseTemplate({
    title: "🧾 Payment Receipt",
    intro: `Hi ${firstName || "there"}, thank you for your purchase on SelfMock.`,
    contentHtml: `
      <p style="font-size:14px;margin:0 0 8px;">
        Here are your payment details:
      </p>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;color:#9ca3af;">Amount</td>
          <td style="padding:4px 0;text-align:right;color:#f97316;font-weight:600;">
            ${amountStr}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#9ca3af;">Credits</td>
          <td style="padding:4px 0;text-align:right;color:#22c55e;font-weight:600;">
            ${creditsStr}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#9ca3af;">Date</td>
          <td style="padding:4px 0;text-align:right;">
            ${dateLabel}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#9ca3af;">Reference</td>
          <td style="padding:4px 0;text-align:right;font-family:monospace;font-size:12px;">
            ${paymentIntentId}
          </td>
        </tr>
      </table>
      <p style="font-size:13px;margin-top:10px;color:#9ca3af;">
        If you have any questions about this charge, please reply to this email.
      </p>
    `,
    footerNote:
      "Card processing is handled securely by Stripe. SelfMock only stores non-sensitive transaction references for record keeping.",
  });

  return sendMail({ to: email, subject, text, html });
}

// =============== 5) SUPPORT TICKET UPDATE ===============
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
      "If you no longer need help on this issue, you can mark the ticket as resolved in your SelfMock account.",
  });

  return sendMail({ to: email, subject, text, html });
}

module.exports = {
  sendOTPEmail,
  sendTransferEmails,
  sendWelcomeEmail,
  sendPaymentReceiptEmail,
  sendTicketUpdateEmail,
};


