/**
 * Quizlet flashcard service implementation
 * Extracts word/translation pairs from Quizlet flashcard sets
 */

import { FlashcardSet, FlashcardPair } from "../common/types";
import { IFlashcardService } from "../common/interfaces";

export class QuizletService implements IFlashcardService {
  isApplicable(): boolean {
    return window.location.hostname === "quizlet.com";
  }

  getServiceId(): string {
    return "quizlet";
  }

  async extractCards(): Promise<FlashcardSet> {
    const title = this.extractTitle();
    const cards = this.extractCardPairs();

    return {
      title,
      source: "quizlet",
      cards,
    };
  }

  private extractTitle(): string {
    // Try to find title from page header
    const headerElement = document.querySelector(
      '[data-test="set-header"] h1, .SetPageHeaderCard h1, [class*="setTitle"], .StudySet__title',
    );
    return headerElement?.textContent?.trim() || "Untitled Set";
  }

  private extractCardPairs(): FlashcardPair[] {
    const pairs: FlashcardPair[] = [];
    let idCounter = 0;

    console.log("[QuizletService] Starting card extraction...");

    // Strategy 1: Target the exact Quizlet structure with SetPageTermsList-term
    const termContainers = document.querySelectorAll(
      "div[class*='SetPageTermsList-term']",
    );

    console.log(
      `[QuizletService] Found ${termContainers.length} term containers`,
    );

    if (termContainers.length > 0) {
      termContainers.forEach((container) => {
        // Find all TermText spans in this container
        const termTexts = container.querySelectorAll("span.TermText");

        if (termTexts.length >= 2) {
          const term = this.extractText(termTexts[0]);
          const definition = this.extractText(termTexts[1]);

          if (term && definition) {
            pairs.push({
              id: String(idCounter++),
              term,
              definition,
            });
            console.log(
              `[QuizletService] Extracted: "${term}" → "${definition}"`,
            );
          }
        }
      });
    }

    // Strategy 2: Fallback to role="option" for other Quizlet layouts
    if (pairs.length === 0) {
      console.log(
        "[QuizletService] No SetPageTermsList-term found, trying role='option'",
      );

      const optionElements = document.querySelectorAll('div[role="option"]');

      optionElements.forEach((container) => {
        const termTexts = container.querySelectorAll("span.TermText");

        if (termTexts.length >= 2) {
          const term = this.extractText(termTexts[0]);
          const definition = this.extractText(termTexts[1]);

          if (term && definition) {
            pairs.push({
              id: String(idCounter++),
              term,
              definition,
            });
          }
        }
      });
    }

    // Strategy 3: Generic extraction as last resort
    if (pairs.length === 0) {
      console.log("[QuizletService] Trying generic extraction...");

      const allContainers = document.querySelectorAll(
        "div[class*='term'], li[class*='card']",
      );
      allContainers.forEach((container) => {
        const texts = Array.from(container.querySelectorAll("span, div, p"))
          .map((el) => this.extractText(el))
          .filter((text) => text.length > 0 && text.length < 300);

        const uniqueTexts = Array.from(new Set(texts));
        if (uniqueTexts.length >= 2) {
          pairs.push({
            id: String(idCounter++),
            term: uniqueTexts[0],
            definition: uniqueTexts[uniqueTexts.length - 1],
          });
        }
      });
    }

    console.log(`[QuizletService] Extracted total: ${pairs.length} card pairs`);
    return pairs;
  }

  private extractFromCardElement(element: Element): FlashcardPair | null {
    // Try to find term and definition within card element
    const termSelector = '[class*="term"], [data-test*="term"], .flashcardTerm';
    const defSelector =
      '[class*="definition"], [data-test*="definition"], .flashcardDefinition';

    const termElement = element.querySelector(termSelector) || element;
    const defElement = element.querySelector(defSelector);

    if (!defElement) {
      return null;
    }

    const term = this.extractText(termElement);
    const definition = this.extractText(defElement);

    if (term && definition) {
      return { id: "", term, definition };
    }

    return null;
  }

  private extractText(element: Element): string {
    // Get text content and clean it
    const text = element.textContent?.trim() || "";
    // Remove extra whitespace and normalize
    return text.replace(/\s+/g, " ").trim();
  }
}
