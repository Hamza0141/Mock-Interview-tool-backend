const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const userNotesControl = require("../controllers/userNote.controller");
const  {verifyToken}  = require ( "../middlewares/auth");



router.post("/api/user/note", verifyToken, userNotesControl.addUserNote);
router.get("/api/user/note", verifyToken, userNotesControl.getUserNotes);
router.delete(
  "/api/user/note/:note_id",
  verifyToken,
  userNotesControl.deleteUserNote
);

module.exports = router
