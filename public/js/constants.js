export class AppConstants {
  static assessments = [
    {
      id: "ablls-r",
      name: "ABLLS-R",
      paths: {
        questions: "/public/data/questions.json",
        gridMap: "/public/data/grid-map.json",
        workbookTemplate: "/public/templates/ablls-r-template.xlsx",
      },
      exportFilename: "ablls-r-assessment.xlsx",
      workbookTemplate: {
        defaultAssessmentCode: 1,
        dateColumn: "I",
        metadataSheetName: "AssessmentFiller Data",
        runSlotRows: [8, 11, 14, 17, 20, 23, 26, 28],
        worksheetName: "ABLLs",
      },
    },
    {
      id: "socially-savvy",
      name: "Socially Savvy",
      paths: {
        questions: "/public/data/socially-savvy/questions.json",
        gridMap: "/public/data/socially-savvy/grid-map.json",
        workbookTemplate: "/public/templates/socially-savvy-template.xlsx",
      },
      exportFilename: "socially-savvy-assessment.xlsx",
      workbookTemplate: {
        clientNameCell: "F2",
        clientNameStyleCell: "B2",
        dateColumn: "E",
        defaultAssessmentCode: 1,
        metadataSheetName: "AssessmentFiller Data",
        runSlotRows: [5, 6, 7, 8],
        scoreColumn: "S",
        worksheetName: "Socially Savvy Master Form",
      },
    },
  ];

  static accentColors = ["#5b6472", "#727b89", "#8b95a4"];

  static storageKeys = {
    activeAssessment: "ablls_active_assessment_v1",
    activeClient: "ablls_active_client_v1",
    clients: "ablls_clients_v1",
    scores: "ablls_sc2",
    darkTheme: "ablls_dark",
    workflow: "ablls_workflow_v1",
  };

  static paths = {
    jszip: "/public/vendor/jszip.min.js",
  };
}
