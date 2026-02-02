/**
 * Core types and interfaces for the Quizlet to Wordwall extension
 * Designed for extensibility to support multiple flashcard services and export templates
 */

export interface FlashcardPair {
  id: string;
  term: string;
  definition: string;
}

export interface FlashcardSet {
  title: string;
  source: "quizlet" | "other";
  cards: FlashcardPair[];
}

export type WordwallTemplateType = "quiz" | "find-match" | "match-up";

export interface WordwallTemplateConfig {
  type: WordwallTemplateType;
  templateId: number;
  name: string;
  description: string;
}

export interface ExportData {
  title: string;
  template: WordwallTemplateType;
  cards: FlashcardPair[];
  timestamp: number;
}

export interface MessagePayload {
  type: string;
  data?: unknown;
  error?: string;
}

export interface ExtensionMessage {
  action:
    | "extract-cards"
    | "export-wordwall"
    | "get-cards"
    | "update-cards"
    | "initialize";
  payload?: Record<string, unknown>;
}
