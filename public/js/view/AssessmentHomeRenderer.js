import { HtmlEscaper } from "../utils.js";

export class AssessmentHomeRenderer {
  render(viewModel) {
    const sectionQueues = viewModel.sectionQueues;

    return `
      <div class="workflow-home">
        ${this.renderHero(viewModel)}
        ${this.renderQueueGroup("Needs Review", "Pick up sections already in progress.", sectionQueues.needsReview, "Resume Section", "startsection")}
        ${this.renderQueueGroup("Unstarted", "Begin sections you have not touched yet.", sectionQueues.unfinished, "Start Section", "startsection")}
        ${this.renderQueueGroup("Completed", "Finished sections stay here for quick review.", sectionQueues.completed, "Review Section", "startsection")}
      </div>
    `;
  }

  renderHero(viewModel) {
    const primaryAction = viewModel.answeredCount > 0
      ? `<button class="workflow-primary-button" data-act="resume">Continue Where You Left Off</button>`
      : `<button class="workflow-primary-button" data-act="startfirst">Start Assessment</button>`;

    const reviewAction = viewModel.answeredCount > 0 && viewModel.unansweredCount > 0
      ? `<button class="workflow-secondary-button" data-act="reviewall">Review Unanswered</button>`
      : "";

    const title = viewModel.isAssessmentComplete
      ? "Assessment Complete"
      : viewModel.answeredCount > 0
        ? "Continue Where You Left Off"
        : "Start Your Assessment";

    const subtitle = viewModel.isAssessmentComplete
      ? "Everything has been answered. Review sections or export your results."
      : `You have answered ${viewModel.answeredCount} of ${viewModel.totalQuestions} items.`;

    return `
      <div class="workflow-hero">
        <div class="workflow-hero-copy">
          <span class="workflow-kicker">Workflow</span>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
        <div class="workflow-hero-stats">
          <div class="workflow-stat">
            <span class="workflow-stat-value">${viewModel.progressPercent}%</span>
            <span class="workflow-stat-label">Complete</span>
          </div>
          <div class="workflow-stat">
            <span class="workflow-stat-value">${viewModel.unansweredCount}</span>
            <span class="workflow-stat-label">Unanswered</span>
          </div>
        </div>
        <div class="workflow-actions">
          ${primaryAction}
          ${reviewAction}
          <button class="workflow-secondary-button" data-act="mode" data-val="summary">Open Summary</button>
        </div>
      </div>
    `;
  }

  renderQueueGroup(title, subtitle, sections, buttonLabel, action) {
    if (sections.length === 0) {
      return "";
    }

    return `
      <section class="workflow-group">
        <div class="workflow-group-header">
          <h3>${title}</h3>
          <p>${subtitle}</p>
        </div>
        <div class="workflow-grid">
          ${sections.map((section) => this.renderSectionCard(section, buttonLabel, action)).join("")}
        </div>
      </section>
    `;
  }

  renderSectionCard(section, buttonLabel, action) {
    return `
      <div class="workflow-card">
        <div class="workflow-card-header">
          <span class="workflow-section-id">${section.section}</span>
          <span class="workflow-section-progress">${section.answered}/${section.questions.length}</span>
        </div>
        <h4>${HtmlEscaper.escape(section.sectionName)}</h4>
        <p>${section.percentOfMax}% of section max score</p>
        <div class="workflow-mini-bar">
          <div class="workflow-mini-fill" style="width:${section.questions.length ? Math.round((section.answered / section.questions.length) * 100) : 0}%"></div>
        </div>
        <button class="workflow-card-button" data-act="${action}" data-sec="${section.section}">${buttonLabel}</button>
      </div>
    `;
  }
}
