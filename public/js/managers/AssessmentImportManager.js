import { AppConstants } from "../constants.js";

export class AssessmentImportManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  importExcel(file, currentScores) {
    if (!file) {
      return Promise.resolve(currentScores);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, {
            type: "array",
            sheetStubs: true,
          });
          const { importedCount, importedScores } = this.readWorkbookScores(workbook, currentScores);

          alert(`Imported ${importedCount} scores from ${file.name}`);
          resolve(importedScores);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Error reading file."));
      reader.readAsArrayBuffer(file);
    });
  }

  readWorkbookScores(workbook, currentScores) {
    const metadataWorksheet = workbook.Sheets[AppConstants.workbookTemplate.metadataSheetName];
    if (metadataWorksheet) {
      return this.readMetadataWorksheet(metadataWorksheet, currentScores);
    }

    const fallbackWorksheet = this.findWorksheetWithItemIdHeader(workbook);
    if (fallbackWorksheet) {
      return this.readMetadataWorksheet(fallbackWorksheet, currentScores);
    }

    const templateWorksheet = workbook.Sheets[AppConstants.workbookTemplate.worksheetName];
    if (templateWorksheet) {
      return this.readTemplateWorksheet(templateWorksheet, currentScores);
    }

    throw new Error("Could not find AssessmentFiller data or the ABLLS template sheet.");
  }

  readMetadataWorksheet(worksheet, currentScores) {
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const importedScores = { ...currentScores };
    const headerIndex = this.findHeaderIndex(rows);

    if (headerIndex === -1) {
      throw new Error("Could not find header row. Make sure the first column header is Item ID.");
    }

    const scoreColumnIndex = this.findColumnIndex(rows[headerIndex], "Score");
    const statusColumnIndex = this.findColumnIndex(rows[headerIndex], "Status");

    if (scoreColumnIndex === -1 || statusColumnIndex === -1) {
      throw new Error("The imported score sheet is missing Score or Status columns.");
    }

    let importedCount = 0;

    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      if (!row || !row[0]) {
        continue;
      }

      const questionId = String(row[0]).trim();
      const question = this.dataManager.getQuestionById(questionId);
      if (!question) {
        continue;
      }

      const scoreValue = row[scoreColumnIndex];
      const status = row[statusColumnIndex];

      if (status === "None" || scoreValue === 0) {
        importedScores[questionId] = 0;
        importedCount += 1;
        continue;
      }

      if (typeof scoreValue === "number" && scoreValue > 0) {
        importedScores[questionId] = scoreValue;
        importedCount += 1;
      }
    }

    return { importedCount, importedScores };
  }

  readTemplateWorksheet(worksheet, currentScores) {
    const importedScores = { ...currentScores };
    let importedCount = 0;

    this.dataManager.questions.forEach((question) => {
      const scoreMap = this.dataManager.cellMap[question.id];
      if (!scoreMap) {
        return;
      }

      const importedScore = scoreMap.scoreCols.reduce((total, columnNumber) => {
        const cellAddress = XLSX.utils.encode_cell({
          c: columnNumber - 1,
          r: scoreMap.row - 1,
        });
        return total + (this.isFilledTemplateCell(worksheet[cellAddress]) ? 1 : 0);
      }, 0);

      if (importedScore > 0) {
        importedScores[question.id] = importedScore;
        importedCount += 1;
      }
    });

    return { importedCount, importedScores };
  }

  findWorksheetWithItemIdHeader(workbook) {
    return workbook.SheetNames
      .map((sheetName) => workbook.Sheets[sheetName])
      .find((worksheet) => {
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
        return this.findHeaderIndex(rows) !== -1;
      });
  }

  findHeaderIndex(rows) {
    for (let index = 0; index < Math.min(5, rows.length); index += 1) {
      if (rows[index] && rows[index][0] === "Item ID") {
        return index;
      }
    }

    return -1;
  }

  findColumnIndex(headerRow, columnName) {
    if (!headerRow) {
      return -1;
    }

    return headerRow.findIndex((value) => value === columnName);
  }

  isFilledTemplateCell(cell) {
    return Number.isFinite(cell?.v) && cell.v > 0;
  }
}
