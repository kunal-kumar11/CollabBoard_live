const express = require("express");
const router = express.Router();
const Drawing = require("../models/Drawing");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/auth"); // <-- Make sure this exists
const SECRET_KEY = "collab_it";
// Save drawing (Admin only)
// Save drawing
router.post("/save", verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Only admin can save." });

  const { roomId, image } = req.body;
  const uploader = req.user.email;
  const name = req.user.name;

  try {
    const saved = await Drawing.create({ roomId, uploader, name, image });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to save drawing." });
  }
});

// // Get all drawings for a specific room (public)
// router.get("/:roomId", async (req, res) => {
//   try {
//     const drawings = await Drawing.find({ roomId: req.params.roomId }).sort({ createdAt: -1 });
//     res.json(drawings);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch drawings." });
//   }
// });

// Get all drawings uploaded by the admin (for dashboard gallery)
router.get("/admin/images", verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Only admin can view this." });

  try {
    const drawings = await Drawing.find({ uploader: req.user.email }).sort({ createdAt: -1 });
    res.json(drawings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin drawings." });
  }
});

// Delete drawing by ID (only by admin who uploaded)
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ error: "Drawing not found." });

    if (!req.user.isAdmin || drawing.uploader !== req.user.email) {
      return res.status(403).json({ error: "Only uploader admin can delete this drawing." });
    }

    await drawing.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete drawing." });
  }
});


router.post("/token", (req, res) => {
   const { email, name, isAdmin } = req.body;
  const token = jwt.sign({ email, name, isAdmin }, SECRET_KEY, { expiresIn: "12h" });
  res.json({ token });
});


module.exports = router;
