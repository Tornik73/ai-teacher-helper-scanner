/**
 * Wordwall export and integration module
 * Handles opening Wordwall and injecting data
 */

import {
  FlashcardPair,
  WordwallTemplateType,
  ExportData,
} from "../common/types";
import { WordwallTemplateFactory } from "./wordwallTemplates";

interface WordwallCreatePageData {
  title: string;
  templateId: number;
  data: Record<string, unknown>;
}

export class WordwallExporter {
  /**
   * Open Wordwall create page with injected data
   */
  static async exportToWordwall(
    cards: FlashcardPair[],
    title: string,
    templateType: WordwallTemplateType,
  ): Promise<void> {
    const template = WordwallTemplateFactory.getTemplate(templateType);
    const metadata = template.getMetadata();
    const formattedData = template.formatCards(cards, title);

    const exportData: ExportData = {
      title,
      template: templateType,
      cards,
      timestamp: Date.now(),
    };

    // Store data in local storage for the new tab to read
    const sessionKey = `wordwall_export_${Date.now()}`;
    try {
      // Use chrome.storage.local as persistence layer
      await chrome.storage.local.set({
        [sessionKey]: {
          data: exportData,
          formatted: formattedData,
          templateId: metadata.templateId,
        },
      });
    } catch {
      // Fallback to localStorage
      localStorage.setItem(sessionKey, JSON.stringify(exportData));
    }

    // Open Wordwall create page
    const wordwallUrl = this.buildWordwallUrl(metadata.templateId, sessionKey);
    chrome.tabs.create({ url: wordwallUrl });
  }

  /**
   * Build Wordwall URL with template ID
   */
  private static buildWordwallUrl(
    templateId: number,
    sessionKey: string,
  ): string {
    const baseUrl = "https://wordwall.net/create/entercontent";
    const params = new URLSearchParams({
      templateId: String(templateId),
      folderId: "0",
      sessionKey, // Pass session key for data retrieval
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Retrieve export data from storage
   */
  static async getExportData(sessionKey: string): Promise<ExportData | null> {
    try {
      const result = await chrome.storage.local.get(sessionKey);
      return result[sessionKey]?.data || null;
    } catch {
      // Fallback to localStorage
      const stored = localStorage.getItem(sessionKey);
      return stored ? JSON.parse(stored) : null;
    }
  }
}
