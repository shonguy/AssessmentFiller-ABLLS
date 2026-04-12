import { AppConstants } from "../constants.js";

export class AssessmentExportMetadataSheetManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  appendMetadataSheet(workbook, scores, assessmentCode, assessmentDate) {
    const worksheet = XLSX.utils.aoa_to_sheet(
      this.buildMetadataRows(scores, assessmentCode, assessmentDate)
    );
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 5 },
      { wch: 35 },
      { wch: 80 },
      { wch: 7 },
      { wch: 10 },
      { wch: 8 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      AppConstants.workbookTemplate.metadataSheetName
    );
    this.hideMetadataSheet(workbook);
  }

  buildMetadataRows(scores, assessmentCode, assessmentDate) {
    const exportDate = new Date().toISOString();
    const rows = [[
      "Item ID",
      "Section",
      "Section Name",
      "Description",
      "Score",
      "Max Tiers",
      "Status",
      "Assessment Code",
      "Assessment Date",
      "Export Date",
    ]];

    this.dataManager.questions.forEach((question) => {
      const answered = scores[question.id] !== undefined;
      const score = answered ? scores[question.id] : "";
      const status = !answered ? "" : score === 0 ? "None" : "Scored";

      rows.push([
        question.id,
        question.s,
        question.sn,
        question.d,
        score,
        question.t.length,
        status,
        assessmentCode,
        this.formatIsoDate(assessmentDate),
        exportDate,
      ]);
    });

    return rows;
  }

  hideMetadataSheet(workbook) {
    const metadataIndex = workbook.SheetNames.indexOf(AppConstants.workbookTemplate.metadataSheetName);

    if (metadataIndex === -1) {
      return;
    }

    workbook.Workbook = workbook.Workbook ?? {};
    workbook.Workbook.Sheets = workbook.Workbook.Sheets
      ?? workbook.SheetNames.map(() => ({ Hidden: 0 }));
    workbook.Workbook.Sheets[metadataIndex] = {
      ...(workbook.Workbook.Sheets[metadataIndex] ?? {}),
      Hidden: 1,
    };
  }

  formatIsoDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }
}
