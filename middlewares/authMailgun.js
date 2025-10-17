const FormData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

/**
 * Send OTP Verification Email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
async function sendOTPEmail(email, otp) {
  try {
    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Self Mock AI <postmaster@${process.env.MAILGUN_DOMAIN}>`,
      to: [email],
      subject: "🔐 Verify Your Email - Self Mock AI",
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="
          background-color:#f9fafc;
          padding:25px;
          font-family:'Segoe UI',sans-serif;
          color:#333;
          border-radius:10px;
          max-width:600px;
          margin:auto;
          box-shadow:0 4px 10px rgba(0,0,0,0.1);
        ">
          <h2 style="color:#007bff;text-align:center;">🔐 Email Verification</h2>
          <p style="font-size:16px;line-height:1.6;">
            Thank you for signing up for <b>Self Mock AI</b>!  
            To activate your account, please use the verification code below.
          </p>
          <div style="
            text-align:center;
            background:#007bff;
            color:#fff;
            font-size:28px;
            font-weight:bold;
            letter-spacing:3px;
            padding:15px 0;
            border-radius:8px;
            margin:25px 0;
          ">
            ${otp}
          </div>
          <p style="font-size:15px;line-height:1.6;text-align:center;">
            This code will expire in <b>10 minutes</b>.  
            If you didn’t request this, please ignore this message.
          </p>
          <p style="margin-top:25px;font-size:13px;color:#888;text-align:center;">
            — The Self Mock Team
          </p>
        </div>
      `,
    });

    console.log("✅ OTP email sent:", data.id || data.message);
    return true;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    return false;
  }
}

module.exports = {
  sendOTPEmail,
};

// async function sendSimpleMessage() {
//   const mailgun = new Mailgun(FormData);
//   const mg = mailgun.client({
//     username: "api",
//     key:
//       process.env.MAILGUN_API_KEY

//   });
//   try {
//     const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
//       from: `Self Mock AI<postmaster@${process.env.MAILGUN_DOMAIN}>`,
//       to: ["Hamza Haile <hamzaserke@gmail.com>"],
//       subject: "🚀 Welcome to Self Mock Interview!",
//       text: "Hi Hamza, congratulations! You just sent an email with Mailgun — your integration is live and working perfectly.",
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
//           <h2 style="color:#007bff;">👋 Welcome to Self Mock AI</h2>
//           <p style="font-size:16px;line-height:1.6;">
//             Congratulations, Hamza! Your Mailgun email service is successfully connected.
//           </p>
//           <p style="font-size:16px;line-height:1.6;">
//             You're ready to deliver professional interview practice experiences to your users 🚀
//           </p>
//           <div style="text-align:center;margin-top:25px;">
//             <a href="https://selfmock.com"
//               style="
//                 background-color:#007bff;
//                 color:white;
//                 padding:12px 24px;
//                 text-decoration:none;
//                 border-radius:6px;
//                 display:inline-block;">
//               Visit Self Mock
//             </a>
//           </div>
//           <p style="margin-top:25px;font-size:13px;color:#888;text-align:center;">
//             — The Self Mock Team
//           </p>
//         </div>
//       `,
//     });

//     console.log(data); // logs response data
//   } catch (error) {
//     console.log(error); //logs any error
//   }
// }

// module.exports = {
//   sendSimpleMessage,
// };
