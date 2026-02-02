/**
 * Content script for Wordwall create page
 * Reads sessionKey from URL, retrieves export data from chrome.storage.local
 * and tries to populate the Wordwall editor fields.
 */

import { ExportData } from "../common/types";

function debug(...args: unknown[]) {
  // Prefix logs for easier debugging
  // eslint-disable-next-line no-console
  console.log("[Wordwall Content]", ...args);
}

function getSessionKeyFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("sessionKey");
    return key;
  } catch (e) {
    return null;
  }
}

async function getExportData(sessionKey: string): Promise<ExportData | null> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(sessionKey, (result) => {
        if (chrome.runtime.lastError) {
          debug("chrome.storage error:", chrome.runtime.lastError.message);
        }
        const entry = result[sessionKey];
        if (entry && entry.data) {
          resolve(entry.data as ExportData);
        } else {
          // Fallback to localStorage
          try {
            const stored = localStorage.getItem(sessionKey);
            if (stored) {
              resolve(JSON.parse(stored) as ExportData);
              return;
            }
          } catch (e) {
            /* ignore */
          }
          resolve(null);
        }
      });
    } catch (e) {
      // runtime may not be available in certain contexts
      debug("Error reading storage", e);
      resolve(null);
    }
  });
}

function dispatchInput(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLElement,
) {
  try {
    if ((element as HTMLInputElement).value !== undefined) {
      const el = element as HTMLInputElement;
      el.focus();
      el.value = (el as HTMLInputElement).value; // no-op to ensure property present
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      // contenteditable
      const el = element as HTMLElement;
      el.focus();
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } catch (e) {
    // ignore
  }
}

function trySetTitle(title: string) {
  // Try several selectors commonly used
  const selectors = [
    'input[name="title"]',
    'input[placeholder*="Activity Title"]',
    'input[aria-label*="Activity Title"]',
    ".activity-title input",
    ".wc-title input",
    ".CreateTitle input",
    'input[type="text"]',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel) as HTMLInputElement | null;
    if (el) {
      el.value = title;
      dispatchInput(el);
      debug("Set title using", sel);
      return true;
    }
  }

  // Try to find label containing text "Activity Title" then the associated input
  const labels = Array.from(document.querySelectorAll("label")).filter((l) =>
    l.textContent?.toLowerCase().includes("activity title"),
  );
  for (const label of labels) {
    const forAttr = (label as HTMLLabelElement).htmlFor;
    if (forAttr) {
      const el = document.getElementById(forAttr) as HTMLInputElement | null;
      if (el) {
        el.value = title;
        dispatchInput(el);
        debug("Set title using label->for");
        return true;
      }
    }
    const input = label.querySelector("input") as HTMLInputElement | null;
    if (input) {
      input.value = title;
      dispatchInput(input);
      debug("Set title inside label");
      return true;
    }
  }

  debug("Title field not found");
  return false;
}

async function tryPopulateQuiz(cards: { term: string; definition: string }[]) {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  try {
    // Helper to get all quiz item containers in order
    const getQuizItems = () =>
      Array.from(document.querySelectorAll(".quiz-item")) as HTMLElement[];

    // Helper to click add-answer button inside a given quiz item
    const clickAddAnswer = (quizItem: HTMLElement) => {
      const add = quizItem.querySelector(
        ".js-editor-add-answer",
      ) as HTMLElement | null;
      if (add) {
        add.click();
        return true;
      }
      // Fallback: global add-more
      const globalAdd = document.querySelector(
        ".js-editor-add-answer",
      ) as HTMLElement | null;
      if (globalAdd) {
        globalAdd.click();
        return true;
      }
      return false;
    };

    // Helper to click Add a question button
    const clickAddQuestion = () => {
      const btn = document.querySelector(
        ".js-editor-add-item",
      ) as HTMLElement | null;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    };

    // Shuffle helpers
    const shuffle = <T>(arr: T[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    for (let qi = 0; qi < cards.length; qi++) {
      // For subsequent cards, click Add a question first
      if (qi > 0) {
        const added = clickAddQuestion();
        debug("Click Add a question ->", added);
        await sleep(300);
      }

      // Re-query quiz items and pick the current one
      const quizItems = getQuizItems();
      const current = quizItems[qi];
      if (!current) {
        debug("No quiz item found for index", qi);
        continue;
      }

      // Set question text
      const qInput = current.querySelector(
        ".item-input.js-item-input.selectable",
      ) as HTMLElement | null;
      if (qInput) {
        qInput.textContent = cards[qi].term;
        dispatchInput(qInput);
      }

      // Build answers: correct + 3 random distractors from ALL definitions
      const allDefinitions = cards.map((c) => c.definition);
      const otherDefinitions = allDefinitions.filter((_, idx) => idx !== qi);
      
      // Randomly select 3 distractors from all other definitions
      const selectedDistracts: string[] = [];
      const availableIndices = otherDefinitions.map((_, i) => i);
      
      for (let d = 0; d < Math.min(3, otherDefinitions.length); d++) {
        const randIdx = Math.floor(Math.random() * availableIndices.length);
        const chosenIndex = availableIndices[randIdx];
        selectedDistracts.push(otherDefinitions[chosenIndex]);
        // Remove from available to avoid duplicates
        availableIndices.splice(randIdx, 1);
      }

      const answers = shuffle([
        cards[qi].definition,
        ...selectedDistracts,
      ]);

      // Ensure there are at least 4 answer boxes
      let answerBoxes = Array.from(
        current.querySelectorAll(".answer-box"),
      ) as HTMLElement[];
      while (answerBoxes.length < 4) {
        const clicked = clickAddAnswer(current);
        debug("Clicked add answer:", clicked);
        await sleep(200);
        answerBoxes = Array.from(
          current.querySelectorAll(".answer-box"),
        ) as HTMLElement[];
        // safety break
        if (!clicked) break;
      }

      // Fill answers
      for (let ai = 0; ai < 4; ai++) {
        const box = answerBoxes[ai];
        if (!box) continue;
        const input = box.querySelector(
          ".item-input.js-item-input",
        ) as HTMLElement | null;
        if (input) {
          input.textContent = answers[ai] || "";
          dispatchInput(input);
          await sleep(80);
        }
        // Mark correct if this answer equals the correct definition
        if (answers[ai] === cards[qi].definition) {
          const check = box.querySelector(
            ".js-question-check, .question-check",
          ) as HTMLElement | null;
          if (check) {
            // click the unchecked element if present
            const unchecked = check.querySelector(
              ".question-check-unchecked",
            ) as HTMLElement | null;
            if (unchecked) {
              unchecked.click();
            } else {
              // fallback click overall
              check.click();
            }
            await sleep(60);
          }
        }
      }

      // small wait before next question
      await sleep(200);
    }

    // After populating all, click Done is user's choice. Return true
    debug("Finished populating", cards.length, "questions");
    return true;
  } catch (e) {
    debug("Error populating quiz:", e);
    return false;
  }
}

async function tryPopulateMatchingPair(cards: { term: string; definition: string }[]) {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  try {
    // Get all items (rows) in the matching editor
    const getMatchItems = () =>
      Array.from(
        document.querySelectorAll(
          ".item.js-item.item-collection .item.js-item.no-select",
        ),
      ) as HTMLElement[];

    // Helper to click "Add an item" button
    const clickAddItem = () => {
      const btn = document.querySelector(
        ".editor-add-item.js-editor-add-item",
      ) as HTMLElement | null;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    };

    for (let i = 0; i < cards.length; i++) {
      // For subsequent items, click Add an item first
      if (i > 0) {
        const added = clickAddItem();
        debug("Click Add an item ->", added);
        await sleep(300);
      }

      // Re-query items
      const items = getMatchItems();
      const currentItem = items[i];
      if (!currentItem) {
        debug("No match item found for index", i);
        continue;
      }

      // Find the two input divs: left (keyword) and right (definition)
      const doubleInners = Array.from(
        currentItem.querySelectorAll(".item.js-item.double-inner"),
      ) as HTMLElement[];

      if (doubleInners.length < 2) {
        debug("Could not find both keyword and definition fields for item", i);
        continue;
      }

      // Set keyword (left side)
      const keywordInput = doubleInners[0].querySelector(
        ".item-input.js-item-input.selectable",
      ) as HTMLElement | null;
      if (keywordInput) {
        keywordInput.textContent = cards[i].term;
        dispatchInput(keywordInput);
        await sleep(80);
      }

      // Set definition (right side)
      const definitionInput = doubleInners[1].querySelector(
        ".item-input.js-item-input.selectable",
      ) as HTMLElement | null;
      if (definitionInput) {
        definitionInput.textContent = cards[i].definition;
        dispatchInput(definitionInput);
        await sleep(80);
      }

      await sleep(200);
    }

    debug("Finished populating", cards.length, "matching pairs");
    return true;
  } catch (e) {
    debug("Error populating matching pairs:", e);
    return false;
  }
}

async function run() {
  const sessionKey = getSessionKeyFromUrl();
  if (!sessionKey) {
    debug("No sessionKey in URL");
    return;
  }

  debug("Found sessionKey:", sessionKey);

  const data = await getExportData(sessionKey);
  if (!data) {
    debug("No export data found for", sessionKey);
    return;
  }

  debug("Export data loaded:", data);

  // Store in sessionStorage in case Wordwall reads it later
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify(data));
  } catch (e) {
    // ignore
  }

  // Try to set title
  trySetTitle(data.title || "Untitled");

  // Prepare cards
  const cards = data.cards.map((c: any) => ({
    term: c.term,
    definition: c.definition,
  }));

  // Detect template type and populate accordingly
  let populated = false;

  // Try Quiz template first
  if (document.querySelector(".quiz-item")) {
    debug("Detected Quiz template");
    populated = await tryPopulateQuiz(cards);
  }
  // Try matching/pair template
  else if (document.querySelector(".item.js-item.item-collection")) {
    debug("Detected Matching/Pair template");
    populated = await tryPopulateMatchingPair(cards);
  }

  if (populated) {
    debug("Populate attempt finished");
  } else {
    debug("Populate attempt failed: manual paste may be required");
  }
}

// Run when document ready
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(run, 500);
} else {
  window.addEventListener("DOMContentLoaded", () => setTimeout(run, 500));
}
