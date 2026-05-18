export class AssessmentWorkbookSheetSelector {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  selectTemplateWorksheet(workbook, preferredWorksheetName) {
    const preferredCandidate = this.buildWorksheetCandidate(workbook, preferredWorksheetName);
    if (preferredCandidate?.scoreCount > 0) {
      return preferredCandidate.worksheet;
    }

    const scoredAssessmentCandidate = this.getWorksheetCandidates(workbook)
      .find((candidate) => this.isAssessmentSheet(candidate) && candidate.scoreCount > 0);

    return scoredAssessmentCandidate?.worksheet ?? preferredCandidate?.worksheet ?? null;
  }

  getWorksheetCandidates(workbook) {
    return workbook.SheetNames
      .map((sheetName) => this.buildWorksheetCandidate(workbook, sheetName))
      .filter(Boolean);
  }

  buildWorksheetCandidate(workbook, sheetName) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return null;
    }

    return {
      name: sheetName,
      worksheet,
      scoreCount: this.countFilledScores(worksheet),
    };
  }

  countFilledScores(worksheet) {
    return this.dataManager.questions.reduce((total, question) => {
      const scoreMap = this.dataManager.cellMap[question.id];
      if (!scoreMap) {
        return total;
      }

      return total + scoreMap.scoreCols.filter((columnNumber) => {
        const cellAddress = XLSX.utils.encode_cell({
          c: columnNumber - 1,
          r: scoreMap.row - 1,
        });
        return AssessmentWorkbookSheetSelector.isFilledTemplateCell(worksheet[cellAddress]);
      }).length;
    }, 0);
  }

  isAssessmentSheet(candidate) {
    const templateName = this.dataManager.assessment.workbookTemplate.worksheetName;
    const metadataName = this.dataManager.assessment.workbookTemplate.metadataSheetName;
    const normalizedName = candidate.name.trim().toLowerCase();

    return candidate.name !== templateName
      && candidate.name !== metadataName
      && !normalizedName.startsWith("example");
  }

  static isFilledTemplateCell(cell) {
    const normalizedValue = Number(cell?.v);
    return Number.isFinite(normalizedValue) && normalizedValue > 0;
  }
}
