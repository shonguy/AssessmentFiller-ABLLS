import { AppConstants } from "../constants.js";

export class AssessmentWorkbookTemplateManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  async buildWorkbook(scores, options = {}) {
    const workbook = await this.loadTemplateWorkbook();
    const worksheet = workbook.Sheets[AppConstants.workbookTemplate.worksheetName];

    if (!worksheet) {
      throw new Error("The ABLLS workbook template is missing its assessment sheet.");
    }

    const assessmentCode = this.resolveAssessmentCode(options.assessmentCode);
    const assessmentDate = options.assessmentDate ?? new Date();

    this.applyAssessmentMetadata(worksheet, assessmentCode, assessmentDate);
    this.applyScores(worksheet, scores, assessmentCode);

    return workbook;
  }

  async loadTemplateWorkbook() {
    const response = await fetch(AppConstants.paths.workbookTemplate);

    if (!response.ok) {
      throw new Error("Unable to load the ABLLS workbook template.");
    }

    const workbook = XLSX.read(await response.arrayBuffer(), {
      type: "array",
      cellFormula: true,
      cellNF: true,
      cellStyles: true,
      sheetStubs: true,
    });

    this.ensureWorkbookRecalculation(workbook);
    return workbook;
  }

  ensureWorkbookRecalculation(workbook) {
    workbook.Workbook = workbook.Workbook ?? {};
    workbook.Workbook.CalcPr = {
      ...(workbook.Workbook.CalcPr ?? {}),
      fullCalcOnLoad: "1",
      forceFullCalc: "1",
    };
  }

  resolveAssessmentCode(assessmentCode) {
    const normalizedCode = Number.parseInt(assessmentCode, 10);
    const { defaultAssessmentCode, runSlotCount } = AppConstants.workbookTemplate;

    if (Number.isNaN(normalizedCode) || normalizedCode < 1 || normalizedCode > runSlotCount) {
      return defaultAssessmentCode;
    }

    return normalizedCode;
  }

  applyAssessmentMetadata(worksheet, assessmentCode, assessmentDate) {
    const slotRow = this.getRunSlotRow(assessmentCode);
    const excelDateValue = this.buildExcelDateValue(assessmentDate);

    this.writeNumericCell(worksheet, `I${slotRow}`, excelDateValue);
    this.writeFormulaCacheCell(worksheet, `AA${slotRow - 1}`, excelDateValue);
  }

  getRunSlotRow(assessmentCode) {
    const { runSlotStartRow, runSlotRowStep } = AppConstants.workbookTemplate;
    return runSlotStartRow + ((assessmentCode - 1) * runSlotRowStep);
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

  applyScores(worksheet, scores, assessmentCode) {
    this.dataManager.questions.forEach((question) => {
      const scoreMap = this.dataManager.cellMap[question.id];

      if (!scoreMap) {
        return;
      }

      const normalizedScore = this.normalizeScore(scores[question.id], question.t.length);
      this.applyQuestionScore(worksheet, scoreMap, normalizedScore, assessmentCode);
    });
  }

  normalizeScore(score, maxScore) {
    if (!Number.isFinite(score) || score <= 0) {
      return 0;
    }

    return Math.min(score, maxScore);
  }

  applyQuestionScore(worksheet, scoreMap, score, assessmentCode) {
    scoreMap.scoreCols.forEach((columnNumber, index) => {
      const cellAddress = XLSX.utils.encode_cell({
        c: columnNumber - 1,
        r: scoreMap.row - 1,
      });

      if (index < score) {
        this.writeNumericCell(worksheet, cellAddress, assessmentCode);
        return;
      }

      this.clearCellValue(worksheet, cellAddress);
    });
  }

  writeNumericCell(worksheet, cellAddress, value) {
    const cell = worksheet[cellAddress] ?? {};
    cell.t = "n";
    cell.v = value;
    delete cell.w;
    worksheet[cellAddress] = cell;
  }

  writeFormulaCacheCell(worksheet, cellAddress, value) {
    const cell = worksheet[cellAddress] ?? {};
    cell.v = value;
    delete cell.t;
    delete cell.w;
    worksheet[cellAddress] = cell;
  }

  clearCellValue(worksheet, cellAddress) {
    const cell = worksheet[cellAddress];

    if (!cell) {
      return;
    }

    delete cell.v;
    delete cell.w;
    if (!cell.f) {
      cell.t = "z";
    }
  }
}
