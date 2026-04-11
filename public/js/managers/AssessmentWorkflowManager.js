export class AssessmentWorkflowManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  getQuestionQueue(activeSection, questionFilter, scores) {
    const questions = this.dataManager.getFilteredQuestions(activeSection);
    if (questionFilter !== "unanswered") {
      return questions;
    }

    return questions.filter((question) => scores[question.id] === undefined);
  }

  getFirstUnansweredTarget(scores, section = null) {
    const questions = this.dataManager.getFilteredQuestions(section);
    const target = questions.find((question) => scores[question.id] === undefined);
    return target ? this.buildTarget(target) : null;
  }

  getResumeTarget(lastQuestionId, fallbackSection, scores) {
    if (lastQuestionId) {
      const question = this.dataManager.getQuestionById(lastQuestionId);
      if (question) {
        return this.buildTarget(question);
      }
    }

    return this.getFirstUnansweredTarget(scores, fallbackSection)
      ?? this.getFirstQuestionTarget(fallbackSection);
  }

  getFirstQuestionTarget(section = null) {
    const firstQuestion = this.dataManager.getFilteredQuestions(section)[0];
    return firstQuestion ? this.buildTarget(firstQuestion) : null;
  }

  getNextSectionTarget(currentSection, scores) {
    const currentIndex = this.dataManager.sections.indexOf(currentSection);
    if (currentIndex === -1) {
      return null;
    }

    const nextSection = this.dataManager.sections
      .slice(currentIndex + 1)
      .find((section) => !this.isSectionComplete(section, scores));

    if (!nextSection) {
      return null;
    }

    return this.getFirstUnansweredTarget(scores, nextSection)
      ?? this.getFirstQuestionTarget(nextSection);
  }

  buildSectionQueues(scores) {
    const sections = this.dataManager.buildSummary(scores);

    return {
      needsReview: sections.filter((section) => section.answered > 0 && section.answered < section.questions.length),
      unfinished: sections.filter((section) => section.answered === 0),
      completed: sections.filter((section) => section.answered === section.questions.length),
    };
  }

  buildCheckpoint(section, scores) {
    if (!section) {
      return null;
    }

    const summary = this.dataManager.getSectionStats(section, scores);
    const nextTarget = this.getNextSectionTarget(section, scores);
    const unansweredTarget = this.getFirstUnansweredTarget(scores, section);

    return {
      ...summary,
      isComplete: summary.answered === summary.questions.length,
      nextTarget,
      unansweredTarget,
    };
  }

  isAssessmentComplete(scores) {
    return this.dataManager.getAnsweredCount(scores) === this.dataManager.questions.length;
  }

  isSectionComplete(section, scores) {
    const summary = this.dataManager.getSectionStats(section, scores);
    return summary.answered === summary.questions.length;
  }

  buildTarget(question) {
    return {
      questionId: question.id,
      section: question.s,
    };
  }
}
