# 🎨 CollabBoard

A real-time collaborative whiteboard application where multiple users can join the same room, draw together, communicate through voice chat, and see each other's activity live.

CollabBoard was originally built using JavaScript and a traditional frontend structure. The project has now been migrated to a modern **React + TypeScript + Vite** frontend while keeping the existing backend functionality and improving several collaboration-related features.

---

## ✨ Features

### 🖌️ Real-Time Collaborative Whiteboard

* Draw together with multiple users in the same room.
* Changes are synchronized in real time using **Socket.IO**.
* Drawing tools include:

  * ✏️ Pen
  * 📏 Line
  * ▭ Rectangle
  * ◯ Circle
* Customize:

  * Brush color
  * Brush size
  * Canvas background color

The canvas is powered by **Fabric.js**, which handles the drawing objects and canvas state.

---

### 👥 Live User Presence

Users currently connected to the same room are displayed in the user list.

Each user can see who else is currently participating in the whiteboard session.

---

### 🖱️ Real-Time Remote Cursors

Every user has a live cursor visible to other participants.

The application also handles browser refreshes and reconnections properly:

* Old cursor is removed when a user refreshes.
* A new cursor is created for the new connection.
* Browser navigation and reconnection do not leave stale cursor pointers behind.

A stable cursor ID is maintained using `sessionStorage`, while the Socket.IO connection itself can change after a refresh.

---

### ↩️ Undo & Redo

The whiteboard supports sequential:

* Undo
* Redo

Undo/redo maintains the **drawing history separately from canvas settings**.

Conceptually:

```text
CollabBoard State
       │
       ├── Drawing History
       │      ├── Undo
       │      └── Redo
       │
       └── Canvas Settings
              ├── Background
              ├── Brush Color
              └── Brush Size
```

This prevents changing the background or other canvas settings from corrupting the drawing history.

---

### 🎨 Canvas Settings

Canvas settings can be changed independently from drawing history.

Available settings include:

* Background color
* Brush color
* Brush size
* Current drawing tool

This separation makes the undo/redo behaviour more predictable and closer to how drawing applications normally behave.

---

### 💾 Save Drawings

Administrators can save the current whiteboard as an image.

Saved drawings contain information such as:

* Drawing image
* Room ID
* Uploader
* Creation time

Saved drawings can later be displayed in the saved drawings section.

The backend stores drawing information using MongoDB/Mongoose.

---

### 🗑️ Delete Saved Drawings

Only the administrator who uploaded a drawing can delete it.

This prevents normal participants from deleting another user's saved drawings.

---

### 📥 Download Whiteboard

The current canvas can be downloaded as a PNG image.

Example filename:

```text
CollabBoard-room-name.png
```

---

### 🎙️ Voice Chat

CollabBoard includes real-time voice communication using **Agora RTC**.

Users can:

* Join the voice call
* Leave the voice call
* Mute their microphone
* Unmute their microphone
* Hear other participants in the same voice channel

The voice channel is associated with the whiteboard room, so users in the same room can communicate with each other.

The frontend uses `agora-rtc-sdk-ng` for real-time audio communication.

---

### 🔐 Authentication & Roles

The application supports authenticated users and administrator permissions.

The administrator has additional permissions such as:

* Save drawings
* Delete saved drawings
* Clear the whiteboard
* Use undo/redo

Regular users can participate in the collaborative whiteboard without administrator-only controls.

Authentication uses JWT-based authorization on the backend.

---

## 🏗️ Tech Stack

### Frontend

| Technology       | Purpose                         |
| ---------------- | ------------------------------- |
| React            | UI development                  |
| TypeScript       | Type safety                     |
| Vite             | Frontend development/build tool |
| Fabric.js        | Whiteboard canvas               |
| Socket.IO Client | Real-time collaboration         |
| Axios            | HTTP API communication          |
| Agora RTC SDK    | Voice communication             |
| CSS              | Styling                         |

### Backend

| Technology | Purpose                   |
| ---------- | ------------------------- |
| Node.js    | Runtime                   |
| Express.js | REST API                  |
| TypeScript | Type safety               |
| Socket.IO  | Real-time communication   |
| MongoDB    | Database                  |
| Mongoose   | MongoDB object modeling   |
| JWT        | Authentication            |
| dotenv     | Environment configuration |

---

## 📁 Project Structure

```text
CollabBoard_live/
│
├── client/
│   ├── public/
│   │
│   └── src/
│       ├── components/
│       │   ├── CanvasBoard.tsx
│       │   ├── SavedDrawings.tsx
│       │   ├── UserList.tsx
│       │   ├── VoiceControls.tsx
│       │   ├── WhiteboardHeader.tsx
│       │   └── WhiteboardToolbar.tsx
│       │
│       ├── hooks/
│       │   ├── useFabricCanvas.ts
│       │   ├── useRemoteCursors.ts
│       │   ├── useSavedDrawings.ts
│       │   ├── useSocket.ts
│       │   ├── useUndoRedo.ts
│       │   └── useVoiceChat.ts
│       │
│       ├── pages/
│       │   ├── Login.tsx
│       │   └── Whiteboard.tsx
│       │
│       ├── styles/
│       │   ├── index.css
│       │   └── login.css
│       │
│       ├── types/
│       │   └── whiteboard.ts
│       │
│       ├── App.tsx
│       └── main.tsx
│
├── server/
│   ├── middleware/
│   │   └── auth.ts
│   │
│   ├── models/
│   │   └── Drawing.ts
│   │
│   ├── routes/
│   │   └── drawing.ts
│   │
│   ├── public/
│   │
│   ├── app.ts
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## 🔄 How Collaboration Works

The application uses Socket.IO to synchronize whiteboard activity.

A simplified flow looks like this:

```text
User A
   │
   │ Draw / Move Cursor
   ▼
React + Fabric.js
   │
   │ Socket.IO
   ▼
Express + Socket.IO Server
   │
   │ Broadcast
   ▼
┌───────────────┐
│ User B        │
│ User C        │
│ User D        │
└───────────────┘
```

Canvas changes are transmitted as Fabric.js canvas JSON and loaded into the other connected clients.

---

## 🔐 Environment Variables

Sensitive configuration should be stored in environment variables rather than committed to Git.

### Server

Create:

```text
server/.env
```

Example:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
```

### Important

Never commit:

```text
.env
```

The project `.gitignore` already excludes environment files.

For Agora, keep your Agora App ID/configuration outside publicly committed secrets whenever possible.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/kunal-kumar11/CollabBoard_live.git
```

```bash
cd CollabBoard_live
```

---

### 2. Install frontend dependencies

```bash
cd client
npm install
```

---

### 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

---

### 4. Configure environment variables

Create:

```text
server/.env
```

and add the required MongoDB and authentication configuration.

---

### 5. Start the backend

Inside the `server` directory:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

---

### 6. Start the frontend

Inside the `client` directory:

```bash
npm run dev
```

Vite will provide a local development URL, usually:

```text
http://localhost:5173
```

Open the displayed URL in your browser.

---

## 🧪 Testing the Application

For the best test of the collaborative functionality, open the application in two different browser windows or browsers.

### Whiteboard Test

1. Login as User A.
2. Login as User B.
3. Join the same room.
4. Draw from User A.
5. Confirm User B sees the drawing.
6. Draw from User B.
7. Confirm User A sees the drawing.

### Cursor Test

1. Move User A's cursor around the canvas.
2. Confirm User B can see it.
3. Refresh User A.
4. Confirm the old cursor disappears.
5. Confirm only the new cursor remains.

### Undo/Redo Test

Test:

```text
Draw A
Draw B
Draw C

Undo → B
Undo → A
Redo → B
Redo → C
```

Also test changing the background between drawings to ensure drawing history remains independent from canvas settings.

### Browser Navigation Test

Test:

```text
Whiteboard
   ↓
Browser Back
   ↓
Browser Forward
   ↓
Whiteboard
```

Confirm that:

* Existing whiteboard content is preserved.
* Other users' drawings are not accidentally deleted.
* Re-entering the room does not overwrite the shared canvas.
* The user's old cursor is removed.

### Voice Test

Open the same room on two devices or browsers.

1. User A joins the voice call.
2. User B joins the voice call.
3. User A speaks.
4. User B should hear User A.
5. Mute User A.
6. User B should no longer hear User A.
7. Unmute User A.
8. Audio should resume.
9. Leave the call and confirm the microphone is released.

---

## 🛡️ Security Notes

Do not commit sensitive values such as:

* MongoDB connection strings
* JWT secrets
* API credentials
* Agora credentials or tokens

Use environment variables and secret management when deploying the application.

The repository intentionally ignores `.env` files.

---

## 🚧 Current Scope

CollabBoard currently focuses on:

* Real-time collaborative drawing
* Multi-user rooms
* Remote cursors
* Voice communication
* Drawing history
* Undo/redo
* Saved drawings
* Authentication
* Administrator permissions
* PNG download

The project is primarily intended as a collaborative whiteboard and a full-stack learning/project application.

---

## 📌 Migration

This repository contains the migration of the original CollabBoard application from a JavaScript-based implementation to:

```text
React
   +
TypeScript
   +
Vite
```

The backend was also migrated toward TypeScript while preserving the existing application functionality.

The migration introduced a more structured frontend architecture using:

* React components
* Custom hooks
* TypeScript types
* Separation of UI and business logic
* Dedicated canvas management
* Dedicated socket management
* Dedicated undo/redo management
* Dedicated voice-chat management
* Dedicated saved-drawing management

---

## 👨‍💻 Author

**Kunal Kumar**

Computer Science Engineer
Interested in Full-Stack Development, React, TypeScript and Software Engineering.

---

## 📄 License

This project is intended for learning, development and portfolio purposes.

If you plan to use or distribute the project commercially, review and add an appropriate open-source license.
