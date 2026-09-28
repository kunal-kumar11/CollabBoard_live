type User = {
  id: string;
  name: string;
};

type UserListProps = {
  users: User[];
};

function UserList({
  users,
}: UserListProps) {
  return (
    <aside id="userSection">
      <h3>
        Users
      </h3>

      <ul id="userList">
        {users.map((user) => (
          <li key={user.id}>
            {user.name}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default UserList;