const conn = require("../config/db.config");
const userService = require("./user.Service");
const crypto = require("crypto");

async function transferCredit(sender_id, receiver_id, amount) {
  const connection = await conn.getConnection(); // get pooled connection
  await connection.beginTransaction();

  try {
    // Validate receiver exists
    const receiver = await userService.getUserById(receiver_id);
    if (!receiver) {
      await connection.rollback();
      return { success: false, message: "Receiver does not exist" };
    }

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
      "UPDATE users SET credit_balance = credit_balance + ? WHERE profile_id = ?",
      [amount, receiver_id]
    );

    const transfer_id = crypto.randomBytes(6).toString("hex");
    
await connection.query(
  "INSERT INTO transfers (transfer_id, sender_id, receiver_id, amount) VALUES (?, ?, ?, ?)",
  [transfer_id, sender_id || null, receiver_id, amount]
);
    await connection.commit();

    return {
      success: true,
      message: "Transfer completed",
      data: {
        sender_id,
        receiver_id,
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


async function refundCredit(
  receiver_id,
  amount,
  description
) {
  const connection = await conn.getConnection();
  await connection.beginTransaction();

  try {
    // Add credit to receiver
    await connection.query(
      "UPDATE users SET credit_balance = credit_balance + ? WHERE profile_id = ?",
      [amount, receiver_id]
    );

    const transfer_id = crypto.randomBytes(6).toString("hex");
    await connection.query(
      "INSERT INTO transfers (transfer_id, sender_id, receiver_id, amount, transaction_type, description) VALUES (?, NULL, ?, ?, 'refund', ?)",
      [transfer_id, receiver_id, amount, description]
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
