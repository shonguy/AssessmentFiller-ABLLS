import { FileDownloadHelper } from "../utils.js";

export class AssessmentExportManager {
  constructor(dataManager, getState) {
    this.dataManager = dataManager;
    this.getState = getState;
  }

  downloadJson() {
    const state = this.getState();
    const payload = {
      exportDate: new Date().toISOString(),
      highlightColor: state.accentColor,
      scores: state.scores,
    };

    FileDownloadHelper.downloadText(
      "ablls-r-scores.json",
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  downloadExcel() {
    if (!window.XLSX) {
      alert("Excel export is not available right now.");
      return;
    }

    const state = this.getState();
    const rows = [["Item ID", "Section", "Section Name", "Description", "Score", "Max Tiers", "Status"]];

    this.dataManager.questions.forEach((question) => {
      const answered = state.scores[question.id] !== undefined;
      const score = answered ? state.scores[question.id] : "";
      const status = !answered ? "" : score === 0 ? "None" : "Scored";
      rows.push([question.id, question.s, question.sn, question.d, score, question.t.length, status]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 8 }, { wch: 5 }, { wch: 35 }, { wch: 80 }, { wch: 7 }, { wch: 10 }, { wch: 8 }];

    const summaryRows = [["Section", "Name", "Answered", "Total", "Scored", "Points", "Max Points", "% of Max"]];
    this.dataManager.buildSummary(state.scores).forEach((summary) => {
      summaryRows.push([
        summary.section,
        summary.sectionName,
        summary.answered,
        summary.questions.length,
        summary.scored,
        summary.points,
        summary.maxPoints,
        `${summary.percentOfMax}%`,
      ]);
    });

    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryRows);
    summaryWorksheet["!cols"] = [{ wch: 8 }, { wch: 35 }, { wch: 9 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ABLLS-R Scores");
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");
    XLSX.writeFile(workbook, "ablls-r-scored.xlsx");
  }
}
