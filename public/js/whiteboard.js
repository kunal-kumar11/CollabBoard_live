const socket = io();
let currentTool = "pen";
let startX = 0, startY = 0;
let isDrawing = false;
let tempShape = null;
let isRestoring = false;

// ==== Parse URL Parameters ====
const roomId = localStorage.getItem("roomId");
const name = localStorage.getItem("name");
const token = localStorage.getItem("token");
const isAdmin = localStorage.getItem("isAdmin") === "true";
const email = localStorage.getItem("email");

// ==== Fabric Canvas Setup ====
const canvas = new fabric.Canvas("canvas", {
  isDrawingMode: true,
  backgroundColor: "#ffffff",
});

canvas.setHeight(window.innerHeight - 100);
canvas.setWidth(window.innerWidth - 200);
canvas.freeDrawingBrush.width = 3;
canvas.freeDrawingBrush.color = "#000";

// ==== DOM Elements ====
const userList = document.getElementById("userList");
const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const colorPicker = document.getElementById("colorPicker");
const brushSizeInput = document.getElementById("brushSize");
const bgColorPicker = document.getElementById("bgColorPicker");
const toolSelector = document.getElementById("toolSelector");
const downloadBtn = document.getElementById("downloadBtn");

// ==== Admin-Only Buttons ====
if (!isAdmin) {
  clearBtn.style.display = "none";
  undoBtn.style.display = "none";
  redoBtn.style.display = "none";
}

// ==== Tool Selector ====
toolSelector.addEventListener("change", (e) => {
  currentTool = e.target.value;
  canvas.isDrawingMode = currentTool === "pen";
});

// ==== Brush and Background Controls ====
colorPicker.addEventListener("change", (e) => {
  canvas.freeDrawingBrush.color = e.target.value;
});

brushSizeInput.addEventListener("input", (e) => {
  canvas.freeDrawingBrush.width = parseInt(e.target.value);
});

bgColorPicker.addEventListener("change", (e) => {
  canvas.setBackgroundColor(e.target.value, canvas.renderAll.bind(canvas));
});

// ==== Undo/Redo History ====
let stateStack = [];
let redoStack = [];

function saveState() {
  if (isRestoring) return;
  stateStack.push(canvas.toJSON());
  if (stateStack.length > 50) stateStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}


function updateUndoRedoButtons() {
  undoBtn.disabled = stateStack.length < 2;
  redoBtn.disabled = redoStack.length === 0;
}

document.getElementById("saveBtn").addEventListener("click", () => {
  if (!isAdmin) {
    alert("Only admin can save drawings.");
    return;
  }

  const dataUrl = canvas.toDataURL("image/png");

axios.post(
  "/api/drawings/save",
  {
    roomId,
    image: dataUrl
  },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
)
.then(() => {
  alert("Drawing saved!");
  loadSavedImages();
})
.catch((err) => {
  console.error("Save failed", err);
});

});

// Load Saved Images
async function loadSavedImages() {
  const token = localStorage.getItem("token");
   const checkAdmin = JSON.parse(localStorage.getItem("isAdmin"))===true

  try {
    const res = await axios.get("/api/drawings/admin/images", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const list = document.getElementById("drawingList");
    list.innerHTML = "";
    console.log(res.data);
    res.data.forEach(d => {
      const div = document.createElement("div");
      div.innerHTML = `

        <img src="${d.image}" style="width:100%; border-radius:8px;" />
        <p>🟢 ${d.name}</p>
        <p>🟢 ${d.roomId}</p>
        <p>📅 ${new Date(d.createdAt).toLocaleString()}</p>
        ${checkAdmin ? `<button class="deleteBtn" data-id="${d._id}">🗑️ Delete</button>` : ""}
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error("Failed to load drawings", err);
  }
}

// Delete handler
document.getElementById("drawingList").addEventListener("click", async (e) => {
  if (e.target.classList.contains("deleteBtn")) {
    const token = localStorage.getItem("token");
    const isAdmin = JSON.parse(localStorage.getItem("isAdmin"))===true;

    if (!isAdmin) {
      return alert("Only admin can delete drawings.");
    }

    const id = e.target.dataset.id;
    const confirmDelete = confirm("Are you sure you want to delete this drawing?");
    if (confirmDelete) {
      try {
        await axios.delete(`/api/drawings/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadSavedImages();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  }
});

// Load on page
window.addEventListener("DOMContentLoaded", loadSavedImages);

// ==== Drawing Shapes ====
canvas.on("mouse:down", (e) => {
  if (currentTool === "pen") return;
  isDrawing = true;

  const pointer = canvas.getPointer(e.e);
  startX = pointer.x;
  startY = pointer.y;

  const options = {
    left: startX,
    top: startY,
    stroke: colorPicker.value,
    strokeWidth: parseInt(brushSizeInput.value),
    fill: "transparent",
    selectable: false,
  };

  if (currentTool === "line") {
    tempShape = new fabric.Line([startX, startY, startX, startY], options);
  } else if (currentTool === "rectangle") {
    tempShape = new fabric.Rect({ width: 0, height: 0, ...options });
  } else if (currentTool === "circle") {
    tempShape = new fabric.Ellipse({ rx: 0, ry: 0, originX: "center", originY: "center", ...options });
  }

  if (tempShape) canvas.add(tempShape);
});

canvas.on("mouse:move", (e) => {
  if (!isDrawing || !tempShape) return;

  const pointer = canvas.getPointer(e.e);
  const dx = pointer.x - startX;
  const dy = pointer.y - startY;

  if (currentTool === "line") {
    tempShape.set({ x2: pointer.x, y2: pointer.y });
  } else if (currentTool === "rectangle") {
    tempShape.set({ width: Math.abs(dx), height: Math.abs(dy) });
    tempShape.set({ left: dx < 0 ? pointer.x : startX, top: dy < 0 ? pointer.y : startY });
  } else if (currentTool === "circle") {
    tempShape.set({ rx: Math.abs(dx) / 2, ry: Math.abs(dy) / 2 });
    tempShape.set({ left: startX + dx / 2, top: startY + dy / 2 });
  }

  canvas.renderAll();
});

canvas.on("mouse:up", () => {
  if (tempShape) {
    saveState();
    emitCanvas();
  }
  isDrawing = false;
  tempShape = null;
});

// ==== Fabric Event Hooks ====
canvas.on("path:created", () => {
  saveState();
  emitCanvas();
});

canvas.on("object:added", saveState);
canvas.on("object:modified", saveState);

function resizeCanvas() {
  const canvasWrapper = document.getElementById("mainContent");
  const leftSidebar = document.getElementById("userSection");
  const rightSidebar = document.getElementById("savedDrawings");

  const sidebarWidth = (leftSidebar?.offsetWidth || 0) + (rightSidebar?.offsetWidth || 0);
  const availableWidth = window.innerWidth - sidebarWidth - 40; // 40 for gap/padding
  const availableHeight = window.innerHeight - document.getElementById("toolbar").offsetHeight - 150; // toolbar + header + margins

  canvas.setWidth(availableWidth);
  canvas.setHeight(availableHeight);
}

// Call once on load and on resize
window.addEventListener("load", resizeCanvas);
window.addEventListener("resize", resizeCanvas);


// ==== Undo ====
undoBtn.addEventListener("click", () => {
  if (!isAdmin || stateStack.length < 2) return;

  isRestoring = true;
  redoStack.push(stateStack.pop());

  const prev = stateStack[stateStack.length - 1];
  canvas.loadFromJSON(prev, () => {
    canvas.renderAll();
    emitCanvas();
    isRestoring = false;
    updateUndoRedoButtons();
  });
});

// ==== Redo ====
redoBtn.addEventListener("click", () => {
  if (!isAdmin || redoStack.length === 0) return;

  isRestoring = true;
  const next = redoStack.pop();
  stateStack.push(next);

  canvas.loadFromJSON(next, () => {
    canvas.renderAll();
    emitCanvas();
    isRestoring = false;
    updateUndoRedoButtons();
  });
});

// ==== Clear ====
clearBtn.addEventListener("click", () => {
  if (!isAdmin) return;

  const confirmed = confirm("Are you sure you want to clear the dashboard?");
  if (!confirmed) return;

  canvas.clear();
  canvas.setBackgroundColor(bgColorPicker.value || "#ffffff", canvas.renderAll.bind(canvas));

  stateStack = [];
  redoStack = [];
  saveState(); // Save clean state
  emitCanvas();
});

// ==== Download Canvas ====
downloadBtn.addEventListener("click", () => {
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `CollabBoard-${roomId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
console.log(roomId+"roomidddddddddd")
// ==== Emit Canvas to Backend ====
function emitCanvas() {
  const json = canvas.toJSON();
  socket.emit("canvas-update", { roomId, json });
}

// ==== Receive Canvas Updates ====
socket.on("canvas-update", ({ json }) => {
  isRestoring = true;
  canvas.loadFromJSON(json, () => {
    canvas.renderAll();
    isRestoring = false;

    // ✅ Save this synced state in admin's undo history
    if (isAdmin) {
      stateStack.push(canvas.toJSON());
      if (stateStack.length > 50) stateStack.shift();
      redoStack = [];
    }

    updateUndoRedoButtons();
  });
});

// ==== Handle Users ====
socket.emit("join-room", {
  roomId,
  name,
  isAdmin: localStorage.getItem("isAdmin") === "true"
});


socket.on("user-list", ({ users, adminId }) => {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";

  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.name + (user.id === adminId ? " (Admin)" : "");
    userList.appendChild(li);
  });
});


// ==== Initial State ====
canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
saveState();
