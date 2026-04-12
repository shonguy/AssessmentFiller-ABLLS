import { AppConstants } from "../constants.js";
import { FileDownloadHelper } from "../utils.js";
import { AssessmentWorkbookTemplateManager } from "./AssessmentWorkbookTemplateManager.js";

export class AssessmentExportManager {
  constructor(dataManager, getState) {
    this.dataManager = dataManager;
    this.getState = getState;
    this.templateManager = new AssessmentWorkbookTemplateManager(dataManager);
  }

  static excelFilename = "ablls-r-assessment.xlsx";

  static excelMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

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

  async downloadExcel() {
    if (!window.JSZip) {
      alert("Excel export is not available right now.");
      return;
    }

    try {
      const excelBlob = await this.buildExcelBlob();
      FileDownloadHelper.downloadBlob(AssessmentExportManager.excelFilename, excelBlob);
    } catch (error) {
      alert(error.message || "Excel export failed.");
    }
  }

  async shareExcel() {
    if (!window.JSZip) {
      alert("Excel export is not available right now.");
      return;
    }

    let excelBlob;

    try {
      excelBlob = await this.buildExcelBlob();
      const excelFile = new File(
        [excelBlob],
        AssessmentExportManager.excelFilename,
        { type: AssessmentExportManager.excelMimeType }
      );

      if (!this.canShareFiles([excelFile])) {
        FileDownloadHelper.downloadBlob(AssessmentExportManager.excelFilename, excelBlob);
        alert("Sharing is not supported here, so the export was downloaded instead.");
        return;
      }

      await navigator.share({
        files: [excelFile],
        title: AssessmentExportManager.excelFilename,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      if (excelBlob) {
        FileDownloadHelper.downloadBlob(AssessmentExportManager.excelFilename, excelBlob);
        alert("Sharing failed, so the export was downloaded instead.");
        return;
      }

      alert(error.message || "Excel export failed.");
    }
  }

  async buildExcelBlob() {
    const state = this.getState();
    return this.templateManager.buildWorkbookBlob(state.scores, {
      assessmentCode: AppConstants.workbookTemplate.defaultAssessmentCode,
      assessmentDate: new Date(),
    });
  }

  canShareFiles(files) {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return false;
    }

    if (typeof navigator.canShare !== "function") {
      return false;
    }

    return navigator.canShare({ files });
  }
}
