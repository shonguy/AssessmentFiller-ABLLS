import { HtmlEscaper } from "../utils.js";

export class FocusedAssessmentRenderer {
  render(viewModel) {
    if (viewModel.filteredQuestions.length === 0) {
      return `
        <div class="focused-shell">
          <div class="focused-card">
            <p class="empty-state">No questions in this section.</p>
          </div>
        </div>
      `;
    }

    const question = viewModel.filteredQuestions[viewModel.currentIndex];
    const score = viewModel.scores[question.id];
    const hasScore = score !== undefined;
    const scoreValue = hasScore ? score : 0;
    const progressPercent = Math.max(
      1,
      Math.round(((viewModel.currentIndex + 1) / viewModel.filteredQuestions.length) * 100)
    );
    const tierBlocks = question.t
      .map((tier, index) => this.renderTierBlock(question.id, tier, index + 1, scoreValue, hasScore))
      .join("");

    return `
      <div class="focused-shell">
        <div class="focused-topbar">
          <div class="focused-progress" aria-label="${progressPercent}% complete">
            <div class="focused-progress-fill" style="width:${progressPercent}%"></div>
            <span class="focused-progress-text">${progressPercent}%</span>
          </div>
          <button class="focused-close-button" data-act="focusToggle" aria-label="Exit focused view">×</button>
        </div>
        <div class="focused-card">
          <div class="focused-section">${HtmlEscaper.escape(question.sn)}</div>
          <h2 class="focused-question">${HtmlEscaper.escape(question.d)}</h2>
          <div class="focused-options">
            ${tierBlocks}
            <button class="focused-none${hasScore && score === 0 ? " sel" : ""}" data-act="tier" data-id="${question.id}" data-tn="-1">
              <span class="focused-none-label">None</span>
            </button>
          </div>
        </div>
        <div class="focused-bottom-nav">
          <button class="nbtn focused-nav" data-act="nav" data-val="-1" aria-label="Previous question" ${viewModel.currentIndex === 0 ? "disabled" : ""}>←</button>
          <button class="nbtn focused-nav" data-act="nav" data-val="1" aria-label="Next question" ${viewModel.currentIndex >= viewModel.filteredQuestions.length - 1 ? "disabled" : ""}>→</button>
        </div>
      </div>
    `;
  }

  renderTierBlock(questionId, tierText, tierNumber, scoreValue, hasScore) {
    const isSelected = hasScore && scoreValue >= tierNumber;
    const isExact = hasScore && scoreValue === tierNumber;
    const selectedBackground = "color-mix(in srgb, var(--green) 32%, var(--s2))";
    const exactBackground = "color-mix(in srgb, var(--green) 48%, var(--s2))";
    const background = isExact ? exactBackground : isSelected ? selectedBackground : "var(--s2)";
    const borderColor = isSelected ? "var(--green)" : "var(--s3)";

    return `
      <button class="focused-option${isSelected ? " sel" : ""}" data-act="tier" data-id="${questionId}" data-tn="${tierNumber}" style="background:${background};border-color:${borderColor}">
        <span class="focused-option-text">${HtmlEscaper.escape(tierText)}</span>
      </button>
    `;
  }
}
