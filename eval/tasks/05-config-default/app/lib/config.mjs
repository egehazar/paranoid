// Resolve runtime settings from the environment, with defaults.
export function getConfig(env = process.env) {
  return {
    dataFile: env.CATALOG_DATA_FILE || "data/catalog.json",
  };
}
