export class AppConstants {
  static assessments = [
    {
      id: "ablls-r",
      name: "ABLLS-R",
    },
  ];

  static accentColors = ["#5b6472", "#727b89", "#8b95a4"];

  static storageKeys = {
    scores: "ablls_sc2",
    darkTheme: "ablls_dark",
    workflow: "ablls_workflow_v1",
  };

  static paths = {
    questions: "/public/data/questions.json",
    gridMap: "/public/data/grid-map.json",
    jszip: "/public/vendor/jszip.min.js",
    workbookTemplate: "/public/templates/ablls-r-template.xlsx",
  };

  static workbookTemplate = {
    defaultAssessmentCode: 1,
    metadataSheetName: "AssessmentFiller Data",
    runSlotCount: 6,
    runSlotStartRow: 8,
    runSlotRowStep: 3,
    worksheetName: "ABLLs",
  };
}
