import { AppConstants } from "../constants.js";
import { HtmlEscaper } from "../utils.js";
import { AssessmentBodyRenderer } from "./AssessmentBodyRenderer.js";

export class AssessmentRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.bodyRenderer = new AssessmentBodyRenderer();
  }

  render(viewModel) {
    this.rootElement.classList.toggle("app-focused", viewModel.isFocusedView);

    if (viewModel.isFocusedView) {
      this.rootElement.innerHTML = this.bodyRenderer.render(viewModel);
      return;
    }

    const bodyHtml = this.bodyRenderer.render(viewModel);
    if (viewModel.mode === "home" || viewModel.mode === "checkpoint") {
      this.rootElement.innerHTML = `
        ${this.renderTopbar(viewModel)}
        ${bodyHtml}
      `;
      return;
    }

    const sectionsHtml = this.renderSectionButtons(viewModel);

    this.rootElement.innerHTML = `
      ${this.renderTopbar(viewModel)}
      <div class="pbar">
        <div class="pfill" style="width:${viewModel.progressPercent}%;background:linear-gradient(90deg,${viewModel.accentColor},var(--tx2))"></div>
      </div>
      <div class="snav">${sectionsHtml}</div>
      ${this.renderToolbar(viewModel)}
      ${this.renderModeToggle(viewModel)}
      ${bodyHtml}
    `;
  }

  renderTopbar(viewModel) {
    const themeIcon = viewModel.isDarkTheme ? "☾" : '<span style="color:#e8a838">☀</span>';
    const swatches = AppConstants.accentColors.map((color) => {
      const activeClass = viewModel.accentColor === color ? " active" : "";
      return `<button class="cpop-swatch${activeClass}" data-act="cpick" data-val="${color}" style="background:${color}"></button>`;
    }).join("");

    return `
      <div class="topbar">
        <h1>Assessment Filler - ABLLS-R</h1>
        <div class="topbar-right">
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

  renderSectionButtons(viewModel) {
    const allButton = this.renderSectionButton("All", null, viewModel);
    const sectionButtons = viewModel.sections
      .map((section) => this.renderSectionButton(section.section, section.section, viewModel))
      .join("");

    return `${allButton}${sectionButtons}`;
  }

  renderSectionButton(label, value, viewModel) {
    if (value === null) {
      const activeClass = viewModel.activeSection === null ? " active" : "";
      const style = viewModel.activeSection === null ? `background:${viewModel.accentColor}` : "";
      return `<button class="sbtn${activeClass}" data-act="sec" data-val="ALL" style="${style}">${label}</button>`;
    }

    const section = viewModel.sections.find((entry) => entry.section === value);
    let className = "sbtn";
    if (viewModel.activeSection === value) {
      className += " active";
    } else if (section.answered === section.questions.length) {
      className += " done";
    } else if (section.answered > 0) {
      className += " partial";
    }

    const style = viewModel.activeSection === value ? `background:${viewModel.accentColor}` : "";
    return `<button class="${className}" data-act="sec" data-val="${value}" style="${style}" title="${HtmlEscaper.escape(section.sectionName)}">${label}</button>`;
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

  renderModeToggle(viewModel) {
    return `
      <div class="mtog">
        ${this.renderModeButton("assess", "Assess", viewModel)}
        ${this.renderModeButton("summary", "Summary", viewModel)}
        ${this.renderModeButton("list", "Question List", viewModel)}
      </div>
    `;
  }

  renderModeButton(mode, label, viewModel) {
    const isActive = viewModel.mode === mode;
    const activeStyle = isActive ? `background:${viewModel.accentColor};border-color:${viewModel.accentColor}` : "";
    return `<button class="mbtn${isActive ? " active" : ""}" data-act="mode" data-val="${mode}" style="${activeStyle}">${label}</button>`;
  }

}
