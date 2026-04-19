const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  specialization: String,
  bio: String,
  experience: Number,
  rating: { type: Number, default: 4.5 },
  reviews: { type: Number, default: 0 },
  hospital: String,
  degrees: [String],
  fees: Number,
  availability: { type: String, default: "Available" },
  role: { type: String, default: "doctor" }
});

module.exports = mongoose.model("Doctor", doctorSchema);