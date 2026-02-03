/**
 * Popup React component
 * Main UI for the extension showing extracted cards and export options
 */

import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import Select from "react-select";
import {
  FlashcardSet,
  FlashcardPair,
  ExtensionMessage,
  WordwallTemplateType,
} from "../common/types";
import { WordwallTemplateFactory } from "../services/wordwallTemplates";
import { WordwallExporter } from "../services/wordwallExporter";

interface PopupState {
  cards: FlashcardPair[];
  title: string;
  loading: boolean;
  error: string | null;
  success: string | null;
  selectedTemplate: WordwallTemplateType;
  exporting: boolean;
  reversedCardIds: Set<string>;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    cards: [],
    title: "Untitled Set",
    loading: true,
    error: null,
    success: null,
    selectedTemplate: "quiz",
    exporting: false,
    reversedCardIds: new Set(),
  });

  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");

  const templates = WordwallTemplateFactory.getAllTemplates();

  // Extract cards from Quizlet on component mount
  useEffect(() => {
    extractCards();
  }, []);

  const extractCards = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Get the active tab
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tabs || tabs.length === 0) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "No active tab found",
        }));
        return;
      }

      const activeTab = tabs[0];
      if (!activeTab.id) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Tab has no ID",
        }));
        return;
      }

      // Send message directly to content script on the active tab
      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: "extract-cards",
      } as ExtensionMessage);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          cards: response.data.cards,
          title: response.data.title,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: response.error || "Failed to extract cards",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract cards. Make sure you are on a Quizlet page.",
      }));
    }
  }, []);

  const handleRemoveCard = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index),
    }));
  }, []);

  const handleEditCard = useCallback(
    (index: number, term: string, definition: string) => {
      setState((prev) => ({
        ...prev,
        cards: prev.cards.map((card, i) =>
          i === index ? { ...card, term, definition } : card,
        ),
      }));
    },
    [],
  );

  const handleAddCard = useCallback(() => {
    if (newTerm.trim() && newDefinition.trim()) {
      setState((prev) => ({
        ...prev,
        cards: [
          ...prev.cards,
          {
            id: String(prev.cards.length),
            term: newTerm.trim(),
            definition: newDefinition.trim(),
          },
        ],
      }));
      setNewTerm("");
      setNewDefinition("");
    }
  }, [newTerm, newDefinition]);

  const handleExport = useCallback(async () => {
    if (state.cards.length === 0) {
      setState((prev) => ({ ...prev, error: "No cards to export" }));
      return;
    }

    setState((prev) => ({ ...prev, exporting: true, error: null }));

    try {
      console.log("[Popup] Starting export...");
      // Apply reverse mode to individual cards
      const cardsToExport = state.cards.map((card) => {
        if (state.reversedCardIds.has(card.id)) {
          return {
            ...card,
            term: card.definition,
            definition: card.term,
          };
        }
        return card;
      });

      console.log("[Popup] Cards to export:", cardsToExport);

      // Save cards to background storage
      console.log("[Popup] Updating background storage...");
      await chrome.runtime.sendMessage({
        action: "update-cards",
        payload: {
          title: state.title,
          source: "quizlet",
          cards: cardsToExport,
        },
      } as ExtensionMessage);
      console.log("[Popup] Background storage updated");

      // Export to Wordwall
      console.log("[Popup] Calling WordwallExporter.exportToWordwall...");
      await WordwallExporter.exportToWordwall(
        cardsToExport,
        state.title,
        state.selectedTemplate,
      );
      console.log("[Popup] WordwallExporter completed");

      setState((prev) => ({
        ...prev,
        exporting: false,
        success: `Exported ${cardsToExport.length} cards to Wordwall`,
      }));

      // Clear success message after 2 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, success: null }));
      }, 2000);
    } catch (error) {
      console.error("[Popup] Export error:", error);
      setState((prev) => ({
        ...prev,
        exporting: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to export to Wordwall",
      }));
    }
  }, [state]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setState((prev) => ({ ...prev, title: newTitle }));
  }, []);

  if (state.loading) {
    return (
      <div className="container">
        <div className="loading">
          <span className="spinner"></span>
          Loading cards...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>📚 Wordwall Exporter</h1>
        <p>Export Quizlet flashcards to Wordwall templates</p>
      </div>

      {state.error && <div className="error">{state.error}</div>}
      {state.success && <div className="success">{state.success}</div>}

      {state.cards.length > 0 ? (
        <>
          <div className="section">
            <div className="section-title">
              <span>📝 Set Title</span>
            </div>
            <input
              type="text"
              className="input-field"
              value={state.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter set title"
            />
          </div>

          <div className="section">
            <div className="section-title">
              <span>🎯 Detected Cards</span>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span className="word-count">{state.cards.length} words</span>
                <button
                  className="btn-small"
                  onClick={() => {
                    setState((prev) => {
                      const allReversed =
                        prev.reversedCardIds.size === prev.cards.length;
                      if (allReversed) {
                        return { ...prev, reversedCardIds: new Set() };
                      }
                      const newSet = new Set(prev.cards.map((card) => card.id));
                      return { ...prev, reversedCardIds: newSet };
                    });
                  }}
                  title={
                    state.reversedCardIds.size === state.cards.length
                      ? "Unreverse all word ↔ translation"
                      : "Reverse all word ↔ translation (swap term and definition for every card)"
                  }
                  style={{
                    fontSize: "12px",
                    padding: "6px 10px",
                    backgroundColor:
                      state.reversedCardIds.size === state.cards.length
                        ? "#FF9800"
                        : "#e3f2fd",
                    color:
                      state.reversedCardIds.size === state.cards.length
                        ? "white"
                        : "#1565c0",
                    border: "1px solid #90caf9",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {state.reversedCardIds.size === state.cards.length
                    ? "↩️ Unreverse All"
                    : "🔄 Reverse All (word ↔ translation)"}
                </button>
              </div>
            </div>
            <div className="card-list">
              {state.cards.map((card, index) => (
                <CardItem
                  key={card.id}
                  card={card}
                  index={index}
                  isReversed={state.reversedCardIds.has(card.id)}
                  onRemove={() => handleRemoveCard(index)}
                  onEdit={(term, definition) =>
                    handleEditCard(index, term, definition)
                  }
                />
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-title">➕ Add Card</div>
            <div className="add-card-section">
              <input
                type="text"
                placeholder="Term"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCard()}
              />
              <input
                type="text"
                placeholder="Definition"
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCard()}
              />
              <button onClick={handleAddCard}>Add</button>
            </div>
          </div>

          <div className="section">
            <div className="section-title">🎨 Template Selection</div>
            <Select<{
              value: WordwallTemplateType;
              label: string;
              image?: string;
            }>
              options={templates.map((template) => ({
                value: template.type as WordwallTemplateType,
                label: `${template.name} - ${template.description}`,
                image: template.image,
              }))}
              value={
                templates.find((t) => t.type === state.selectedTemplate)
                  ? {
                      value: state.selectedTemplate,
                      label: `${
                        templates.find((t) => t.type === state.selectedTemplate)
                          ?.name
                      } - ${
                        templates.find((t) => t.type === state.selectedTemplate)
                          ?.description
                      }`,
                      image: templates.find(
                        (t) => t.type === state.selectedTemplate,
                      )?.image,
                    }
                  : null
              }
              onChange={(option) => {
                if (option) {
                  setState((prev) => ({
                    ...prev,
                    selectedTemplate: option.value,
                  }));
                }
              }}
              isSearchable
              isClearable={false}
              formatOptionLabel={(option) => (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {option.image && (
                    <img
                      src={chrome.runtime.getURL(option.image)}
                      alt={option.label}
                      style={{ width: "40px", height: "40px" }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "13px" }}>
                      {option.label.split(" - ")[0]}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {option.label.split(" - ")[1]}
                    </div>
                  </div>
                </div>
              )}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "50px",
                  borderColor: "#ddd",
                  borderRadius: "4px",
                  fontSize: "13px",
                }),
                menu: (base) => ({
                  ...base,
                  fontSize: "13px",
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }),
                option: (base, { isSelected, isFocused }) => ({
                  ...base,
                  backgroundColor: isSelected
                    ? "#4CAF50"
                    : isFocused
                      ? "#f0f0f0"
                      : "white",
                  color: isSelected ? "white" : "black",
                  padding: "10px 12px",
                  cursor: "pointer",
                }),
              }}
            />
          </div>

          <div>
            <button
              className="btn-primary"
              onClick={handleExport}
              disabled={state.cards.length === 0 || state.exporting}
            >
              {state.exporting ? (
                <>
                  <span className="spinner"></span> Exporting...
                </>
              ) : (
                `✨ Export ${state.cards.length} Cards to Wordwall`
              )}
            </button>

            <button
              className="btn-secondary"
              onClick={extractCards}
              disabled={state.exporting}
              style={{ marginTop: "8px" }}
            >
              🔄 Re-extract from Page
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>No cards found. Make sure you are on a Quizlet flashcard page.</p>
          <button
            className="btn-primary"
            onClick={extractCards}
            style={{ marginTop: "12px" }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

interface CardItemProps {
  card: FlashcardPair;
  index: number;
  isReversed: boolean;
  onRemove: () => void;
  onEdit: (term: string, definition: string) => void;
}

const CardItem: React.FC<CardItemProps> = ({
  card,
  index,
  isReversed,
  onRemove,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTerm, setEditedTerm] = useState(card.term);
  const [editedDefinition, setEditedDefinition] = useState(card.definition);

  const handleSave = () => {
    onEdit(editedTerm, editedDefinition);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        className="card-item"
        style={{ flexDirection: "column", alignItems: "flex-start" }}
      >
        <input
          type="text"
          className="input-field"
          value={editedTerm}
          onChange={(e) => setEditedTerm(e.target.value)}
          placeholder="Term"
          style={{ marginBottom: "4px" }}
        />
        <input
          type="text"
          className="input-field"
          value={editedDefinition}
          onChange={(e) => setEditedDefinition(e.target.value)}
          placeholder="Definition"
          style={{ marginBottom: "8px" }}
        />
        <div className="card-actions" style={{ width: "100%" }}>
          <button className="btn-small" onClick={handleSave}>
            Save
          </button>
          <button className="btn-small" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Display reversed if isReversed is true
  const displayTerm = isReversed ? card.definition : card.term;
  const displayDefinition = isReversed ? card.term : card.definition;

  return (
    <div className="card-item">
      <div className="card-pair">
        <div className="card-term" style={{ opacity: isReversed ? 0.6 : 1 }}>
          {displayTerm}
        </div>
        <div
          className="card-definition"
          style={{ opacity: isReversed ? 0.6 : 1 }}
        >
          {displayDefinition}
        </div>
      </div>
      <div className="card-actions">
        <button className="btn-small" onClick={() => setIsEditing(true)}>
          ✏️
        </button>
        <button className="btn-small remove" onClick={onRemove}>
          🗑️
        </button>
      </div>
    </div>
  );
};

// Mount React app
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Popup />);
