const User = require("../models/User");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

// register patient or admin
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, adminKey } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res
        .status(400)
        .json({ msg: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    if (role && !["patient", "admin"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role selected" });
    }

    const normalizedEmail = normalizeEmail(email);

    let user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ msg: "User exists" });

    const doctorAccount = await Doctor.findOne({ email: normalizedEmail });
    if (doctorAccount)
      return res.status(400).json({ msg: "Email already in use" });

    if (role === "admin") {
      if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ msg: "Invalid admin key" });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const userRole = role === "admin" ? "admin" : "patient";

    user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hash,
      role: userRole,
    });
    await user.save();

    return res.status(201).json({ msg: "User registered" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    return res.status(500).json({ msg: "Unable to register user" });
  }
};

// login for patient, admin, and doctor
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: "JWT secret is not configured" });
    }

    const normalizedEmail = normalizeEmail(email);

    let account = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    let accountType = "user";

    if (!account) {
      account = await Doctor.findOne({ email: normalizedEmail }).select(
        "+password",
      );
      accountType = "doctor";
    }

    if (!account)
      return res.status(401).json({ msg: "Invalid email or password" });

    const match = await bcrypt.compare(password, account.password);
    if (!match)
      return res.status(401).json({ msg: "Invalid email or password" });

    const role = accountType === "doctor" ? "doctor" : account.role;
    const token = jwt.sign({ id: account._id, role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
        role,
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Unable to login" });
  }
};
