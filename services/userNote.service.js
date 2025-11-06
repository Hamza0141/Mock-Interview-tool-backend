const conn = require("../config/db.config");

async function addNote({ profile_id, note_title, note_text, note_label }) {
  try {
    const [result] = await conn.query(
      `INSERT INTO user_notes (profile_id, note_title, note_text, note_label)
       VALUES (?, ?, ?, ?)`,
      [profile_id, note_title, note_text, note_label]
    );

    if (result.affectedRows !== 1) return null;

    return {
      note_id: result.insertId,
      profile_id,
      note_title,
      note_text,
      note_label,
    };
  } catch (err) {
    console.error("❌ addNote service error:", err.message);
    return null;
  }
}

async function getNotes(profile_id) {
  try {
    const [rows] = await conn.query(
      `SELECT note_id, note_title, note_text, note_label, created_at
       FROM user_notes
       WHERE profile_id = ?
       ORDER BY created_at DESC`,
      [profile_id]
    );
    return rows;
  } catch (err) {
    console.error("❌ getNotes service error:", err.message);
    return [];
  }
}

async function deleteNote(profile_id, note_id) {
  try {
    const [result] = await conn.query(
      `DELETE FROM user_notes WHERE note_id = ? AND profile_id = ?`,
      [note_id, profile_id]
    );
    return result.affectedRows === 1;
  } catch (err) {
    console.error("❌ deleteNote service error:", err.message);
    return false;
  }
}

module.exports = {
  addNote,
  getNotes,
  deleteNote,
};
