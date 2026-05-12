import { AppConstants } from "../constants.js";
import { AssessmentDataManager } from "./AssessmentDataManager.js";

export class AssessmentCatalogManager {
  constructor(dataManagers) {
    this.dataManagers = dataManagers;
  }

  static async load() {
    const entries = await Promise.all(
      AppConstants.assessments.map(async (assessment) => [
        assessment.id,
        await AssessmentDataManager.load(assessment),
      ])
    );

    return new AssessmentCatalogManager(new Map(entries));
  }

  getAssessments() {
    return AppConstants.assessments;
  }

  getDefaultAssessment() {
    return AppConstants.assessments[0];
  }

  getAssessment(assessmentId) {
    return AppConstants.assessments.find((assessment) => assessment.id === assessmentId)
      ?? this.getDefaultAssessment();
  }

  getDataManager(assessmentId) {
    return this.dataManagers.get(this.getAssessment(assessmentId).id)
      ?? this.dataManagers.get(this.getDefaultAssessment().id);
  }
}
