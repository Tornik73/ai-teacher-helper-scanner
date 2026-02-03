/**
 * Background service worker
 * Manages message passing between content script and popup
 * Coordinates data storage and tab communication
 */

import { ExtensionMessage, FlashcardSet } from "../common/types";

interface StoredData {
  cards: FlashcardSet | null;
  tabId: number;
  timestamp: number;
}

// Store extracted cards with tab context
const dataStore: Map<number, StoredData> = new Map();

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("quizlet.com")) {
    // Notify popup that we're on a Quizlet page
    chrome.runtime.sendMessage({ action: "page-ready", tabId }, () => {
      // Ignore errors if no listener
      void chrome.runtime.lastError;
    });
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  dataStore.delete(tabId);
});

// Message handler for popup and content scripts
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep channel open for async responses
  },
);

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) {
  const tabId = sender.tab?.id;

  console.log("[Background] Received message:", message.action, "from tab:", tabId);

  try {
    switch (message.action) {
      case "extract-cards": {
        if (!tabId) {
          sendResponse({ success: false, error: "No tab context" });
          break;
        }

        // Forward to content script
        const response = await chrome.tabs.sendMessage(tabId, {
          action: "extract-cards",
        } as ExtensionMessage);

        if (response.success) {
          // Store extracted cards
          dataStore.set(tabId, {
            cards: response.data,
            tabId,
            timestamp: Date.now(),
          });
        }

        sendResponse(response);
        break;
      }

      case "get-cards": {
        if (!tabId) {
          sendResponse({ success: false, error: "No tab context" });
          break;
        }

        const stored = dataStore.get(tabId);
        if (stored && Date.now() - stored.timestamp < 3600000) {
          // Valid for 1 hour
          sendResponse({ success: true, data: stored.cards as FlashcardSet });
        } else {
          sendResponse({ success: false, error: "No cards found" });
        }
        break;
      }

      case "update-cards": {
        if (!tabId) {
          sendResponse({ success: false, error: "No tab context" });
          break;
        }

        const cards = message.payload as unknown as FlashcardSet;
        dataStore.set(tabId, {
          cards,
          tabId,
          timestamp: Date.now(),
        });

        sendResponse({ success: true });
        break;
      }

      case "get-export-data": {
        const sessionKey = message.payload as string;
        console.log("[Background] get-export-data for key:", sessionKey);
        if (!sessionKey) {
          console.log("[Background] No sessionKey provided");
          sendResponse({ success: false, error: "No sessionKey provided" });
          break;
        }

        try {
          const result = await chrome.storage.local.get(sessionKey);
          const entry = result[sessionKey];
          console.log("[Background] Storage lookup result:", { sessionKey, found: !!entry });
          if (entry && entry.data) {
            console.log("[Background] Found data, returning");
            sendResponse({ success: true, data: entry.data });
          } else {
            console.log("[Background] No data found in storage");
            sendResponse({ success: false, error: "No data found in storage" });
          }
        } catch (error) {
          console.error("[Background] Error retrieving from storage:", error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Storage error",
          });
        }
        break;
      }

      case "store-export-data": {
        const payload = message.payload as unknown as {
          sessionKey: string;
          data: unknown;
          formatted: unknown;
          templateId: number;
        };

        console.log("[Background] store-export-data payload:", {
          sessionKey: payload?.sessionKey,
          hasData: !!payload?.data,
          hasFormatted: !!payload?.formatted,
          templateId: payload?.templateId,
        });

        if (!payload || !payload.sessionKey) {
          console.log("[Background] Invalid payload - missing sessionKey");
          sendResponse({
            success: false,
            error: "No sessionKey in payload",
          });
          break;
        }

        try {
          console.log(
            "[Background] Storing export data with key:",
            payload.sessionKey,
          );
          await chrome.storage.local.set({
            [payload.sessionKey]: {
              data: payload.data,
              formatted: payload.formatted,
              templateId: payload.templateId,
            },
          });
          console.log(
            "[Background] Successfully stored export data with key:",
            payload.sessionKey,
          );
          sendResponse({ success: true });
        } catch (error) {
          console.error("[Background] Failed to store export data:", error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Storage error",
          });
        }
        break;
      }

      case "initialize": {
        sendResponse({ success: true, version: "0.1.0" });
        break;
      }

      default: {
        sendResponse({
          success: false,
          error: `Unknown action: ${message.action}`,
        });
      }
    }
  } catch (error) {
    console.error("Background service worker error:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

console.log("Background service worker initialized");
