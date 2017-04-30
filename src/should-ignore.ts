import minimatch = require("minimatch");
import { PathMatching } from "./sync-config";

export function shouldIgnore(path: string, pathMatching?: PathMatching): boolean {
  if (pathMatching === undefined) {
    return false;
  }
  if (pathMatching.type === "include" || pathMatching.type === "exclude") {
    const matches = pathMatching.globs.some((glob): boolean => {
      return minimatch(path, glob, {
        "matchBase": true,
      });
    });
    const shouldMatch = (pathMatching.type === "include");
    const ignore = (matches !== shouldMatch);
    return ignore;
  }
  return false;
}
