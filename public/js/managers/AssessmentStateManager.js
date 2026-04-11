import { AppConstants } from "../constants.js";
import { AssessmentSessionManager } from "./AssessmentSessionManager.js";

export class AssessmentStateManager {
  constructor(dataManager, storageManager, workflowManager) {
    this.dataManager = dataManager;
    this.storageManager = storageManager;
    this.workflowManager = workflowManager;
    this.state = {
      currentIndex: 0,
      mode: "home",
      activeSection: null,
      accentColor: AppConstants.accentColors[0],
      checkpointSection: null,
      isFocusedView: false,
      isColorPickerOpen: false,
      isDarkTheme: true,
      lastQuestionId: null,
      lastSection: null,
      questionFilter: "all",
      scores: {},
    };
    this.sessionManager = new AssessmentSessionManager(
      this.state,
      dataManager,
      storageManager,
      workflowManager
    );
  }

  initialize() {
    this.sessionManager.initialize(this.dataManager.getDefaultScores());
    this.applyTheme();
  }

  getState() {
    return this.state;
  }

  getFilteredQuestions() {
    return this.workflowManager.getQuestionQueue(
      this.state.activeSection,
      this.state.questionFilter,
      this.state.scores
    );
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
    this.state.questionFilter = "all";
    this.state.currentIndex = 0;
    this.state.checkpointSection = null;
  }

  setMode(mode) {
    this.state.mode = mode;
    this.state.checkpointSection = null;
    if (mode !== "assess") {
      this.state.isFocusedView = false;
    }
  }

  toggleFocusedView() {
    this.state.isFocusedView = !this.state.isFocusedView;
    this.state.mode = "assess";
  }

  openHome() {
    this.sessionManager.openHome();
  }

  startResumeFlow() {
    this.sessionManager.startResumeFlow();
  }

  startReviewFlow(section = null) {
    this.sessionManager.startReviewFlow(section);
  }

  startSectionFlow(section) {
    this.sessionManager.startSectionFlow(section);
  }

  startFirstSectionFlow() {
    this.sessionManager.startFirstSectionFlow();
  }

  continueToNextSection() {
    this.sessionManager.continueToNextSection();
  }

  showSectionCheckpoint() {
    this.sessionManager.showSectionCheckpoint();
  }

  shouldShowCheckpointAfterAdvance() {
    return this.sessionManager.shouldShowCheckpointAfterAdvance();
  }

  isReviewMode() {
    return this.sessionManager.isReviewMode();
  }

  jumpToQuestion(questionId, section) {
    this.sessionManager.jumpToQuestion(questionId, section);
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
    this.sessionManager.recordCurrentQuestion();
  }

  moveToNextQuestion() {
    if (this.state.currentIndex < this.getFilteredQuestions().length - 1) {
      this.state.currentIndex += 1;
    }

    this.sessionManager.recordCurrentQuestion();
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

    if (this.state.mode === "assess") {
      this.sessionManager.recordCurrentQuestion();
    }

    return {
      ...this.state,
      checkpoint: this.workflowManager.buildCheckpoint(this.state.checkpointSection, this.state.scores),
      filteredQuestions,
      answeredCount,
      isAssessmentComplete: this.workflowManager.isAssessmentComplete(this.state.scores),
      isReviewMode: this.isReviewMode(),
      questionFilterLabel: this.state.questionFilter === "unanswered" ? "Unanswered Only" : "All Questions",
      resumeTarget: this.workflowManager.getResumeTarget(
        this.state.lastQuestionId,
        this.state.lastSection,
        this.state.scores
      ),
      sectionQueues: this.workflowManager.buildSectionQueues(this.state.scores),
      totalQuestions: this.dataManager.questions.length,
      unansweredCount: this.dataManager.questions.length - answeredCount,
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
