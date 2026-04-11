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
          const workbook = XLSX.read(event.target.result, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const importedScores = { ...currentScores };
          const headerIndex = this.findHeaderIndex(rows);

          if (headerIndex === -1) {
            throw new Error("Could not find header row. Make sure the first column header is Item ID.");
          }

          let importedCount = 0;
          for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex];
            if (!row || !row[0]) {
              continue;
            }

            const questionId = String(row[0]).trim();
            const scoreValue = row[4];
            const status = row[6];
            const question = this.dataManager.getQuestionById(questionId);
            if (!question) {
              continue;
            }

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

  findHeaderIndex(rows) {
    for (let index = 0; index < Math.min(5, rows.length); index += 1) {
      if (rows[index] && rows[index][0] === "Item ID") {
        return index;
      }
    }

    return -1;
  }
}
