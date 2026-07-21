// THE BUG: the agent assumed camelCase because that's what it mocked in
// its own test. The real database returns snake_case (see lib/db.mjs).
export function formatUser(user) {
  if (!user.displayName) {
    throw new Error("formatUser: displayName missing");
  }
  return `${user.displayName} <${user.email}>`;
}

// The one-line fix (for the demo GIF):
//   read user.display_name (snake_case) instead of user.displayName
