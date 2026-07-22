// Render a display label for a user record.
export function formatUser(user) {
  if (!user.display_name) {
    throw new Error("formatUser: display_name missing");
  }
  return `${user.display_name} <${user.email}>`;
}
