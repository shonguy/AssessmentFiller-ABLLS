import { AppConstants } from "../constants.js";

export class AssessmentStateManager {
  constructor(dataManager, storageManager) {
    this.dataManager = dataManager;
    this.storageManager = storageManager;
    this.state = {
      currentIndex: 0,
      mode: "assess",
      activeSection: null,
      accentColor: AppConstants.accentColors[0],
      isColorPickerOpen: false,
      isDarkTheme: true,
      scores: {},
    };
  }

  initialize() {
    this.state.scores = this.storageManager.loadScores(this.dataManager.getDefaultScores());
    this.state.isDarkTheme = this.storageManager.loadThemePreference();
    this.applyTheme();
  }

  getState() {
    return this.state;
  }

  getFilteredQuestions() {
    return this.dataManager.getFilteredQuestions(this.state.activeSection);
  }

  getCurrentQuestion() {
    return this.getFilteredQuestions()[this.state.currentIndex];
  }

  toggleTheme() {
    this.state.isDarkTheme = !this.state.isDarkTheme;
    this.applyTheme();
  }

  toggleColorPicker() {
    this.state.isColorPickerOpen = !this.state.isColorPickerOpen;
  }

  closeColorPicker() {
    this.state.isColorPickerOpen = false;
  }

  setAccentColor(color) {
    this.state.accentColor = color;
  }

  setActiveSection(section) {
    this.state.activeSection = section;
    this.state.currentIndex = 0;
  }

  setMode(mode) {
    this.state.mode = mode;
  }

  jumpToQuestion(questionId, section) {
    this.state.activeSection = section;
    this.state.mode = "assess";

    const questionIndex = this.getFilteredQuestions().findIndex(
      (question) => question.id === questionId
    );

    this.state.currentIndex = questionIndex >= 0 ? questionIndex : 0;
  }

  clearScore(questionId) {
    delete this.state.scores[questionId];
    this.saveScores();
  }

  updateScore(questionId, tierNumber) {
    if (tierNumber === -1) {
      if (this.state.scores[questionId] === 0) {
        delete this.state.scores[questionId];
      } else {
        this.state.scores[questionId] = 0;
      }
    } else if (this.state.scores[questionId] === tierNumber) {
      delete this.state.scores[questionId];
    } else {
      this.state.scores[questionId] = tierNumber;
    }

    this.saveScores();

    return (tierNumber === -1 && this.state.scores[questionId] === 0)
      || (tierNumber > 0 && this.state.scores[questionId] === tierNumber);
  }

  navigate(step) {
    const maxIndex = Math.max(this.getFilteredQuestions().length - 1, 0);
    this.state.currentIndex = Math.max(0, Math.min(maxIndex, this.state.currentIndex + step));
  }

  moveToNextQuestion() {
    if (this.state.currentIndex < this.getFilteredQuestions().length - 1) {
      this.state.currentIndex += 1;
    }
  }

  replaceScores(scores) {
    this.state.scores = scores;
    this.saveScores();
  }

  buildViewModel() {
    const filteredQuestions = this.getFilteredQuestions();
    const answeredCount = this.dataManager.getAnsweredCount(this.state.scores);
    const maxIndex = Math.max(filteredQuestions.length - 1, 0);
    this.state.currentIndex = Math.min(this.state.currentIndex, maxIndex);

    return {
      ...this.state,
      filteredQuestions,
      answeredCount,
      totalQuestions: this.dataManager.questions.length,
      progressPercent: Math.round((answeredCount / this.dataManager.questions.length) * 100),
      sections: this.dataManager.buildSummary(this.state.scores),
    };
  }

  applyTheme() {
    document.body.classList.toggle("light", !this.state.isDarkTheme);
    this.storageManager.saveThemePreference(this.state.isDarkTheme);
  }

  saveScores() {
    this.storageManager.saveScores(this.state.scores);
  }
}
