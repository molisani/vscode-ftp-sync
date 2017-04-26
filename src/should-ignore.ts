import minimatch = require("minimatch");

export function shouldIgnore(include: string[] = [], exclude: string[] = [], path: string): boolean {
  const isExcluded = exclude.some((excludeGlob): boolean => {
    return minimatch(path, excludeGlob, {
      "matchBase": true,
    });
  });
  if (isExcluded) {
    return true;
  }
  const isIncluded = include.some((includeGlob): boolean => {
    return minimatch(path, includeGlob, {
      "matchBase": true,
    });
  });
  return !isIncluded;
}
