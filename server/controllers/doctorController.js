const Doctor = require("../models/Doctor");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.addDoctor = async (req, res) => {
  const { name, email, password, specialization } = req.body;

  const existingDoctor = await Doctor.findOne({ email });
  if (existingDoctor) return res.status(400).json({ msg: "Doctor exists" });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ msg: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);

  const doctor = new Doctor({ name, email, password: hash, specialization });
  await doctor.save();
  res.json({ msg: "Doctor added", doctor });
};

exports.getDoctors = async (req, res) => {
  const doctors = await Doctor.find();
  res.json(doctors);
};