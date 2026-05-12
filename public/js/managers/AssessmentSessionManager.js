export class AssessmentSessionManager {
  constructor(state, dataManager, storageManager, workflowManager) {
    this.state = state;
    this.dataManager = dataManager;
    this.storageManager = storageManager;
    this.workflowManager = workflowManager;
    this.workflowChangeHandler = null;
  }

  initialize(scores, workflowState) {
    this.state.scores = scores;
    this.state.lastQuestionId = workflowState.lastQuestionId;
    this.state.lastSection = workflowState.lastSection;
    this.state.questionFilter = workflowState.questionFilter;
  }

  setDataManager(dataManager) {
    this.dataManager = dataManager;
  }

  openHome() {
    this.state.mode = "home";
    this.state.checkpointSection = null;
    this.state.isFocusedView = false;
  }

  startResumeFlow() {
    const target = this.workflowManager.getResumeTarget(
      this.state.lastQuestionId,
      this.state.lastSection,
      this.state.scores
    );

    this.startQuestionFlow(target, "all");
  }

  startReviewFlow(section = null) {
    const target = this.workflowManager.getFirstUnansweredTarget(this.state.scores, section);
    if (!target) {
      this.openHome();
      return;
    }

    this.startQuestionFlow(target, "unanswered");
  }

  startSectionFlow(section) {
    const target = this.workflowManager.getFirstUnansweredTarget(this.state.scores, section)
      ?? this.workflowManager.getFirstQuestionTarget(section);
    this.startQuestionFlow(target, "all");
  }

  startFirstSectionFlow() {
    const target = this.workflowManager.getFirstUnansweredTarget(this.state.scores)
      ?? this.workflowManager.getFirstQuestionTarget();
    this.startQuestionFlow(target, "all");
  }

  continueToNextSection() {
    const target = this.workflowManager.getNextSectionTarget(this.state.checkpointSection, this.state.scores);
    if (!target) {
      this.openHome();
      return;
    }

    this.startQuestionFlow(target, "all");
  }

  showSectionCheckpoint() {
    this.state.mode = "checkpoint";
    this.state.checkpointSection = this.state.activeSection;
    this.state.isFocusedView = false;
  }

  shouldShowCheckpointAfterAdvance() {
    return this.state.activeSection !== null
      && this.state.currentIndex >= this.getQuestionQueue().length - 1;
  }

  isReviewMode() {
    return this.state.questionFilter === "unanswered";
  }

  jumpToQuestion(questionId, section) {
    this.state.activeSection = section;
    this.state.mode = "assess";
    this.state.questionFilter = "all";
    this.state.checkpointSection = null;

    const questionIndex = this.getQuestionQueue().findIndex(
      (question) => question.id === questionId
    );

    this.state.currentIndex = questionIndex >= 0 ? questionIndex : 0;
  }

  recordCurrentQuestion() {
    const currentQuestion = this.getQuestionQueue()[this.state.currentIndex];
    if (!currentQuestion) {
      return;
    }

    this.state.lastQuestionId = currentQuestion.id;
    this.state.lastSection = currentQuestion.s;
    this.workflowChangeHandler?.();
  }

  startQuestionFlow(target, questionFilter) {
    if (!target) {
      this.openHome();
      return;
    }

    this.state.mode = "assess";
    this.state.activeSection = target.section;
    this.state.questionFilter = questionFilter;
    this.state.currentIndex = 0;
    this.state.checkpointSection = null;
    this.state.isFocusedView = false;

    const questionIndex = this.getQuestionQueue().findIndex(
      (question) => question.id === target.questionId
    );

    this.state.currentIndex = questionIndex >= 0 ? questionIndex : 0;
    this.recordCurrentQuestion();
  }

  getQuestionQueue() {
    return this.workflowManager.getQuestionQueue(
      this.state.activeSection,
      this.state.questionFilter,
      this.state.scores
    );
  }

  getDefaultWorkflowState() {
    return {
      lastQuestionId: null,
      lastSection: null,
      questionFilter: "all",
    };
  }

  getCurrentWorkflowState() {
    return {
      lastQuestionId: this.state.lastQuestionId,
      lastSection: this.state.lastSection,
      questionFilter: this.state.questionFilter,
    };
  }

  setWorkflowChangeHandler(handler) {
    this.workflowChangeHandler = handler;
  }
}
