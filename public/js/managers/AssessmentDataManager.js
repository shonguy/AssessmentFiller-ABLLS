export class AssessmentDataManager {
  constructor(assessment, questions, cellMap) {
    this.assessment = assessment;
    this.questions = questions;
    this.cellMap = cellMap;
    this.sectionNames = this.buildSectionNames();
    this.sections = Object.keys(this.sectionNames);
  }

  static async load(assessment) {
    const [questionsResponse, gridMapResponse] = await Promise.all([
      fetch(assessment.paths.questions),
      fetch(assessment.paths.gridMap),
    ]);

    if (!questionsResponse.ok || !gridMapResponse.ok) {
      throw new Error("Unable to load assessment data.");
    }

    const [questions, cellMap] = await Promise.all([
      questionsResponse.json(),
      gridMapResponse.json(),
    ]);

    return new AssessmentDataManager(assessment, questions, cellMap);
  }

  buildSectionNames() {
    return this.questions.reduce((sectionNames, question) => {
      sectionNames[question.s] = question.sn;
      return sectionNames;
    }, {});
  }

  getDefaultScores() {
    return this.questions.reduce((scores, question) => {
      if (question.c > 0) {
        scores[question.id] = question.c;
      }
      return scores;
    }, {});
  }

  getSections() {
    return this.sections;
  }

  getSectionName(section) {
    return this.sectionNames[section] ?? "";
  }

  getFilteredQuestions(activeSection) {
    if (!activeSection) {
      return this.questions;
    }

    return this.questions.filter((question) => question.s === activeSection);
  }

  getQuestionsForSection(section) {
    return this.questions.filter((question) => question.s === section);
  }

  getQuestionById(questionId) {
    return this.questions.find((question) => question.id === questionId);
  }

  getAnsweredCount(scores) {
    return Object.keys(scores).length;
  }

  getSectionStats(section, scores) {
    const sectionQuestions = this.getQuestionsForSection(section);
    const answered = sectionQuestions.filter((question) => scores[question.id] !== undefined).length;
    const scored = sectionQuestions.filter((question) => scores[question.id] > 0).length;
    const maxPoints = sectionQuestions.reduce((total, question) => total + question.t.length, 0);
    const points = sectionQuestions.reduce((total, question) => total + (scores[question.id] > 0 ? scores[question.id] : 0), 0);
    const percentOfMax = maxPoints ? Math.round((points / maxPoints) * 100) : 0;

    return {
      section,
      sectionName: this.getSectionName(section),
      questions: sectionQuestions,
      answered,
      scored,
      points,
      maxPoints,
      percentOfMax,
    };
  }

  buildSummary(scores) {
    return this.sections.map((section) => this.getSectionStats(section, scores));
  }
}
