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
    const tierBlocks = question.t
      .map((tier, index) => this.renderTierBlock(question.id, tier, index + 1, scoreValue, hasScore, viewModel.accentColor))
      .join("");

    return `
      <div class="focused-shell">
        <div class="focused-meta">
          <span class="focused-progress">${viewModel.currentIndex + 1} / ${viewModel.filteredQuestions.length}</span>
          <span class="focused-section">${HtmlEscaper.escape(question.sn)}</span>
        </div>
        <div class="focused-card">
          <span class="qid focused-qid" style="color:${viewModel.accentColor};background:${viewModel.accentColor}22">${HtmlEscaper.escape(question.id)}</span>
          <h2 class="focused-question">${HtmlEscaper.escape(question.d)}</h2>
          <div class="focused-options">
            ${tierBlocks}
            <button class="focused-none${hasScore && score === 0 ? " sel" : ""}" data-act="tier" data-id="${question.id}" data-tn="-1">
              <span class="focused-none-symbol">Ø</span>
              <span class="focused-none-label">None yet</span>
            </button>
          </div>
          <div class="focused-footer">
            <button class="nbtn prev focused-nav" data-act="nav" data-val="-1" ${viewModel.currentIndex === 0 ? "disabled" : ""}>Back</button>
            <button class="nbtn focused-exit" data-act="focusToggle">Exit Focused View</button>
            <button class="nbtn next focused-nav" data-act="nav" data-val="1" style="background:${viewModel.accentColor}" ${viewModel.currentIndex >= viewModel.filteredQuestions.length - 1 ? "disabled" : ""}>Next</button>
          </div>
        </div>
      </div>
    `;
  }

  renderTierBlock(questionId, tierText, tierNumber, scoreValue, hasScore, accentColor) {
    const isSelected = hasScore && scoreValue >= tierNumber;
    const isExact = hasScore && scoreValue === tierNumber;
    const background = isExact ? `${accentColor}20` : isSelected ? `${accentColor}12` : "var(--s2)";
    const borderColor = isExact ? accentColor : isSelected ? `${accentColor}66` : "var(--s3)";

    return `
      <button class="focused-option${isSelected ? " sel" : ""}" data-act="tier" data-id="${questionId}" data-tn="${tierNumber}" style="background:${background};border-color:${borderColor}">
        <span class="focused-option-number" style="color:${isSelected ? accentColor : "var(--tx3)"}">${tierNumber}</span>
        <span class="focused-option-text">${HtmlEscaper.escape(tierText)}</span>
      </button>
    `;
  }
}
