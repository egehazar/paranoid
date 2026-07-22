// Data layer. Stands in for the users table.
export async function getUser(id) {
  return {
    user_id: String(id),
    display_name: "Ada Lovelace",
    email: "ada@example.com",
  };
}
