const Appointment = require("../models/Appointment");

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    const patientId = req.user.id;

    if (req.user.role !== "patient") {
      return res.status(403).json({ msg: "Only patients can book appointments." });
    }

    const existing = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: "booked"
    });

    if (existing) {
      return res.status(400).json({ msg: "Slot already booked" });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
      time
    });

    await appointment.save();

    res.json({ msg: "Appointment booked", appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAppointments = async (req, res) => {
  let query = {};

  if (req.user.role === "patient") {
    query = { patientId: req.user.id };
  } else if (req.user.role === "doctor") {
    query = { doctorId: req.user.id };
  }

  const data = await Appointment.find(query)
    .populate("patientId", "name email")
    .populate("doctorId", "name specialization");

  res.json(data);
};