type SavedDrawing = {
  _id: string;
  image: string;
  name: string;
  roomId: string;
  createdAt: string;
};

type SavedDrawingsProps = {
  savedDrawings: SavedDrawing[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
};

function SavedDrawings({
  savedDrawings,
  isAdmin,
  onDelete,
}: SavedDrawingsProps) {
  return (
    <aside id="savedDrawings">
      <h3>Saved Images</h3>

      <div id="drawingList">
        {savedDrawings.map((drawing) => (
          <div
            key={drawing._id}
            className="drawingCard"
          >
            <img
              src={drawing.image}
              alt="Saved drawing"
            />

            <p>
              🟢 {drawing.name}
            </p>

            <p>
              🟢 {drawing.roomId}
            </p>

            <p>
              📅{" "}
              {new Date(
                drawing.createdAt
              ).toLocaleString()}
            </p>

            {isAdmin && (
              <button
                className="deleteBtn"
                onClick={() =>
                  onDelete(drawing._id)
                }
              >
                🗑️ Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default SavedDrawings;