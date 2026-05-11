import { AppConstants } from "../constants.js";
import { AssessmentSessionManager } from "./AssessmentSessionManager.js";

export class AssessmentStateManager {
  constructor(dataManager, storageManager, workflowManager, clientManager) {
    this.dataManager = dataManager;
    this.storageManager = storageManager;
    this.workflowManager = workflowManager;
    this.clientManager = clientManager;
    this.state = {
      currentIndex: 0,
      mode: "home",
      activeSection: null,
      clients: [],
      selectedClientId: null,
      selectedAssessmentId: AppConstants.assessments[0].id,
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
    this.sessionManager.setWorkflowChangeHandler(() => this.saveCurrentClientState());
  }

  initialize() {
    const defaultWorkflowState = this.sessionManager.getDefaultWorkflowState();
    const clientState = this.clientManager.initialize(
      this.dataManager.getDefaultScores(),
      defaultWorkflowState
    );

    this.state.clients = clientState.clients;
    this.state.selectedClientId = clientState.activeClient.id;
    this.sessionManager.initialize(clientState.activeClient.scores, clientState.activeClient.workflow);
    this.state.isDarkTheme = this.storageManager.loadThemePreference();
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

  setSelectedAssessment(assessmentId) {
    const assessment = AppConstants.assessments.find((entry) => entry.id === assessmentId);
    if (!assessment) {
      return;
    }

    this.state.selectedAssessmentId = assessment.id;
  }

  addClient(clientName) {
    this.saveCurrentClientState();
    const clientState = this.clientManager.addClient(
      this.state.clients,
      clientName,
      this.dataManager.getDefaultScores(),
      this.sessionManager.getDefaultWorkflowState()
    );

    this.applyClientState(clientState.clients, clientState.activeClient);
  }

  setSelectedClient(clientId) {
    if (clientId === this.state.selectedClientId) {
      return;
    }

    this.saveCurrentClientState();
    const activeClient = this.clientManager.selectClient(this.state.clients, clientId);
    if (!activeClient) {
      return;
    }

    this.applyClientState(this.state.clients, activeClient);
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
      assessments: AppConstants.assessments,
      addClientOptionId: this.clientManager.constructor.addClientOptionId,
      selectedAssessment: this.getSelectedAssessment(),
      selectedClient: this.getSelectedClient(),
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
    this.state.clients = this.clientManager.saveClientState(
      this.state.clients,
      this.state.selectedClientId,
      this.state.scores,
      this.sessionManager.getCurrentWorkflowState()
    );
  }

  getSelectedAssessment() {
    return AppConstants.assessments.find(
      (entry) => entry.id === this.state.selectedAssessmentId
    ) ?? AppConstants.assessments[0];
  }

  getSelectedClient() {
    return this.clientManager.findClient(this.state.clients, this.state.selectedClientId);
  }

  saveCurrentClientState() {
    if (!this.state.selectedClientId) {
      return;
    }

    this.state.clients = this.clientManager.saveClientState(
      this.state.clients,
      this.state.selectedClientId,
      this.state.scores,
      this.sessionManager.getCurrentWorkflowState()
    );
  }

  applyClientState(clients, activeClient) {
    this.state.clients = clients;
    this.state.selectedClientId = activeClient.id;
    this.state.activeSection = null;
    this.state.currentIndex = 0;
    this.state.mode = "home";
    this.state.checkpointSection = null;
    this.state.isFocusedView = false;
    this.sessionManager.initialize(activeClient.scores, activeClient.workflow);
  }
}
