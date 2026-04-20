const Doctor = require("../models/Doctor");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

exports.addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      !specialization?.trim()
    ) {
      return res
        .status(400)
        .json({
          msg: "Name, email, password, and specialization are required",
        });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingDoctor = await Doctor.findOne({ email: normalizedEmail });
    if (existingDoctor) return res.status(400).json({ msg: "Doctor exists" });

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ msg: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);

    const doctor = new Doctor({
      name: name.trim(),
      email: normalizedEmail,
      password: hash,
      specialization: specialization.trim(),
    });
    await doctor.save();

    return res.status(201).json({
      msg: "Doctor added",
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        rating: doctor.rating,
        reviews: doctor.reviews,
        experience: doctor.experience,
        fees: doctor.fees,
        hospital: doctor.hospital,
        availability: doctor.availability,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    return res.status(500).json({ msg: "Unable to add doctor" });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    return res.json(doctors);
  } catch (err) {
    return res.status(500).json({ msg: "Unable to fetch doctors" });
  }
};
