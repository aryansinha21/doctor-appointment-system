const router = require("express").Router();
const { addDoctor, getDoctors } = require("../controllers/doctorController");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.post("/add", auth, admin, addDoctor);
router.get("/", getDoctors);

module.exports = router;