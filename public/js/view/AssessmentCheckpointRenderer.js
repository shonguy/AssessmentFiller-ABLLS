import { HtmlEscaper } from "../utils.js";

export class AssessmentCheckpointRenderer {
  render(viewModel) {
    const checkpoint = viewModel.checkpoint;
    if (!checkpoint) {
      return "";
    }

    const reviewButton = checkpoint.unansweredTarget
      ? `<button class="workflow-secondary-button" data-act="reviewsection" data-sec="${checkpoint.section}">Review Unanswered</button>`
      : "";

    const nextButton = checkpoint.nextTarget
      ? `<button class="workflow-primary-button" data-act="nextsection">Continue to Next Section</button>`
      : `<button class="workflow-primary-button" data-act="home">Return Home</button>`;

    return `
      <div class="workflow-checkpoint">
        <div class="workflow-checkpoint-card">
          <span class="workflow-kicker">Section Checkpoint</span>
          <h2>${checkpoint.section} - ${HtmlEscaper.escape(checkpoint.sectionName)}</h2>
          <p>${checkpoint.answered} of ${checkpoint.questions.length} items answered.</p>
          <div class="workflow-checkpoint-stats">
            <div class="workflow-stat">
              <span class="workflow-stat-value">${checkpoint.answered}</span>
              <span class="workflow-stat-label">Answered</span>
            </div>
            <div class="workflow-stat">
              <span class="workflow-stat-value">${checkpoint.questions.length - checkpoint.answered}</span>
              <span class="workflow-stat-label">Remaining</span>
            </div>
          </div>
          <div class="workflow-actions">
            ${nextButton}
            ${reviewButton}
            <button class="workflow-secondary-button" data-act="home">Section Overview</button>
          </div>
        </div>
      </div>
    `;
  }
}
