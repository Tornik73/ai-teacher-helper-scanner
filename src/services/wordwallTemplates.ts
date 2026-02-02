/**
 * Wordwall export templates
 * Format flashcard data for different Wordwall template types
 */

import { FlashcardPair, WordwallTemplateType } from "../common/types";
import { IExportTemplate } from "../common/interfaces";

interface QuizAnswer {
  text: string;
  correct: boolean;
}

interface QuizQuestion {
  text: string;
  answers: QuizAnswer[];
}

interface MatchingPair {
  keyword: string;
  definition: string;
}

/**
 * Quiz template (templateId: 5)
 * Structure: title, questions with multiple choice answers
 */
export class QuizTemplate implements IExportTemplate {
  getMetadata() {
    return {
      type: "quiz",
      templateId: 5,
      name: "Quiz",
      description: "Multiple choice quiz with one correct answer",
      image: "images/quiz.png",
    };
  }

  formatCards(cards: FlashcardPair[], title: string): Record<string, unknown> {
    const questions: QuizQuestion[] = cards.map((card, index) => {
      // Get other cards for distractor answers
      const otherCards = cards.filter((_, i) => i !== index).slice(0, 3);

      const answers: QuizAnswer[] = [
        { text: card.definition, correct: true },
        ...otherCards.map((c) => ({ text: c.definition, correct: false })),
      ];

      // Shuffle answers
      answers.sort(() => Math.random() - 0.5);

      return {
        text: card.term,
        answers,
      };
    });

    return {
      title,
      questions,
    };
  }
}

/**
 * Find the Match template (templateId: 46)
 * Structure: title, items with keywords and matching definitions
 */
export class FindMatchTemplate implements IExportTemplate {
  getMetadata() {
    return {
      type: "find-match",
      templateId: 46,
      name: "Find the Match",
      description: "Find matching pairs of keywords and definitions",
      image: "images/find-match.png",
    };
  }

  formatCards(cards: FlashcardPair[], title: string): Record<string, unknown> {
    const items: MatchingPair[] = cards.map((card) => ({
      keyword: card.term,
      definition: card.definition,
    }));

    return {
      title,
      items,
    };
  }
}

/**
 * Match Up template (templateId: 3)
 * Structure: title, left column (keywords) and right column (definitions)
 * Definitions are shown in random order for matching
 */
export class MatchUpTemplate implements IExportTemplate {
  getMetadata() {
    return {
      type: "match-up",
      templateId: 3,
      name: "Match Up",
      description: "Match keywords with their definitions",
      image: "images/match-up.png",
    };
  }

  formatCards(cards: FlashcardPair[], title: string): Record<string, unknown> {
    // Create left column (keywords) and right column (shuffled definitions)
    const left = cards.map((card) => card.term);
    const right = cards.map((card) => card.definition);

    // Shuffle right column while preserving order mapping
    const rightWithIndex = right.map((def, index) => ({
      def,
      originalIndex: index,
    }));
    rightWithIndex.sort(() => Math.random() - 0.5);

    const shuffledRight = rightWithIndex.map((item) => item.def);
    const indexMapping = rightWithIndex.map((item) => item.originalIndex);

    return {
      title,
      left,
      right: shuffledRight,
      indexMapping, // For potential client-side validation
    };
  }
}

/**
 * Template registry and factory
 */
export class WordwallTemplateFactory {
  private static templates: Map<WordwallTemplateType, IExportTemplate> =
    new Map([
      ["quiz", new QuizTemplate()],
      ["find-match", new FindMatchTemplate()],
      ["match-up", new MatchUpTemplate()],
    ]);

  static getTemplate(type: WordwallTemplateType): IExportTemplate {
    const template = this.templates.get(type);
    if (!template) {
      throw new Error(`Unknown template type: ${type}`);
    }
    return template;
  }

  static getAllTemplates() {
    return Array.from(this.templates.values()).map((t) => t.getMetadata());
  }
}
