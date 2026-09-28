type WhiteboardHeaderProps = {
  onLogout: () => void;
};

function WhiteboardHeader({
  onLogout,
}: WhiteboardHeaderProps) {
  return (
    <header>
      <h1>🖊️ CollabBoard</h1>

      <button
        id="logoutBtn"
        onClick={onLogout}
      >
        🚪 Logout
      </button>
    </header>
  );
}

export default WhiteboardHeader;