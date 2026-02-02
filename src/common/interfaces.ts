/**
 * Abstract interface for flashcard services
 * Enables future expansion to Google Classroom, Anki, etc.
 */

import { FlashcardSet, FlashcardPair } from "./types";

export interface IFlashcardService {
  /**
   * Extract flashcard pairs from the current page
   */
  extractCards(): Promise<FlashcardSet>;

  /**
   * Validate if the service is applicable to current URL
   */
  isApplicable(): boolean;

  /**
   * Get service identifier
   */
  getServiceId(): string;
}

export interface IExportTemplate {
  /**
   * Format cards into template-specific structure
   */
  formatCards(cards: FlashcardPair[], title: string): Record<string, unknown>;

  /**
   * Get template metadata
   */
  getMetadata(): {
    type: string;
    templateId: number;
    name: string;
    description: string;
    image?: string;
  };
}

export interface IDataStorage {
  /**
   * Save flashcard data
   */
  saveCards(cards: FlashcardSet): Promise<void>;

  /**
   * Retrieve flashcard data
   */
  getCards(): Promise<FlashcardSet | null>;

  /**
   * Clear stored data
   */
  clearCards(): Promise<void>;
}
