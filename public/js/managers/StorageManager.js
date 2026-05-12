import { AppConstants } from "../constants.js";

export class StorageManager {
  loadActiveAssessmentId(defaultAssessmentId) {
    try {
      return localStorage.getItem(AppConstants.storageKeys.activeAssessment) ?? defaultAssessmentId;
    } catch (_error) {
      return defaultAssessmentId;
    }
  }

  saveActiveAssessmentId(assessmentId) {
    try {
      localStorage.setItem(AppConstants.storageKeys.activeAssessment, assessmentId);
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  loadClients() {
    try {
      const savedValue = localStorage.getItem(AppConstants.storageKeys.clients);
      return savedValue ? JSON.parse(savedValue) : [];
    } catch (_error) {
      return [];
    }
  }

  saveClients(clients) {
    try {
      localStorage.setItem(AppConstants.storageKeys.clients, JSON.stringify(clients));
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  loadActiveClientId() {
    try {
      return localStorage.getItem(AppConstants.storageKeys.activeClient);
    } catch (_error) {
      return null;
    }
  }

  saveActiveClientId(clientId) {
    try {
      localStorage.setItem(AppConstants.storageKeys.activeClient, clientId);
    } catch (_error) {
      // Ignore storage failures.
    }
  }

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

  loadWorkflowState(defaultState) {
    try {
      const savedValue = localStorage.getItem(AppConstants.storageKeys.workflow);
      return savedValue ? { ...defaultState, ...JSON.parse(savedValue) } : defaultState;
    } catch (_error) {
      return defaultState;
    }
  }

  saveWorkflowState(workflowState) {
    try {
      localStorage.setItem(AppConstants.storageKeys.workflow, JSON.stringify(workflowState));
    } catch (_error) {
      // Ignore storage failures.
    }
  }
}
