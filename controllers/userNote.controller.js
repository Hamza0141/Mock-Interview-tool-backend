const userNoteService = require("../services/userNote.service");

async function addUserNote(req, res) {
  console.log("note is running");
  try {
      const { note_title, note_text, note_label } = req.body;
      const profile_id = req.user.profile_id; // from verifyToken middleware
      console.log(req.user);

    if (!note_title || !note_text) {
      return res
        .status(400)
        .json({ error: "Note title and text are required." });
    }

    const noteData = { profile_id, note_title, note_text, note_label };
    const addedNote = await userNoteService.addNote(noteData);

    if (!addedNote) {
      return res.status(400).json({ error: "Couldn't add the note." });
    }

    return res.status(201).json({
      success: true,
      message: "Note added successfully.",
      data: addedNote,
    });
  } catch (err) {
    console.error("❌ addUserNote error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function getUserNotes(req, res) {
  try {
    const profile_id = req.user.profile_id;

    const notes = await userNoteService.getNotes(profile_id);
    if (notes.length == 0){
      return res.status(200).json({
        message: "No Notes available.",
      });
    }
      return res.status(200).json({
        success: true,
        data: notes,
      });
  } catch (err) {
    console.error("❌ getUserNotes error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function deleteUserNote(req, res) {
  try {
    const profile_id = req.user.profile_id;
    const { note_id } = req.params;

    if (!note_id) {
      return res.status(400).json({ error: "note_id is required." });
    }

    const deleted = await userNoteService.deleteNote(profile_id, note_id);
    if (!deleted) {
      return res.status(404).json({ error: "Note not found or unauthorized." });
    }

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (err) {
    console.error("❌ deleteUserNote error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = {
  addUserNote,
  getUserNotes,
  deleteUserNote,
};
