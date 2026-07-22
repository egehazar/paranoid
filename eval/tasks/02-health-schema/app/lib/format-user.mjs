// Render a display label for a user record.
export function formatUser(user) {
  if (!user.displayName) {
    throw new Error("formatUser: displayName missing");
  }
  return `${user.displayName} <${user.email}>`;
}
