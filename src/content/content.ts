/**
 * Content script for Quizlet pages
 * Runs on quizlet.com and communicates with background service worker
 */

import { QuizletService } from "../services/quizletService";
import { ExtensionMessage } from "../common/types";

const quizletService = new QuizletService();

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // Keep channel open for async responses
  },
);

async function handleMessage(
  message: ExtensionMessage,
  sendResponse: (response?: unknown) => void,
) {
  try {
    console.log("[Content Script] Received message:", message.action);

    switch (message.action) {
      case "extract-cards":
        if (quizletService.isApplicable()) {
          console.log("[Content Script] Extracting cards...");
          const cards = await quizletService.extractCards();
          console.log("[Content Script] Extracted cards:", cards);
          sendResponse({ success: true, data: cards });
        } else {
          console.log("[Content Script] Not on Quizlet page");
          sendResponse({ success: false, error: "Not on Quizlet page" });
        }
        break;

      case "initialize":
        console.log("[Content Script] Initializing...");
        sendResponse({ success: true, service: quizletService.getServiceId() });
        break;

      default:
        console.log("[Content Script] Unknown action:", message.action);
        sendResponse({
          success: false,
          error: `Unknown action: ${message.action}`,
        });
    }
  } catch (error) {
    console.error("[Content Script] Error:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

console.log("Quizlet to Wordwall extension content script loaded");
