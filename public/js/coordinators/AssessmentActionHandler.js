export class AssessmentActionHandler {
  constructor(stateManager, exportManager, render) {
    this.stateManager = stateManager;
    this.exportManager = exportManager;
    this.render = render;
  }

  handle(actionElement) {
    const action = actionElement.dataset.act;
    const value = actionElement.dataset.val;

    if (action === "theme") {
      this.stateManager.toggleTheme();
      this.render();
      return true;
    }

    if (action === "cpToggle") {
      this.stateManager.toggleColorPicker();
      this.render();
      return true;
    }

    if (action === "cpick") {
      this.stateManager.setAccentColor(value);
      this.stateManager.closeColorPicker();
      this.render();
      return true;
    }

    if (action === "sideToggle") {
      this.stateManager.toggleSidebar();
      this.render();
      return true;
    }

    if (action === "sec") {
      this.stateManager.setActiveSection(value === "ALL" ? null : value);
      this.stateManager.setMode("assess");
      this.stateManager.collapseSidebarForSmallScreens();
      this.render();
      return true;
    }

    if (action === "mode") {
      this.stateManager.setMode(value);
      this.stateManager.collapseSidebarForSmallScreens();
      this.render();
      return true;
    }

    if (action === "home") {
      this.stateManager.openHome();
      this.render();
      return true;
    }

    if (action === "resume") {
      this.stateManager.startResumeFlow();
      this.render();
      return true;
    }

    if (action === "startfirst") {
      this.stateManager.startFirstSectionFlow();
      this.render();
      return true;
    }

    if (action === "reviewall") {
      this.stateManager.startReviewFlow();
      this.render();
      return true;
    }

    if (action === "toggleReview") {
      this.handleReviewToggle();
      this.render();
      return true;
    }

    if (action === "startsection") {
      this.stateManager.startSectionFlow(actionElement.dataset.sec);
      this.render();
      return true;
    }

    if (action === "reviewsection") {
      this.stateManager.startReviewFlow(actionElement.dataset.sec);
      this.render();
      return true;
    }

    if (action === "nextsection") {
      this.stateManager.continueToNextSection();
      this.render();
      return true;
    }

    if (action === "focusToggle") {
      this.stateManager.toggleFocusedView();
      this.render();
      return true;
    }

    if (action === "secsm") {
      this.stateManager.setActiveSection(value);
      this.stateManager.setMode("assess");
      this.render();
      return true;
    }

    if (action === "jumpto") {
      this.stateManager.jumpToQuestion(actionElement.dataset.id, actionElement.dataset.sec);
      this.render();
      return true;
    }

    if (action === "tier") {
      this.handleTierSelection(
        actionElement.dataset.id,
        Number.parseInt(actionElement.dataset.tn, 10)
      );
      return true;
    }

    if (action === "clear") {
      this.stateManager.clearScore(actionElement.dataset.id);
      this.render();
      return true;
    }

    if (action === "nav") {
      this.stateManager.navigate(Number.parseInt(value, 10));
      this.render();
      return true;
    }

    if (action === "dlxl") {
      this.exportManager.downloadExcel();
      return true;
    }

    if (action === "sharexl") {
      this.exportManager.shareExcel();
      return true;
    }

    if (action === "dljson") {
      this.exportManager.downloadJson();
      return true;
    }

    return false;
  }

  handleReviewToggle() {
    if (this.stateManager.isReviewMode()) {
      this.stateManager.startSectionFlow(this.stateManager.getState().activeSection);
      return;
    }

    this.stateManager.startReviewFlow(this.stateManager.getState().activeSection);
  }

  handleTierSelection(questionId, tierNumber) {
    const shouldShowCheckpoint = this.stateManager.shouldShowCheckpointAfterAdvance();
    const shouldAdvance = this.stateManager.updateScore(questionId, tierNumber);

    if (!shouldAdvance) {
      this.render();
      return;
    }

    if (shouldShowCheckpoint) {
      window.setTimeout(() => {
        this.stateManager.showSectionCheckpoint();
        this.render();
      }, 300);
      return;
    }

    window.setTimeout(() => {
      this.stateManager.moveToNextQuestion();
      this.render();
    }, 300);
  }
}
