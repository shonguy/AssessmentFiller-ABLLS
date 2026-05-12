import { AppConstants } from "../constants.js";
import { FileDownloadHelper } from "../utils.js";
import { AssessmentWorkbookTemplateManager } from "./AssessmentWorkbookTemplateManager.js";

export class AssessmentExportManager {
  constructor(getDataManager, getState) {
    this.getDataManager = getDataManager;
    this.getState = getState;
    this.jszipLoadPromise = null;
    this.templateManagers = new Map();
  }

  static excelMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  downloadJson() {
    const state = this.getState();
    const selectedClient = state.clients?.find((client) => client.id === state.selectedClientId);
    const payload = {
      assessment: this.getDataManager().assessment.name,
      client: selectedClient?.name,
      exportDate: new Date().toISOString(),
      highlightColor: state.accentColor,
      scores: state.scores,
    };

    FileDownloadHelper.downloadText(
      `${state.selectedAssessmentId}-scores.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  async downloadExcel() {
    try {
      await this.ensureExcelExportSupport();
      const excelBlob = await this.buildExcelBlob();
      FileDownloadHelper.downloadBlob(this.getExcelFilename(), excelBlob);
    } catch (error) {
      alert(error.message || "Excel export failed.");
    }
  }

  async shareExcel() {
    let excelBlob;

    try {
      await this.ensureExcelExportSupport();
      excelBlob = await this.buildExcelBlob();
      const excelFile = new File(
        [excelBlob],
        this.getExcelFilename(),
        { type: AssessmentExportManager.excelMimeType }
      );

      if (!this.canShareFiles([excelFile])) {
        FileDownloadHelper.downloadBlob(this.getExcelFilename(), excelBlob);
        alert("Sharing is not supported here, so the export was downloaded instead.");
        return;
      }

      await navigator.share({
        files: [excelFile],
        title: this.getExcelFilename(),
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      if (excelBlob) {
        FileDownloadHelper.downloadBlob(this.getExcelFilename(), excelBlob);
        alert("Sharing failed, so the export was downloaded instead.");
        return;
      }

      alert(error.message || "Excel export failed.");
    }
  }

  async buildExcelBlob() {
    const state = this.getState();
    const selectedClient = state.clients?.find((client) => client.id === state.selectedClientId);

    return this.getTemplateManager().buildWorkbookBlob(state.scores, {
      assessmentCode: this.getDataManager().assessment.workbookTemplate.defaultAssessmentCode,
      assessmentDate: new Date(),
      clientName: selectedClient?.name,
    });
  }

  getExcelFilename() {
    return this.getDataManager().assessment.exportFilename;
  }

  getTemplateManager() {
    const dataManager = this.getDataManager();
    if (!this.templateManagers.has(dataManager.assessment.id)) {
      this.templateManagers.set(
        dataManager.assessment.id,
        new AssessmentWorkbookTemplateManager(dataManager)
      );
    }

    return this.templateManagers.get(dataManager.assessment.id);
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

  async ensureExcelExportSupport() {
    if (window.JSZip) {
      return;
    }

    this.jszipLoadPromise = this.jszipLoadPromise ?? this.loadScript(AppConstants.paths.jszip);
    await this.jszipLoadPromise;

    if (!window.JSZip) {
      throw new Error("Excel export is not available right now.");
    }
  }

  loadScript(sourcePath) {
    return new Promise((resolve, reject) => {
      const absoluteSource = new URL(sourcePath, window.location.origin).href;
      const existingScript = Array.from(document.scripts)
        .find((script) => script.src === absoluteSource);

      if (existingScript) {
        if (window.JSZip) {
          resolve();
          return;
        }
      }

      const script = document.createElement("script");
      script.src = existingScript ? `${sourcePath}?retry=${Date.now()}` : sourcePath;
      script.async = true;
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener(
        "error",
        () => reject(new Error("Excel export is not available right now.")),
        { once: true }
      );
      document.head.appendChild(script);
    });
  }
}
