const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const mongoose = require("mongoose");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    const patientId = req.user.id;

    if (req.user.role !== "patient") {
      return res
        .status(403)
        .json({ msg: "Only patients can book appointments." });
    }

    if (!doctorId || !date || !time) {
      return res
        .status(400)
        .json({ msg: "Doctor, date, and time are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ msg: "Invalid doctor selected" });
    }

    if (!DATE_REGEX.test(date) || !TIME_REGEX.test(time)) {
      return res.status(400).json({ msg: "Invalid date or time format" });
    }

    const doctorExists = await Doctor.exists({ _id: doctorId });
    if (!doctorExists) {
      return res.status(404).json({ msg: "Doctor not found" });
    }

    const appointmentDateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({ msg: "Invalid appointment datetime" });
    }

    if (appointmentDateTime < new Date()) {
      return res
        .status(400)
        .json({ msg: "Cannot book an appointment in the past" });
    }

    const existing = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: "booked",
    });

    if (existing) {
      return res.status(400).json({ msg: "Slot already booked" });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
      time,
    });

    await appointment.save();

    res.status(201).json({ msg: "Appointment booked", appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "patient") {
      query = { patientId: req.user.id };
    } else if (req.user.role === "doctor") {
      query = { doctorId: req.user.id };
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized role" });
    }

    const data = await Appointment.find(query)
      .populate("patientId", "name email")
      .populate("doctorId", "name specialization")
      .sort({ date: 1, time: 1, createdAt: -1 });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ msg: "Unable to fetch appointments" });
  }
};
