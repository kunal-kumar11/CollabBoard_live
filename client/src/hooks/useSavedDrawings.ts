import { useState } from "react";
import axios from "axios";
import { fabric } from "fabric";

type SavedDrawing = {
  _id: string;
  image: string;
  name: string;
  roomId: string;
  createdAt: string;
};

type UseSavedDrawingsProps = {
  roomId: string | null;
  token: string | null;
  isAdmin: boolean;
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
};

function useSavedDrawings({
  roomId,
  token,
  isAdmin,
  fabricCanvasRef,
}: UseSavedDrawingsProps) {
  const [savedDrawings, setSavedDrawings] =
    useState<SavedDrawing[]>([]);

  const loadSavedImages = async () => {
    const currentToken =
      localStorage.getItem("token");

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/drawings/admin/images`,
        {
          headers: {
            Authorization:
              `Bearer ${currentToken}`,
          },
        }
      );

      setSavedDrawings(res.data);
    } catch (err) {
      console.error(
        "Failed to load drawings",
        err
      );
    }
  };

  const handleSaveDrawing = async () => {
    if (!isAdmin) {
      alert("Only admin can save drawings.");
      return;
    }

    const canvas =
      fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    const dataUrl =
      canvas.toDataURL({
  format: "png",
});

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/drawings/save`,
        {
          roomId,
          image: dataUrl,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      alert("Drawing saved!");

      await loadSavedImages();
    } catch (err) {
      console.error(
        "Save failed",
        err
      );
    }
  };

  const handleDeleteDrawing = async (
    id: string
  ) => {
    if (!isAdmin) {
      alert(
        "Only admin can delete drawings."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this drawing?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/drawings/delete/${id}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      await loadSavedImages();
    } catch (err) {
      console.error(
        "Delete failed",
        err
      );
    }
  };

  return {
    savedDrawings,
    loadSavedImages,
    handleSaveDrawing,
    handleDeleteDrawing,
  };
}

export default useSavedDrawings;