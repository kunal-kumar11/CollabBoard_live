import {
  useEffect,
  useRef,
  useState,
} from "react";

import { fabric } from "fabric";
import { Socket } from "socket.io-client";

import WhiteboardHeader from "../components/WhiteboardHeader";
import WhiteboardToolbar from "../components/WhiteboardToolbar";
import UserList from "../components/UserList";
import CanvasBoard from "../components/CanvasBoard";
import SavedDrawings from "../components/SavedDrawings";
import VoiceControls from "../components/VoiceControls";

import useSavedDrawings from "../hooks/useSavedDrawings";
import useVoiceChat from "../hooks/useVoiceChat";
import useUndoRedo from "../hooks/useUndoRedo";
import useFabricCanvas from "../hooks/useFabricCanvas";
import useSocket from "../hooks/useSocket";
import useRemoteCursors from "../hooks/useRemoteCursors";

type Tool =
  | "pen"
  | "line"
  | "rectangle"
  | "circle";

type User = {
  id: string;
  name: string;
  cursorId: string;
};

function Whiteboard() {
  // =========================
  // STATE
  // =========================

  const [
    currentTool,
    setCurrentTool,
  ] = useState<Tool>("pen");

  const [
    brushColor,
    setBrushColor,
  ] = useState("#000000");

  const [
    brushSize,
    setBrushSize,
  ] = useState(5);

  const [
    backgroundColor,
    setBackgroundColor,
  ] = useState("#ffffff");

  const [
    users,
    setUsers,
  ] = useState<User[]>([]);

  // =========================
  // REFS
  // =========================

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const fabricCanvasRef =
    useRef<fabric.Canvas | null>(
      null
    );

  const socketRef =
    useRef<Socket | null>(
      null
    );

  const currentToolRef =
    useRef<Tool>("pen");

  const brushColorRef =
    useRef("#000000");

  const brushSizeRef =
    useRef(5);

  const backgroundColorRef =
    useRef("#ffffff");

  const isAdminRef =
    useRef(false);

  const cursorsRef =
    useRef<
      Record<
        string,
        HTMLDivElement
      >
    >({});

  const cursorColorsRef =
    useRef<
      Record<string, string>
    >({});

  // =========================
  // CANVAS SYNC STATUS
  // =========================
  //
  // false = waiting for the
  // current room canvas
  //
  // true = safe to draw and
  // broadcast canvas changes
  // =========================

  const isCanvasReadyRef =
    useRef(false);

  // =========================
  // LOCAL STORAGE
  // =========================

  const roomId =
    localStorage.getItem(
      "roomId"
    );

  const name =
    localStorage.getItem(
      "name"
    );

  const token =
    localStorage.getItem(
      "token"
    );

  const isAdmin =
    localStorage.getItem(
      "isAdmin"
    ) === "true";

  // =========================
  // KEEP REFS IN SYNC
  // =========================

  useEffect(() => {
    currentToolRef.current =
      currentTool;
  }, [currentTool]);

  useEffect(() => {
    brushColorRef.current =
      brushColor;
  }, [brushColor]);

  useEffect(() => {
    brushSizeRef.current =
      brushSize;
  }, [brushSize]);

  useEffect(() => {
    backgroundColorRef.current =
      backgroundColor;
  }, [backgroundColor]);

  useEffect(() => {
    isAdminRef.current =
      isAdmin;
  }, [isAdmin]);

  // =========================
  // SAVED DRAWINGS
  // =========================

  const {
    savedDrawings,
    loadSavedImages,
    handleSaveDrawing,
    handleDeleteDrawing,
  } = useSavedDrawings({
    roomId,
    token,
    isAdmin,
    fabricCanvasRef,
  });

  // =========================
  // VOICE CHAT
  // =========================

  const {
    isVoiceJoined,
    isMuted,
    handleJoinVoice,
    handleMuteVoice,
    handleLeaveVoice,
  } = useVoiceChat({
    roomId,
  });

  // =========================
  // EMIT CANVAS
  // =========================

  const emitCanvas = () => {
    // =============================
    // IMPORTANT
    // =============================
    //
    // Never send a canvas update
    // before the initial room state
    // has been loaded.
    // =============================

    if (
      !isCanvasReadyRef.current
    ) {
      return;
    }

    const canvas =
      fabricCanvasRef.current;

    const socket =
      socketRef.current;

    if (!canvas || !socket) {
      return;
    }

    const json =
      canvas.toJSON();

    socket.emit(
      "canvas-update",
      {
        roomId,
        json,
      }
    );
  };

  // =========================
  // UNDO / REDO
  // =========================

  const {
    canUndo,
    canRedo,
    stateStackRef,
    redoStackRef,
    isRestoringRef,
    saveState,
    handleUndo,
    handleRedo,
    updateUndoRedoButtons,
  } = useUndoRedo({
    fabricCanvasRef,
    isAdmin,
    emitCanvas,
  });

  // =========================
  // FABRIC CANVAS
  // =========================

  useFabricCanvas({
    canvasRef,
    fabricCanvasRef,
    currentToolRef,
    brushColorRef,
    brushSizeRef,
    backgroundColorRef,
    saveState,
    emitCanvas,
    isCanvasReadyRef,
  });

  // =========================
  // BACKGROUND COLOR
  // =========================

  const handleBackgroundColorChange = (
    color: string
  ) => {
    // Don't modify the board while
    // initial synchronization is running.
    if (
      !isCanvasReadyRef.current
    ) {
      return;
    }

    setBackgroundColor(color);

    backgroundColorRef.current =
      color;

    const canvas =
      fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.setBackgroundColor(
      color,
      () => {
        canvas.renderAll();

        emitCanvas();
      }
    );
  };

  // =========================
  // REMOTE CURSORS
  // =========================

  const {
    getColorFromName,
    createRemoteCursor,
    removeRemoteCursor,
    removeRemoteCursors,
  } = useRemoteCursors({
    cursorsRef,
    cursorColorsRef,
  });

  // =========================
  // SOCKET.IO
  // =========================

  useSocket({
    roomId,
    name,
    fabricCanvasRef,
    socketRef,
    isAdminRef,
    isRestoringRef,
    stateStackRef,
    redoStackRef,
    updateUndoRedoButtons,
    setUsers,
    cursorsRef,
    cursorColorsRef,
    getColorFromName,
    createRemoteCursor,
    removeRemoteCursor,
    removeRemoteCursors,
    isCanvasReadyRef,
  });

  // =========================
  // DOWNLOAD
  // =========================

  const handleDownload = () => {
    const canvas =
      fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    const dataURL =
      canvas.toDataURL({
        format: "png",
        quality: 1,
      });

    const link =
      document.createElement("a");

    link.href = dataURL;

    link.download =
      `CollabBoard-${roomId}.png`;

    link.click();
  };

  // =========================
  // CLEAR CANVAS
  // =========================

  const handleClear = () => {
    if (!isAdmin) {
      alert(
        "Only admin can clear the canvas."
      );

      return;
    }

    if (
      !isCanvasReadyRef.current
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to clear the dashboard?"
      );

    if (!confirmed) {
      return;
    }

    const canvas =
      fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.clear();

    canvas.backgroundColor =
      backgroundColor;

    canvas.renderAll();

    // Reset undo / redo history
    stateStackRef.current = [];
    redoStackRef.current = [];

    // Save cleared canvas
    // as new initial state
    saveState();

    updateUndoRedoButtons();

    emitCanvas();
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "roomId"
    );

    localStorage.removeItem(
      "name"
    );

    localStorage.removeItem(
      "isAdmin"
    );

    window.location.href =
      "/login";
  };

  // =========================
  // LOAD SAVED IMAGES
  // =========================

  useEffect(() => {
    if (isAdmin) {
      loadSavedImages();
    }
  }, [isAdmin]);

  // =========================
  // JSX
  // =========================

  return (
    <div id="whiteboardPage">

      <WhiteboardHeader
        onLogout={
          handleLogout
        }
      />

      <WhiteboardToolbar
        isAdmin={isAdmin}
        currentTool={
          currentTool
        }
        brushColor={
          brushColor
        }
        brushSize={
          brushSize
        }
        backgroundColor={
          backgroundColor
        }
        canUndo={canUndo}
        canRedo={canRedo}
        fabricCanvasRef={
          fabricCanvasRef
        }
        onClear={
          handleClear
        }
        onUndo={
          handleUndo
        }
        onRedo={
          handleRedo
        }
        onDownload={
          handleDownload
        }
        onSaveDrawing={
          handleSaveDrawing
        }
        onToolChange={
          setCurrentTool
        }
        onBrushColorChange={
          setBrushColor
        }
        onBrushSizeChange={
          setBrushSize
        }
        onBackgroundColorChange={
          handleBackgroundColorChange
        }
      />

      <div id="mainContent">

        <UserList
          users={users}
        />

        <CanvasBoard
          canvasRef={
            canvasRef
          }
        />

        <SavedDrawings
          savedDrawings={
            savedDrawings
          }
          isAdmin={isAdmin}
          onDelete={
            handleDeleteDrawing
          }
        />

      </div>

      <VoiceControls
        isVoiceJoined={
          isVoiceJoined
        }
        isMuted={
          isMuted
        }
        onJoin={
          handleJoinVoice
        }
        onMute={
          handleMuteVoice
        }
        onLeave={
          handleLeaveVoice
        }
      />

    </div>
  );
}

export default Whiteboard;