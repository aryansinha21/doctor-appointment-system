const User = require("../models/User");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// register patient or admin
exports.register = async (req, res) => {
  const { name, email, password, role, adminKey } = req.body;

  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ msg: "User exists" });

  if (role === "admin") {
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ msg: "Invalid admin key" });
    }
  }

  const hash = await bcrypt.hash(password, 10);
  const userRole = role === "admin" ? "admin" : "patient";

  user = new User({ name, email, password: hash, role: userRole });
  await user.save();

  res.json({ msg: "User registered" });
};

// login for patient, admin, and doctor
exports.login = async (req, res) => {
  const { email, password } = req.body;

  let account = await User.findOne({ email });
  let accountType = "user";

  if (!account) {
    account = await Doctor.findOne({ email });
    accountType = "doctor";
  }

  if (!account) return res.status(400).json({ msg: "Invalid" });

  const match = await bcrypt.compare(password, account.password);
  if (!match) return res.status(400).json({ msg: "Invalid" });

  const role = accountType === "doctor" ? "doctor" : account.role;
  const token = jwt.sign(
    { id: account._id, role },
    process.env.JWT_SECRET
  );

  res.json({
    token,
    user: {
      id: account._id,
      name: account.name,
      email: account.email,
      role
    }
  });
};