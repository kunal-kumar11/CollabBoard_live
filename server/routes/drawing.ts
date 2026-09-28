import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Drawing from "../models/Drawing";
import verifyToken, { AuthRequest } from "../middleware/auth";

const router = express.Router();

const SECRET_KEY = "collab_it";

// ==================== SAVE DRAWING ====================

router.post(
  "/save",
  verifyToken,
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    if (!authReq.user.isAdmin) {
      return res.status(403).json({
        error: "Admin only",
      });
    }

    const { roomId, image } = req.body;

    const uploader = authReq.user.email;
    const name = authReq.user.name;

    try {
      const saved = await Drawing.create({
        roomId,
        uploader,
        name,
        image,
      });

      return res.status(201).json(saved);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to save drawing",
      });
    }
  }
);

// ==================== GET ADMIN DRAWINGS ====================

router.get(
  "/admin/images",
  verifyToken,
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    if (!authReq.user.isAdmin) {
      return res.status(403).json({
        error: "Admin only",
      });
    }

    try {
      const drawings = await Drawing.find({
        uploader: authReq.user.email,
      }).sort({
        createdAt: -1,
      });

      return res.json(drawings);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to fetch drawings",
      });
    }
  }
);

// ==================== DELETE DRAWING ====================

router.delete(
  "/delete/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    try {
      const drawing = await Drawing.findById(req.params.id);

      if (!drawing) {
        return res.status(404).json({
          error: "Drawing not found",
        });
      }

      if (
        !authReq.user.isAdmin ||
        drawing.uploader !== authReq.user.email
      ) {
        return res.status(403).json({
          error: "Not allowed",
        });
      }

      await drawing.deleteOne();

      return res.json({
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        error: "Failed to delete drawing",
      });
    }
  }
);

// ==================== GENERATE TOKEN ====================

router.post(
  "/token",
  (req: Request, res: Response) => {
    const { email, name, isAdmin } = req.body;

    const token = jwt.sign(
      {
        email,
        name,
        isAdmin,
      },
      SECRET_KEY,
      {
        expiresIn: "12h",
      }
    );

    return res.json({
      token,
    });
  }
);

export default router;