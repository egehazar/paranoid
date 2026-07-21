// Pretend database. This is the REAL shape the data comes back in.
export async function getUser(id) {
  return {
    user_id: String(id),
    display_name: "Ada Lovelace",
    email: "ada@example.com",
  };
}
