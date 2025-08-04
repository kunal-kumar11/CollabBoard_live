// Function to generate a random room ID
function generateRoomId() {
  const roomId = Math.random().toString(36).substr(2, 9);
  document.getElementById("roomId").value = roomId;
}

// Function to copy the generated room ID
function copyRoomId() {
  const roomInput = document.getElementById("roomId");
  roomInput.select();
  document.execCommand("copy");
  alert("Room ID copied!");
}

// Function to create a new room (admin)
function createRoom() {
  const name = document.getElementById("createName").value.trim();
  const email = document.getElementById("createEmail").value.trim();
  const roomId = document.getElementById("roomId").value.trim();

  if (!name || !email || !roomId) {
    alert("Please enter your name, email, and generate a room ID.");
    return;
  }

  const isAdmin = true;

  axios.post("/api/drawings/token", { email, name, isAdmin })
    .then((res) => {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("isAdmin", true);
      localStorage.setItem("name", name);
      localStorage.setItem("email", email);
      localStorage.setItem("roomId", roomId);
      window.location.href = `/whiteboard`;
    })
    .catch((err) => {
      console.error("Token creation failed", err);
      alert("Something went wrong while creating the room.");
    });
}

// Function to join an existing room (non-admin)
function joinRoom() {
  const name = document.getElementById("joinName").value.trim();
  const email = document.getElementById("joinEmail").value.trim();
  const roomId = document.getElementById("joinRoomId").value.trim();

  if (!name || !email || !roomId) {
    alert("Please enter your name, email, and room ID to join.");
    return;
  }

  const isAdmin = false;

  axios.post("/api/drawings/token", { email, name, isAdmin })
    .then((res) => {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("isAdmin", false);
      localStorage.setItem("name", name);
      localStorage.setItem("email", email);
      localStorage.setItem("roomId", roomId);
      window.location.href = `/whiteboard`;
    })
    .catch((err) => {
      console.error("Token fetch failed", err);
      alert("Unable to join room.");
    });
}
