import { AppConstants } from "../constants.js";
import { AssessmentWorkbookArchiveManager } from "./AssessmentWorkbookArchiveManager.js";

export class AssessmentWorkbookTemplateManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.archiveManager = new AssessmentWorkbookArchiveManager();
  }

  async buildWorkbookBlob(scores, options = {}) {
    const zip = await this.archiveManager.loadTemplateZip(AppConstants.paths.workbookTemplate);
    const assessmentCode = this.resolveAssessmentCode(options.assessmentCode);
    const assessmentDate = options.assessmentDate ?? new Date();
    const worksheetPath = await this.archiveManager.resolveWorksheetPath(
      zip,
      AppConstants.workbookTemplate.worksheetName
    );
    const worksheetDocument = await this.archiveManager.loadXmlDocument(zip, worksheetPath);
    const worksheetState = this.archiveManager.buildWorksheetState(worksheetDocument);

    this.clearAssessmentMetadata(worksheetState);
    this.clearScores(worksheetState);
    this.applyAssessmentMetadata(worksheetState, assessmentCode, assessmentDate);
    this.applyScores(worksheetState, scores, assessmentCode);
    zip.file(worksheetPath, this.archiveManager.serializeXmlDocument(worksheetDocument));
    return zip.generateAsync({ type: "blob" });
  }

  resolveAssessmentCode(assessmentCode) {
    const normalizedCode = Number.parseInt(assessmentCode, 10);
    const { defaultAssessmentCode, runSlotRows } = AppConstants.workbookTemplate;

    if (Number.isNaN(normalizedCode) || normalizedCode < 1 || normalizedCode > runSlotRows.length) {
      return defaultAssessmentCode;
    }

    return normalizedCode;
  }

  getRunSlotRow(assessmentCode) {
    return AppConstants.workbookTemplate.runSlotRows[assessmentCode - 1];
  }

  buildExcelDateValue(assessmentDate) {
    const normalizedDate = new Date(
      assessmentDate.getFullYear(),
      assessmentDate.getMonth(),
      assessmentDate.getDate()
    );

    return (
      Date.UTC(
        normalizedDate.getFullYear(),
        normalizedDate.getMonth(),
        normalizedDate.getDate()
      ) - Date.UTC(1899, 11, 30)
    ) / 86400000;
  }

  clearAssessmentMetadata(worksheetState) {
    AppConstants.workbookTemplate.runSlotRows.forEach((row) => {
      const cellAddress = `I${row}`;

      if (this.archiveManager.hasCell(worksheetState, cellAddress)) {
        this.archiveManager.clearCellValue(worksheetState, cellAddress);
      }
    });
  }

  clearScores(worksheetState) {
    this.dataManager.questions.forEach((question) => {
      const scoreMap = this.dataManager.cellMap[question.id];

      if (!scoreMap) {
        return;
      }

      scoreMap.scoreCols.forEach((columnNumber) => {
        this.archiveManager.clearCellValue(
          worksheetState,
          XLSX.utils.encode_cell({ c: columnNumber - 1, r: scoreMap.row - 1 })
        );
      });
    });
  }

  applyScores(worksheetState, scores, assessmentCode) {
    this.dataManager.questions.forEach((question) => {
      const scoreMap = this.dataManager.cellMap[question.id];

      if (!scoreMap) {
        return;
      }

      this.applyQuestionScore(
        worksheetState,
        scoreMap,
        this.normalizeScore(scores[question.id], question.t.length),
        assessmentCode
      );
    });
  }

  normalizeScore(score, maxScore) {
    if (!Number.isFinite(score) || score <= 0) {
      return 0;
    }

    return Math.min(score, maxScore);
  }

  applyQuestionScore(worksheetState, scoreMap, score, assessmentCode) {
    scoreMap.scoreCols.forEach((columnNumber, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: columnNumber - 1, r: scoreMap.row - 1 });

      if (index < score) {
        this.archiveManager.writeNumericCell(worksheetState, cellAddress, assessmentCode);
      }
    });
  }

  applyAssessmentMetadata(worksheetState, assessmentCode, assessmentDate) {
    this.archiveManager.writeNumericCell(
      worksheetState,
      `I${this.getRunSlotRow(assessmentCode)}`,
      this.buildExcelDateValue(assessmentDate)
    );
  }
}
