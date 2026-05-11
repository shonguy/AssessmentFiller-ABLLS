import { AppConstants } from "../constants.js";
import { HtmlEscaper } from "../utils.js";
import { AssessmentBodyRenderer } from "./AssessmentBodyRenderer.js";
import { AssessmentSidebarRenderer } from "./AssessmentSidebarRenderer.js";

export class AssessmentRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.bodyRenderer = new AssessmentBodyRenderer();
    this.sidebarRenderer = new AssessmentSidebarRenderer();
  }

  render(viewModel) {
    this.rootElement.classList.toggle("app-focused", viewModel.isFocusedView);
    this.rootElement.classList.toggle("app-shell", !viewModel.isFocusedView);
    this.rootElement.classList.toggle("app-sidebar-collapsed", viewModel.isSidebarCollapsed);

    if (viewModel.isFocusedView) {
      this.rootElement.innerHTML = this.bodyRenderer.render(viewModel);
      return;
    }

    const bodyHtml = this.bodyRenderer.render(viewModel);
    const pageHtml = viewModel.mode === "home" || viewModel.mode === "checkpoint"
      ? bodyHtml
      : `
        ${this.renderToolbar(viewModel)}
        ${bodyHtml}
      `;

    this.rootElement.innerHTML = `
      ${this.sidebarRenderer.render(viewModel)}
      <main class="app-main">
        ${this.renderTopbar(viewModel)}
        ${pageHtml}
      </main>
    `;
  }

  renderTopbar(viewModel) {
    const themeIcon = viewModel.isDarkTheme ? "☾" : '<span style="color:#e8a838">☀</span>';
    const assessmentOptions = viewModel.assessments.map((assessment) => {
      const selected = assessment.id === viewModel.selectedAssessmentId ? " selected" : "";
      return `<option value="${assessment.id}"${selected}>${HtmlEscaper.escape(assessment.name)}</option>`;
    }).join("");
    const clientOptions = viewModel.clients.map((client) => {
      const selected = client.id === viewModel.selectedClientId ? " selected" : "";
      return `<option value="${HtmlEscaper.escape(client.id)}"${selected}>${HtmlEscaper.escape(client.name)}</option>`;
    }).join("");
    const swatches = AppConstants.accentColors.map((color) => {
      const activeClass = viewModel.accentColor === color ? " active" : "";
      return `<button class="cpop-swatch${activeClass}" data-act="cpick" data-val="${color}" style="background:${color}"></button>`;
    }).join("");

    return `
      <div class="topbar">
        <button class="side-toggle" data-act="sideToggle" aria-label="Toggle section panel">
          ${viewModel.isSidebarCollapsed ? "☰" : "‹"}
        </button>
        <div class="assessment-title">
          <h1>Assessment Filler</h1>
          <div class="topbar-pickers">
            <label class="assessment-picker">
              <span>Client</span>
              <select data-act="client" aria-label="Client">
                ${clientOptions}
                <option value="${viewModel.addClientOptionId}">+ Add Client</option>
              </select>
            </label>
            <label class="assessment-picker">
              <span>Assessment</span>
              <select data-act="assessment" aria-label="Assessment">
                ${assessmentOptions}
              </select>
            </label>
          </div>
        </div>
        <div class="topbar-right">
          ${this.renderTopbarProgress(viewModel)}
          <button class="theme-btn" data-act="theme">${themeIcon}</button>
          <div style="position:relative">
            <button class="color-dot" data-act="cpToggle" style="background:${viewModel.accentColor}"></button>
            <div class="cpop${viewModel.isColorPickerOpen ? " open" : ""}">
              <div class="cpop-label">Highlight Color</div>
              <div class="cpop-presets">${swatches}</div>
              <div class="cpop-custom">
                <input type="color" value="${viewModel.accentColor}" data-act="cchange">
                <input type="text" value="${viewModel.accentColor}" maxlength="7" data-act="chex">
              </div>
            </div>
          </div>
          <span class="counter">${viewModel.answeredCount} / ${viewModel.totalQuestions}</span>
        </div>
      </div>
    `;
  }

  renderTopbarProgress(viewModel) {
    return `
      <div class="topbar-progress" aria-label="${viewModel.progressPercent}% complete">
        <div class="topbar-progress-track">
          <div class="topbar-progress-fill" style="width:${viewModel.progressPercent}%;background:${viewModel.accentColor}"></div>
        </div>
        <span>${viewModel.progressPercent}%</span>
      </div>
    `;
  }

  renderToolbar(viewModel) {
    return `
      <div class="toolbar">
        <span class="toolbar-label">${viewModel.answeredCount} of ${viewModel.totalQuestions} answered</span>
        <button class="tbtn" data-act="home">Home</button>
        <button class="tbtn" data-act="toggleReview">${viewModel.isReviewMode ? "All Questions" : "Review Unanswered"}</button>
        <button class="tbtn focus-btn" data-act="focusToggle">Focused View</button>
        <button class="tbtn share-btn" data-act="sharexl">Share Export</button>
        <button class="dlbtn-big" data-act="dlxl">
          <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          Download Excel
        </button>
        <button class="tbtn" data-act="dljson">Download JSON</button>
        <label class="ulbtn">Upload .xlsx<input type="file" accept=".xlsx" data-act="upload"></label>
      </div>
    `;
  }

}
