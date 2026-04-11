import { AppConstants } from "../constants.js";

export class StorageManager {
  loadScores(defaultScores) {
    try {
      const savedValue = localStorage.getItem(AppConstants.storageKeys.scores);
      return savedValue ? JSON.parse(savedValue) : defaultScores;
    } catch (_error) {
      return defaultScores;
    }
  }

  saveScores(scores) {
    try {
      localStorage.setItem(AppConstants.storageKeys.scores, JSON.stringify(scores));
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  loadThemePreference() {
    try {
      const savedValue = localStorage.getItem(AppConstants.storageKeys.darkTheme);
      return savedValue === null ? true : savedValue === "1";
    } catch (_error) {
      return true;
    }
  }

  saveThemePreference(isDark) {
    try {
      localStorage.setItem(AppConstants.storageKeys.darkTheme, isDark ? "1" : "0");
    } catch (_error) {
      // Ignore storage failures.
    }
  }
}
