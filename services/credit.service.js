const conn = require("../config/db.config");
const userService = require("./user.Service");
const crypto = require("crypto");
//Mailer
const mailService= require("../middlewares/authMailgun")
// import notification
const notificationService = require("./notification.service");

async function transferCredit(
  senderFirstName, sender_id,
  receiver_email,
  senderEmail,
  amount
) {
  const connection = await conn.getConnection(); // get pooled connection
  await connection.beginTransaction();

  try {
    // Validate receiver exists
    const receiver = await userService.getUserByEmail(receiver_email);
    if (!receiver) {
      await connection.rollback();
      return { success: false, message: "Receiver does not exist" };
    }
    const receiverId = receiver.profile_id;
    console.log("receverPP" + receiverId);
    // Fetch sender balance
    const [senderRows] = await connection.query(
      "SELECT credit_balance FROM users WHERE profile_id = ? FOR UPDATE",
      [sender_id]
    );

    if (senderRows.length === 0) {
      await connection.rollback();
      return { success: false, message: "Sender not found" };
    }
    console.log(senderRows[0]);
    const senderCredits = parseFloat(senderRows[0].credit_balance || 0);

    // Validate balance
    if (senderCredits < amount) {
      await connection.rollback();
      return { success: false, message: "Insufficient balance" };
    }

    if (senderCredits - amount < 0) {
      await connection.rollback();
      return { success: false, message: "Overdraft not allowed" };
    }

    // Deduct sender’s credits
    await connection.query(
      "UPDATE users SET credit_balance = credit_balance - ? WHERE profile_id = ?",
      [amount, sender_id]
    );

    // Add to receiver
    await connection.query(
      "UPDATE users SET credit_balance = credit_balance + ? WHERE user_email = ?",
      [amount, receiver_email]
    );

    const transfer_id = crypto.randomBytes(6).toString("hex");

    await connection.query(
      "INSERT INTO transfers (transfer_id, sender_id, receiver_email, amount) VALUES (?, ?, ?, ?)",
      [transfer_id, sender_id || null, receiver_email, amount]
    );
    await connection.commit();

    //create notification for sender
    await notificationService.createNotification({
      profile_id: sender_id,
      type: "credit",
      title: "Credits sent ",
      body: `You successfully transferred ${amount} credits to ${receiver_email}.`,
      entity_type: "credit_transfer",
      entity_id: transfer_id,
    });

    //create notification for receiver

    await notificationService.createNotification({
      profile_id: receiverId,
      type: "credit",
      title: "Credits received",
      body: `You successfully receive ${amount} credits from ${senderFirstName}.`,
      entity_type: "credit_transfer",
      entity_id: transfer_id,
    });

await mailService.sendTransferEmails({
  senderEmail: senderEmail,
  receiverEmail: receiver_email,
  senderName: senderFirstName,
  receiverName: receiver.first_name,
  amount,
});

    return {
      success: true,
      message: "Transfer completed",
      data: {
        sender_id,
        receiver_email,
        transfer_id,
        amount,
        new_sender_balance: senderCredits - amount,
      },
    };
    
  } catch (error) {
    await connection.rollback();
    console.error("Error in transferCredit:", error);
    return { success: false, message: "Transfer failed", error: error.message };
  } finally {
    connection.release();
  }
}


async function refundCredit(receiver_email, amount, description) {
  const connection = await conn.getConnection();
  await connection.beginTransaction();

  try {
    // Add credit to receiver
    await connection.query(
      "UPDATE users SET credit_balance = credit_balance + ? WHERE user_email = ?",
      [amount, receiver_email]
    );

    const transfer_id = crypto.randomBytes(6).toString("hex");
    await connection.query(
      "INSERT INTO transfers (transfer_id, sender_id, receiver_email, amount, transaction_type, description) VALUES (?, NULL, ?, ?, 'refund', ?)",
      [transfer_id, receiver_email, amount, description]
    );

    await connection.commit();
    return { success: true, message: "Refund completed", transfer_id };
  } catch (error) {
    await connection.rollback();
    console.error("Error in refundCredit:", error);
    return { success: false, message: error.message };
  } finally {
    connection.release();
  }
}

module.exports = { transferCredit, refundCredit };
