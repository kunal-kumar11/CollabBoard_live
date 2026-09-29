import { useEffect } from "react";

import type {
  MutableRefObject,
  Dispatch,
  SetStateAction,
} from "react";

import { fabric } from "fabric";

import {
  io,
  Socket,
} from "socket.io-client";

// =============================
// TYPES
// =============================

type User = {
  id: string;
  name: string;
  cursorId: string;
};

type CanvasUpdate = {
  json: any;
};

type CanvasState = {
  json: any | null;
};

type MouseMoveData = {
  id: string;
  name: string;
  x: number;
  y: number;
};

type CursorRemoveData = {
  id: string;
};

type DrawingState = {
  objects: any[];
};

type UseSocketProps = {
  roomId: string | null;
  name: string | null;

  fabricCanvasRef: MutableRefObject<
    fabric.Canvas | null
  >;

  socketRef: MutableRefObject<
    Socket | null
  >;

  isAdminRef: MutableRefObject<boolean>;

  isRestoringRef: MutableRefObject<boolean>;

  stateStackRef: MutableRefObject<any[]>;

  redoStackRef: MutableRefObject<any[]>;

  updateUndoRedoButtons: () => void;

  setUsers: Dispatch<
    SetStateAction<User[]>
  >;

  cursorsRef: MutableRefObject<
    Record<string, HTMLDivElement>
  >;

  cursorColorsRef: MutableRefObject<
    Record<string, string>
  >;

  getColorFromName: (
    userName: string
  ) => string;

  createRemoteCursor: (
    cursorId: string,
    userName: string,
    color: string
  ) => HTMLDivElement | null;

  removeRemoteCursor: (
    cursorId: string
  ) => void;

  removeRemoteCursors: () => void;

  // =============================
  // NEW
  // =============================
  //
  // Prevents drawing/broadcasting
  // until the current room canvas
  // has been loaded.
  //
  isCanvasReadyRef: MutableRefObject<boolean>;
};

// =============================
// HOOK
// =============================

function useSocket({
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
}: UseSocketProps) {
  useEffect(() => {
    const canvas =
      fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    // =============================
    // CANVAS IS NOT READY YET
    // =============================

    isCanvasReadyRef.current =
      false;

    // =============================
    // STABLE CURSOR ID
    // =============================

    let cursorId =
      sessionStorage.getItem(
        "collabboard-cursor-id"
      );

    if (!cursorId) {
      cursorId =
        crypto.randomUUID();

      sessionStorage.setItem(
        "collabboard-cursor-id",
        cursorId
      );
    }

    // =============================
    // CREATE SOCKET
    // =============================

    const socket = io(
      import.meta.env.VITE_SERVER_URL
    );

    socketRef.current =
      socket;

    // =============================
    // DRAWING STATE HELPER
    // =============================

    const getDrawingState = (): DrawingState => {
      const canvasJSON =
        canvas.toJSON();

      return {
        // IMPORTANT:
        // Only objects are stored in
        // undo/redo history.
        //
        // Background is intentionally
        // excluded.
        objects:
          canvasJSON.objects || [],
      };
    };

    // =============================
    // COMPARE DRAWING STATES
    // =============================

    const areDrawingStatesEqual = (
      first: DrawingState | undefined,
      second: DrawingState | undefined
    ) => {
      if (!first || !second) {
        return false;
      }

      return (
        JSON.stringify(first.objects) ===
        JSON.stringify(second.objects)
      );
    };

    // =============================
    // ADD REMOTE DRAWING TO HISTORY
    // =============================

    const saveRemoteDrawingState =
      () => {
        if (
          !isAdminRef.current
        ) {
          return;
        }

        const drawingState =
          getDrawingState();

        const lastState =
          stateStackRef.current[
            stateStackRef.current.length - 1
          ] as DrawingState | undefined;

        /*
         * IMPORTANT:
         *
         * If the remote update only
         * changed the background,
         * objects are unchanged.
         *
         * Therefore do NOT add a new
         * undo/redo history entry.
         */
        if (
          areDrawingStatesEqual(
            lastState,
            drawingState
          )
        ) {
          updateUndoRedoButtons();
          return;
        }

        /*
         * A drawing/object actually
         * changed.
         *
         * Add only the drawing objects
         * to Admin's history.
         */
        stateStackRef.current.push(
          drawingState
        );

        if (
          stateStackRef.current
            .length > 50
        ) {
          stateStackRef.current.shift();
        }

        /*
         * A new remote drawing operation
         * invalidates the redo chain.
         */
        redoStackRef.current = [];

        updateUndoRedoButtons();
      };

    // =============================
    // INITIAL CANVAS STATE
    // =============================

    const handleCanvasState = ({
      json,
    }: CanvasState) => {
      // --------------------------------
      // Stop any drawing while restoring
      // --------------------------------

      isRestoringRef.current =
        true;

      if (json) {
        // --------------------------------
        // Existing room:
        // restore the latest board
        // --------------------------------

        canvas.loadFromJSON(
          json,
          () => {
            canvas.renderAll();

            // --------------------------------
            // Start fresh undo/redo history
            // from the synchronized board.
            // --------------------------------

            stateStackRef.current =
              [];

            redoStackRef.current =
              [];

            saveInitialSyncedState();

            isRestoringRef.current =
              false;

            isCanvasReadyRef.current =
              true;

            updateUndoRedoButtons();
          }
        );
      } else {
        // --------------------------------
        // New room:
        // there is no previous board.
        // --------------------------------

        canvas.renderAll();

        stateStackRef.current =
          [];

        redoStackRef.current =
          [];

        saveInitialSyncedState();

        isRestoringRef.current =
          false;

        isCanvasReadyRef.current =
          true;

        updateUndoRedoButtons();
      }
    };

    // =============================
    // SAVE SYNCHRONIZED STATE
    // =============================

    const saveInitialSyncedState =
      () => {
        const drawingState =
          getDrawingState();

        stateStackRef.current.push(
          drawingState
        );

        if (
          stateStackRef.current
            .length > 50
        ) {
          stateStackRef.current.shift();
        }
      };

    socket.on(
      "canvas-state",
      handleCanvasState
    );

    // =============================
    // CANVAS UPDATE
    // =============================

    const handleCanvasUpdate = ({
      json,
    }: CanvasUpdate) => {
      /*
       * IMPORTANT:
       *
       * This update contains the COMPLETE
       * synchronized canvas:
       *
       * - drawing objects
       * - background color
       *
       * We load the complete canvas so
       * everyone gets the background.
       */
      isRestoringRef.current =
        true;

      canvas.loadFromJSON(
        json,
        () => {
          canvas.renderAll();

          isRestoringRef.current =
            false;

          /*
           * IMPORTANT:
           *
           * Admin history receives ONLY
           * drawing/object changes.
           *
           * Background changes are applied
           * to the canvas but do NOT create
           * an undo/redo history entry.
           */
          saveRemoteDrawingState();

          updateUndoRedoButtons();
        }
      );
    };

    socket.on(
      "canvas-update",
      handleCanvasUpdate
    );

    // =============================
    // JOIN ROOM
    // =============================

    socket.emit(
      "join-room",
      {
        roomId,
        name,
        isAdmin:
          isAdminRef.current,
        cursorId,
      }
    );

    // =============================
    // USER LIST
    // =============================

    const handleUserList = ({
      users: receivedUsers,
      adminId,
    }: {
      users: User[];
      adminId: string | null;
    }) => {
      setUsers(
        receivedUsers.map(
          (user) => ({
            ...user,

            name:
              user.id === adminId
                ? `${user.name} (Admin)`
                : user.name,
          })
        )
      );

      // =============================
      // REMOVE STALE CURSORS
      // =============================

      const activeCursorIds =
        new Set(
          receivedUsers.map(
            (user) =>
              user.cursorId
          )
        );

      Object.keys(
        cursorsRef.current
      ).forEach(
        (existingCursorId) => {
          if (
            !activeCursorIds.has(
              existingCursorId
            )
          ) {
            removeRemoteCursor(
              existingCursorId
            );
          }
        }
      );
    };

    socket.on(
      "user-list",
      handleUserList
    );

    // =============================
    // LOCAL CURSOR MOVEMENT
    // =============================

    const handleCursorMove = (
      event: fabric.IEvent
    ) => {
      const pointer =
        canvas.getPointer(
          event.e
        );

      socket.emit(
        "mouse-move",
        {
          id: cursorId,
          roomId,
          name,
          x: pointer.x,
          y: pointer.y,
        }
      );
    };

    canvas.on(
      "mouse:move",
      handleCursorMove
    );

    // =============================
    // REMOTE CURSOR
    // =============================

    const handleRemoteCursor = (
      data: MouseMoveData
    ) => {
      // Ignore our own cursor
      if (
        data.id === cursorId
      ) {
        return;
      }

      if (
        !cursorColorsRef.current[
          data.id
        ]
      ) {
        cursorColorsRef.current[
          data.id
        ] =
          getColorFromName(
            data.name
          );
      }

      const color =
        cursorColorsRef.current[
          data.id
        ];

      let cursor:
        | HTMLDivElement
        | null =
        cursorsRef.current[
          data.id
        ];

      if (!cursor) {
        cursor =
          createRemoteCursor(
            data.id,
            data.name,
            color
          );
      }

      if (!cursor) {
        return;
      }

      cursor.style.left =
        `${data.x}px`;

      cursor.style.top =
        `${data.y}px`;
    };

    socket.on(
      "mouse-move",
      handleRemoteCursor
    );

    // =============================
    // REMOVE CURSOR
    // =============================

    const handleCursorRemove = (
      data: CursorRemoveData
    ) => {
      removeRemoteCursor(
        data.id
      );
    };

    socket.on(
      "cursor-remove",
      handleCursorRemove
    );

    // =============================
    // CLEANUP
    // =============================

    return () => {
      canvas.off(
        "mouse:move",
        handleCursorMove
      );

      socket.off(
        "canvas-state",
        handleCanvasState
      );

      socket.off(
        "canvas-update",
        handleCanvasUpdate
      );

      socket.off(
        "user-list",
        handleUserList
      );

      socket.off(
        "mouse-move",
        handleRemoteCursor
      );

      socket.off(
        "cursor-remove",
        handleCursorRemove
      );

      socket.disconnect();

      socketRef.current =
        null;

      isCanvasReadyRef.current =
        false;

      removeRemoteCursors();
    };
  }, []);
}

export default useSocket;