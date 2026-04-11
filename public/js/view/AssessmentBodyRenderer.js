import { HtmlEscaper } from "../utils.js";

export class AssessmentBodyRenderer {
  render(viewModel) {
    if (viewModel.mode === "summary") {
      return this.renderSummary(viewModel);
    }

    if (viewModel.mode === "list") {
      return this.renderQuestionList(viewModel);
    }

    return this.renderAssessmentCard(viewModel);
  }

  renderSummary(viewModel) {
    return viewModel.sections.map((section) => `
      <div class="ssec" data-act="secsm" data-val="${section.section}">
        <h3>${section.section} - ${HtmlEscaper.escape(section.sectionName)}</h3>
        <div class="sstat">${section.answered}/${section.questions.length} answered (${section.scored} scored) · ${section.percentOfMax}% of max</div>
        <div class="sbar"><div class="sfill" style="width:${section.percentOfMax}%;background:${viewModel.accentColor}"></div></div>
      </div>
    `).join("");
  }

  renderQuestionList(viewModel) {
    const sectionsToRender = viewModel.activeSection
      ? viewModel.sections.filter((section) => section.section === viewModel.activeSection)
      : viewModel.sections;

    return sectionsToRender.map((section) => {
      const items = section.questions.map((question) => this.renderQuestionListItem(question, viewModel)).join("");
      return `
        <div class="qlist">
          <h3>
            <span style="color:${viewModel.accentColor}">${section.section}</span>
            ${HtmlEscaper.escape(section.sectionName)}
            <span style="font-weight:400;font-size:12px;color:var(--tx3)">(${section.questions.length})</span>
          </h3>
          ${items}
        </div>
      `;
    }).join("");
  }

  renderQuestionListItem(question, viewModel) {
    const score = viewModel.scores[question.id];
    const answered = score !== undefined;
    const scoreBackground = !answered ? "transparent" : score === 0 ? "var(--tx3)" : viewModel.accentColor;
    const scoreColor = !answered ? "var(--tx3)" : "#fff";
    const scoreText = !answered ? "–" : score === 0 ? "Ø" : String(score);

    return `
      <div class="qlist-item" data-act="jumpto" data-id="${question.id}" data-sec="${question.s}">
        <span class="qlist-id">${question.id}</span>
        <span class="qlist-desc">${HtmlEscaper.escape(question.d)}</span>
        <span class="qlist-score" style="background:${scoreBackground};color:${scoreColor}">${scoreText}</span>
      </div>
    `;
  }

  renderAssessmentCard(viewModel) {
    if (viewModel.filteredQuestions.length === 0) {
      return '<div class="card"><p class="empty-state">No questions in this section.</p></div>';
    }

    const question = viewModel.filteredQuestions[viewModel.currentIndex];
    const score = viewModel.scores[question.id];
    const hasScore = score !== undefined;
    const scoreValue = hasScore ? score : 0;
    const tierBlocks = question.t
      .map((tier, index) => this.renderTierBlock(question.id, tier, index + 1, scoreValue, hasScore, viewModel.accentColor))
      .join("");
    const noneSelected = hasScore && score === 0;
    const answeredHint = hasScore
      ? `<div class="answered-hint">✓ Answered${score === 0 ? " (None)" : ""} · <span class="clr" data-act="clear" data-id="${question.id}">clear</span></div>`
      : "";

    return `
      <div class="card">
        <div class="navr">
          <button class="nbtn prev" data-act="nav" data-val="-1" ${viewModel.currentIndex === 0 ? "disabled" : ""}>← Back</button>
          <span class="nctr">${viewModel.currentIndex + 1} / ${viewModel.filteredQuestions.length}</span>
          <button class="nbtn next" data-act="nav" data-val="1" style="background:${viewModel.accentColor}" ${viewModel.currentIndex >= viewModel.filteredQuestions.length - 1 ? "disabled" : ""}>Next →</button>
        </div>
        <span class="qid" style="color:${viewModel.accentColor};background:${viewModel.accentColor}26">${HtmlEscaper.escape(question.id)}</span>
        <div class="qsec">${HtmlEscaper.escape(question.sn)}</div>
        <div class="qdesc">${HtmlEscaper.escape(question.d)}</div>
        <div class="trow">
          ${tierBlocks}
          <div class="tnone${noneSelected ? " sel" : ""}" data-act="tier" data-id="${question.id}" data-tn="-1">
            <span>Ø</span>
            <span class="tnone-label">None</span>
          </div>
        </div>
        ${answeredHint}
      </div>
    `;
  }

  renderTierBlock(questionId, tierText, tierNumber, scoreValue, hasScore, accentColor) {
    const isSelected = hasScore && scoreValue >= tierNumber;
    const isExact = hasScore && scoreValue === tierNumber;
    const background = isExact ? `${accentColor}26` : isSelected ? `${accentColor}14` : "var(--s2)";
    const borderColor = isExact ? accentColor : isSelected ? `${accentColor}66` : "transparent";
    const shadow = isExact ? `0 0 24px ${accentColor}22` : "none";

    return `
      <div class="tblk${isSelected ? " sel" : ""}" data-act="tier" data-id="${questionId}" data-tn="${tierNumber}" style="background:${background};border-color:${borderColor};box-shadow:${shadow}">
        <div class="tnum" style="color:${isSelected ? accentColor : "var(--tx3)"}">${tierNumber}</div>
        <div class="ttxt">${HtmlEscaper.escape(tierText)}</div>
      </div>
    `;
  }
}
