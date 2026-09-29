import { useState } from "react";
import axios from "axios";
import "../styles/login.css";

function Login() {
  // Create Room states
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [roomId, setRoomId] = useState("");

  // Join Room states
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  // Generate a random room ID
  const generateRoomId = () => {
    const newRoomId = Math.random().toString(36).substr(2, 9);
    setRoomId(newRoomId);
  };

  // Copy room ID
  const copyRoomId = async () => {
    if (!roomId) {
      alert("Please generate a room ID first.");
      return;
    }

    await navigator.clipboard.writeText(roomId);
    alert("Room ID copied!");
  };

  // Create a new room
  const createRoom = async () => {
    const name = createName.trim();
    const email = createEmail.trim();
    const currentRoomId = roomId.trim();

    if (!name || !email || !currentRoomId) {
      alert("Please enter your name, email, and generate a room ID.");
      return;
    }

    const isAdmin = true;

    try {
      const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/drawings/token`, {
        email,
        name,
        isAdmin,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("isAdmin", String(isAdmin));
      localStorage.setItem("name", name);
      localStorage.setItem("email", email);
      localStorage.setItem("roomId", currentRoomId);

      window.location.href = "/whiteboard";
    } catch (err) {
      console.error("Token creation failed", err);
      alert("Something went wrong while creating the room.");
    }
  };

  // Join an existing room
  const joinRoom = async () => {
    const name = joinName.trim();
    const email = joinEmail.trim();
    const currentRoomId = joinRoomId.trim();

    if (!name || !email || !currentRoomId) {
      alert("Please enter your name, email, and room ID to join.");
      return;
    }

    const isAdmin = false;

    try {
      const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/drawings/token`, {
        email,
        name,
        isAdmin,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("isAdmin", String(isAdmin));
      localStorage.setItem("name", name);
      localStorage.setItem("email", email);
      localStorage.setItem("roomId", currentRoomId);

      window.location.href = "/whiteboard";
    } catch (err) {
      console.error("Token fetch failed", err);
      alert("Unable to join room.");
    }
  };

  return (
    <div className="login-page">
    <div className="wrapper">
      {/* Page Heading */}
      <div className="page-header">
        <h2>Welcome to CollabBoard</h2>
        <p>Collaborative Real-Time Whiteboard</p>
      </div>

      {/* Room Controls */}
      <div className="container">

        {/* Create Room */}
        <div className="box">
          <h3>Create Room (Admin)</h3>

          <input
            type="text"
            id="createName"
            placeholder="Your Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
          />

          <input
            type="email"
            id="createEmail"
            placeholder="Your Email"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            required
          />

          <input
            type="text"
            id="roomId"
            placeholder="Room ID"
            value={roomId}
            readOnly
          />

          <div className="actions">
            <button onClick={generateRoomId}>
              Generate
            </button>

            <button onClick={copyRoomId}>
              Copy
            </button>
          </div>

          <label style={{ marginTop: "5px", display: "block" }}>
            <input
              type="checkbox"
              id="isAdmin"
              checked
              disabled
              readOnly
            />

            Admin (Only creator can save/delete images)
          </label>

          <button onClick={createRoom}>
            Create Room
          </button>
        </div>

        {/* Join Room */}
        <div className="box">
          <h3>Join Room</h3>

          <input
            type="text"
            id="joinName"
            placeholder="Your Name"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            required
          />

          <input
            type="email"
            id="joinEmail"
            placeholder="Your Email"
            value={joinEmail}
            onChange={(e) => setJoinEmail(e.target.value)}
            required
          />

          <input
            type="text"
            id="joinRoomId"
            placeholder="Room ID"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
          />

          <button onClick={joinRoom}>
            Join Room
          </button>
        </div>

      </div>
    </div>
    </div>

  );
}

export default Login;