const express = require("express");
const router = express.Router();

const {
  bookAppointment,
  getAppointments
} = require("../controllers/appointmentController");

const auth = require("../middleware/authMiddleware");

// 🔒 protected routes
router.post("/book", auth, bookAppointment);
router.get("/", auth, getAppointments);

module.exports = router;