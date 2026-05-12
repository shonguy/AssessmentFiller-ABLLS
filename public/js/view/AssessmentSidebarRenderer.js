import { HtmlEscaper } from "../utils.js";

export class AssessmentSidebarRenderer {
  render(viewModel) {
    return `
      <aside class="side" id="assessment-sidebar" aria-label="Assessment navigation">
        ${this.renderBrand(viewModel)}
        ${this.renderModeActions(viewModel)}
        ${this.renderSections(viewModel)}
      </aside>
    `;
  }

  renderBrand(viewModel) {
    return `
      <div class="side-brand">
        <div class="side-mark" style="background:linear-gradient(135deg,${viewModel.accentColor},var(--s3))" aria-hidden="true">A</div>
        <div class="side-brand-copy">
          <strong>Assessment Filler</strong>
          <span>${HtmlEscaper.escape(viewModel.selectedAssessment.name)}</span>
        </div>
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
    const isActive = viewModel.mode === mode;
    const ariaCurrent = isActive ? ' aria-current="page"' : "";
    const escapedLabel = HtmlEscaper.escape(label);

    return `
      <button class="side-mode${activeClass}" data-act="mode" data-val="${mode}" aria-label="${escapedLabel}, ${badge}"${ariaCurrent}>
        <span class="side-mode-icon" aria-hidden="true">${this.getModeIcon(mode)}</span>
        <span class="side-mode-label">${escapedLabel}</span>
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
    const ariaCurrent = viewModel.activeSection === null ? ' aria-current="page"' : "";

    return `
      <button class="side-section${activeClass}" data-act="sec" data-val="ALL" title="All sections" aria-label="All sections, ${viewModel.answeredCount} of ${viewModel.totalQuestions} answered"${ariaCurrent}>
        <span class="side-section-letter" aria-hidden="true">All</span>
        <span class="side-section-name">All Sections</span>
        <span class="side-section-count" aria-hidden="true">${viewModel.answeredCount}/${viewModel.totalQuestions}</span>
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
    const ariaCurrent = isActive ? ' aria-current="page"' : "";
    const escapedName = HtmlEscaper.escape(section.sectionName);

    return `
      <button class="${className}" data-act="sec" data-val="${section.section}" title="${escapedName}" aria-label="Section ${section.section}, ${escapedName}, ${section.answered} of ${section.questions.length} answered"${ariaCurrent}>
        <span class="side-section-letter" aria-hidden="true">${section.section}</span>
        <span class="side-section-name">${escapedName}</span>
        <span class="side-section-count" aria-hidden="true">${section.answered}/${section.questions.length}</span>
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
