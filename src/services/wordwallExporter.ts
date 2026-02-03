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
    console.log("[WordwallExporter] Starting export...");
    const template = WordwallTemplateFactory.getTemplate(templateType);
    const metadata = template.getMetadata();
    const formattedData = template.formatCards(cards, title);

    const exportData: ExportData = {
      title,
      template: templateType,
      cards,
      timestamp: Date.now(),
    };

    const sessionKey = `wordwall_export_${Date.now()}`;
    console.log("[WordwallExporter] Generated sessionKey:", sessionKey);

    try {
      // Request background worker to store the data
      // This ensures storage completes before popup closes
      console.log("[WordwallExporter] Sending store-export-data message...");
      const response = await chrome.runtime.sendMessage({
        action: "store-export-data",
        payload: {
          sessionKey,
          data: exportData,
          formatted: formattedData,
          templateId: metadata.templateId,
        },
      });

      console.log("[WordwallExporter] Storage response:", response);

      if (!response.success) {
        throw new Error(response.error || "Failed to store export data");
      }
      console.log("[WordwallExporter] Data stored successfully");
    } catch (error) {
      console.error("[WordwallExporter] Failed to store in chrome.storage.local:", error);
      // Fallback to localStorage
      try {
        console.log("[WordwallExporter] Falling back to localStorage...");
        localStorage.setItem(sessionKey, JSON.stringify(exportData));
        console.log("[WordwallExporter] Stored in localStorage");
      } catch (e) {
        console.error("[WordwallExporter] Failed to store in localStorage:", e);
      }
    }

    // Open Wordwall create page
    const wordwallUrl = this.buildWordwallUrl(metadata.templateId, sessionKey);
    console.log("[WordwallExporter] Opening Wordwall URL:", wordwallUrl);
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
