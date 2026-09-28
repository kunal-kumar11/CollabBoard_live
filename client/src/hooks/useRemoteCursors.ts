import type { MutableRefObject } from "react";

type UseRemoteCursorsProps = {
  cursorsRef: MutableRefObject<
    Record<string, HTMLDivElement>
  >;

  cursorColorsRef: MutableRefObject<
    Record<string, string>
  >;
};

function useRemoteCursors({
  cursorsRef,
  cursorColorsRef,
}: UseRemoteCursorsProps) {
  // =============================
  // GENERATE USER COLOR
  // =============================

  const getColorFromName = (
    userName: string
  ) => {
    let hash = 0;

    for (
      let i = 0;
      i < userName.length;
      i++
    ) {
      hash =
        userName.charCodeAt(i) +
        ((hash << 5) - hash);
    }

    const color =
      Math.abs(hash) % 360;

    return `hsl(${color}, 70%, 50%)`;
  };

  // =============================
  // CREATE REMOTE CURSOR
  // =============================

  const createRemoteCursor = (
    cursorId: string,
    userName: string,
    color: string
  ) => {
    const cursorLayer =
      document.getElementById(
        "cursorLayer"
      );

    if (!cursorLayer) {
      return null;
    }

    const cursor =
      document.createElement("div");

    cursor.className =
      "remote-cursor";

    cursor.style.position =
      "absolute";

    cursor.style.pointerEvents =
      "none";

    cursor.style.zIndex =
      "101";

    cursor.innerHTML = `
      <div
        style="
          font-size: 20px;
          line-height: 20px;
        "
      >
        🖐️
      </div>

      <div
        style="
          background: ${color};
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          margin-top: 2px;
        "
      >
        ${userName}
      </div>
    `;

    cursorLayer.appendChild(
      cursor
    );

    cursorsRef.current[cursorId] =
      cursor;

    return cursor;
  };

  // =============================
  // REMOVE ONE REMOTE CURSOR
  // =============================

  const removeRemoteCursor = (
    cursorId: string
  ) => {
    const cursor =
      cursorsRef.current[
        cursorId
      ];

    if (cursor) {
      cursor.remove();
    }

    delete cursorsRef.current[
      cursorId
    ];

    delete cursorColorsRef.current[
      cursorId
    ];
  };

  // =============================
  // REMOVE ALL REMOTE CURSORS
  // =============================

  const removeRemoteCursors = () => {
    Object.values(
      cursorsRef.current
    ).forEach((cursor) => {
      cursor.remove();
    });

    cursorsRef.current = {};
    cursorColorsRef.current = {};
  };

  return {
    getColorFromName,
    createRemoteCursor,
    removeRemoteCursor,
    removeRemoteCursors,
  };
}

export default useRemoteCursors;