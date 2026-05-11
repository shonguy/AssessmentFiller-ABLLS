import { HtmlEscaper } from "../utils.js";

export class AssessmentSidebarRenderer {
  render(viewModel) {
    return `
      <aside class="side" aria-label="Assessment navigation">
        ${this.renderBrand(viewModel)}
        ${this.renderModeActions(viewModel)}
        ${this.renderSections(viewModel)}
      </aside>
    `;
  }

  renderBrand(viewModel) {
    return `
      <div class="side-brand">
        <div class="side-mark" style="background:linear-gradient(135deg,${viewModel.accentColor},var(--s3))">A</div>
        <div class="side-brand-copy">
          <strong>Assessment Filler</strong>
          <span>${HtmlEscaper.escape(viewModel.selectedAssessment.name)}</span>
        </div>
        <button class="side-collapse" data-act="sideToggle" aria-label="Toggle section panel">
          ${viewModel.isSidebarCollapsed ? "›" : "‹"}
        </button>
      </div>
    `;
  }

  renderModeActions(viewModel) {
    return `
      <nav class="side-modes" aria-label="Assessment views">
        ${this.renderModeButton("assess", "Assess", `${viewModel.answeredCount}/${viewModel.totalQuestions}`, viewModel)}
        ${this.renderModeButton("list", "Question list", String(viewModel.totalQuestions), viewModel)}
        ${this.renderModeButton("summary", "Summary", `${viewModel.progressPercent}%`, viewModel)}
      </nav>
    `;
  }

  renderModeButton(mode, label, badge, viewModel) {
    const activeClass = viewModel.mode === mode ? " active" : "";
    return `
      <button class="side-mode${activeClass}" data-act="mode" data-val="${mode}">
        <span class="side-mode-icon">${this.getModeIcon(mode)}</span>
        <span class="side-mode-label">${label}</span>
        <span class="side-mode-badge">${badge}</span>
      </button>
    `;
  }

  renderSections(viewModel) {
    const allSectionButton = this.renderAllSectionsButton(viewModel);
    const sectionButtons = viewModel.sections
      .map((section) => this.renderSectionButton(section, viewModel))
      .join("");

    return `
      <div class="side-section-group">
        <div class="side-section-head">
          <span>Sections</span>
          <span>${viewModel.answeredCount} / ${viewModel.totalQuestions}</span>
        </div>
        <nav class="side-sections" aria-label="Assessment sections">
          ${allSectionButton}
          ${sectionButtons}
        </nav>
      </div>
    `;
  }

  renderAllSectionsButton(viewModel) {
    const activeClass = viewModel.activeSection === null ? " active" : "";

    return `
      <button class="side-section${activeClass}" data-act="sec" data-val="ALL" title="All sections">
        <span class="side-section-letter">All</span>
        <span class="side-section-name">All Sections</span>
        <span class="side-section-count">${viewModel.answeredCount}/${viewModel.totalQuestions}</span>
      </button>
    `;
  }

  renderSectionButton(section, viewModel) {
    const isActive = viewModel.activeSection === section.section;
    const isDone = section.answered === section.questions.length;
    const isPartial = section.answered > 0 && !isDone;
    const className = [
      "side-section",
      isActive ? "active" : "",
      isDone ? "done" : "",
      isPartial ? "partial" : "",
    ].filter(Boolean).join(" ");

    return `
      <button class="${className}" data-act="sec" data-val="${section.section}" title="${HtmlEscaper.escape(section.sectionName)}">
        <span class="side-section-letter">${section.section}</span>
        <span class="side-section-name">${HtmlEscaper.escape(section.sectionName)}</span>
        <span class="side-section-count">${section.answered}/${section.questions.length}</span>
      </button>
    `;
  }

  getModeIcon(mode) {
    const icons = {
      assess: "▶",
      list: "☰",
      summary: "▦",
    };

    return icons[mode] ?? "•";
  }
}
