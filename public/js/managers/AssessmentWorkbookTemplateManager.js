import { AssessmentWorkbookArchiveManager } from "./AssessmentWorkbookArchiveManager.js";

export class AssessmentWorkbookTemplateManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.archiveManager = new AssessmentWorkbookArchiveManager();
  }

  async buildWorkbookBlob(scores, options = {}) {
    const template = this.getWorkbookTemplate();
    const zip = await this.archiveManager.loadTemplateZip(this.dataManager.assessment.paths.workbookTemplate);
    const assessmentCode = this.resolveAssessmentCode(options.assessmentCode);
    const assessmentDate = options.assessmentDate ?? new Date();
    const worksheetPath = await this.archiveManager.resolveWorksheetPath(
      zip,
      template.worksheetName
    );
    const worksheetDocument = await this.archiveManager.loadXmlDocument(zip, worksheetPath);
    const worksheetState = this.archiveManager.buildWorksheetState(worksheetDocument);

    this.clearAssessmentMetadata(worksheetState);
    this.clearScores(worksheetState);
    this.applyAssessmentMetadata(worksheetState, assessmentCode, assessmentDate, { ...options, scores });
    this.applyScores(worksheetState, scores, assessmentCode);
    zip.file(worksheetPath, this.archiveManager.serializeXmlDocument(worksheetDocument));
    return zip.generateAsync({ type: "blob" });
  }

  resolveAssessmentCode(assessmentCode) {
    const normalizedCode = Number.parseInt(assessmentCode, 10);
    const { defaultAssessmentCode, runSlotRows } = this.getWorkbookTemplate();

    if (Number.isNaN(normalizedCode) || normalizedCode < 1 || normalizedCode > runSlotRows.length) {
      return defaultAssessmentCode;
    }

    return normalizedCode;
  }

  getRunSlotRow(assessmentCode) {
    return this.getWorkbookTemplate().runSlotRows[assessmentCode - 1];
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
    const template = this.getWorkbookTemplate();
    const clearColumns = [template.dateColumn, template.scoreColumn].filter(Boolean);

    template.runSlotRows.forEach((row) => {
      clearColumns.forEach((column) => this.clearOptionalCell(worksheetState, `${column}${row}`));
    });

    if (template.clientNameCell) {
      this.clearOptionalCell(worksheetState, template.clientNameCell);
    }
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

  applyAssessmentMetadata(worksheetState, assessmentCode, assessmentDate, options) {
    const template = this.getWorkbookTemplate();
    const runSlotRow = this.getRunSlotRow(assessmentCode);

    if (template.dateColumn) {
      this.archiveManager.writeNumericCell(
        worksheetState,
        `${template.dateColumn}${runSlotRow}`,
        this.buildExcelDateValue(assessmentDate)
      );
    }

    if (template.scoreColumn) {
      this.archiveManager.writeNumericCell(
        worksheetState,
        `${template.scoreColumn}${runSlotRow}`,
        this.calculateScoreTotal(options.scores ?? {})
      );
    }

    if (template.clientNameCell && options.clientName) {
      this.archiveManager.writeInlineStringCell(
        worksheetState,
        template.clientNameCell,
        options.clientName,
        template.clientNameStyleCell
      );
    }
  }

  calculateScoreTotal(scores) {
    return this.dataManager.questions.reduce(
      (total, question) => total + this.normalizeScore(scores[question.id], question.t.length),
      0
    );
  }

  clearOptionalCell(worksheetState, cellAddress) {
    if (this.archiveManager.hasCell(worksheetState, cellAddress)) {
      this.archiveManager.clearCellValue(worksheetState, cellAddress);
    }
  }

  getWorkbookTemplate() {
    return this.dataManager.assessment.workbookTemplate;
  }
}
