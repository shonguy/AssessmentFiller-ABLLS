import { AssessmentActionHandler } from "./AssessmentActionHandler.js";
import { AssessmentClientManager } from "../managers/AssessmentClientManager.js";

export class AssessmentCoordinator {
  constructor(renderer, stateManager, exportManager, importManager) {
    this.renderer = renderer;
    this.stateManager = stateManager;
    this.exportManager = exportManager;
    this.importManager = importManager;
    this.actionHandler = new AssessmentActionHandler(
      stateManager,
      exportManager,
      () => this.render()
    );
  }

  bindEvents() {
    document.addEventListener("click", (event) => this.handleClick(event));
    document.addEventListener("input", (event) => this.handleInput(event));
    document.addEventListener("change", (event) => this.handleChange(event));
    document.addEventListener("keydown", (event) => this.handleKeydown(event));
  }

  render() {
    this.renderer.render(this.stateManager.buildViewModel());
  }

  handleClick(event) {
    const actionElement = event.target.closest("[data-act]");

    if (!actionElement) {
      this.handleOutsideClick(event);
      return;
    }

    if (this.handleManagementAction(actionElement)) {
      return;
    }

    this.actionHandler.handle(actionElement);
  }

  handleManagementAction(actionElement) {
    const action = actionElement.dataset.act;

    if (action === "renameClient") {
      this.renameSelectedClient();
      return true;
    }

    if (action === "deleteClient") {
      this.deleteSelectedClient();
      return true;
    }

    if (action === "deleteAssessment") {
      this.deleteSelectedAssessment();
      return true;
    }

    return false;
  }

  handleOutsideClick(event) {
    const state = this.stateManager.getState();
    if (
      state.isColorPickerOpen
      && !event.target.closest(".cpop")
      && !event.target.classList.contains("color-dot")
    ) {
      this.stateManager.closeColorPicker();
      this.render();
    }
  }

  handleInput(event) {
    const action = event.target.dataset.act;

    if (action === "cchange") {
      this.stateManager.setAccentColor(event.target.value);
      this.render();
      return;
    }

    if (action === "chex" && /^#[0-9a-fA-F]{6}$/.test(event.target.value)) {
      this.stateManager.setAccentColor(event.target.value);
      this.render();
    }
  }

  async handleChange(event) {
    if (event.target.dataset.act === "client") {
      this.handleClientChange(event.target);
      return;
    }

    if (event.target.dataset.act === "assessment") {
      this.stateManager.setSelectedAssessment(event.target.value);
      this.render();
      return;
    }

    if (event.target.dataset.act !== "upload") {
      return;
    }

    try {
      const importedScores = await this.importManager.importExcel(
        event.target.files[0],
        this.stateManager.getState().scores
      );
      this.stateManager.replaceScores(importedScores);
      this.render();
    } catch (error) {
      alert(`Error reading file: ${error.message}`);
    }
  }

  handleClientChange(selectElement) {
    const state = this.stateManager.getState();

    if (selectElement.value === AssessmentClientManager.addClientOptionId) {
      const clientName = window.prompt("Client name", `Client ${state.clients.length + 1}`);
      if (clientName && clientName.trim()) {
        this.stateManager.addClient(clientName);
      }
      this.render();
      return;
    }

    this.stateManager.setSelectedClient(selectElement.value);
    this.render();
  }

  renameSelectedClient() {
    const selectedClient = this.stateManager.getSelectedClient();
    const clientName = window.prompt("Client name", selectedClient?.name ?? "Client");
    if (clientName && clientName.trim()) {
      this.stateManager.renameSelectedClient(clientName);
    }
    this.render();
  }

  deleteSelectedClient() {
    const selectedClient = this.stateManager.getSelectedClient();
    const message = `Are you sure? Delete ${selectedClient?.name ?? "this client"} and all saved assessments?`;
    if (window.confirm(message)) {
      this.stateManager.deleteSelectedClient();
    }
    this.render();
  }

  deleteSelectedAssessment() {
    const selectedAssessment = this.stateManager.getSelectedAssessment();
    const selectedClient = this.stateManager.getSelectedClient();
    const message = `Are you sure? Delete saved ${selectedAssessment.name} data for ${selectedClient?.name ?? "this client"}?`;
    if (window.confirm(message)) {
      this.stateManager.deleteSelectedAssessment();
    }
    this.render();
  }

  handleKeydown(event) {
    const state = this.stateManager.getState();
    if (state.mode !== "assess" || ["INPUT", "SELECT"].includes(event.target.tagName)) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      this.stateManager.navigate(1);
      this.render();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      this.stateManager.navigate(-1);
      this.render();
      return;
    }

    const currentQuestion = this.stateManager.getCurrentQuestion();
    if (!currentQuestion) {
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      const tierNumber = Number.parseInt(event.key, 10);
      if (tierNumber <= currentQuestion.t.length) {
        this.actionHandler.handleTierSelection(currentQuestion.id, tierNumber);
      }
      return;
    }

    if (event.key === "0") {
      this.actionHandler.handleTierSelection(currentQuestion.id, -1);
      return;
    }

    if (event.key === "Backspace") {
      this.stateManager.clearScore(currentQuestion.id);
      this.render();
    }
  }

}
