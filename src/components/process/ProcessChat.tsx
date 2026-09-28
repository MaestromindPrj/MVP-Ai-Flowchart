"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { ChatInputTools } from "./ChatInputTools";
import { AIImageInput, ProcessData } from "@/lib/ai/types";
import { ImageAttachment } from "./ImageAttachment";

export interface ChatMessage {
  id: string;
  senderType: "AI" | "USER" | string;
  message: string;
  suggestedChanges?: string[];
  createdAt?: string;
}

interface ProcessChatProps {
  processId: string;
  messages: ChatMessage[];
  currentProcess: ProcessData;
  onProcessUpdate: (updatedProcess: ProcessData) => void;
  onNewMessage: (msg: ChatMessage) => void;
  isReadOnly?: boolean;
}

export function ProcessChat({
  processId,
  messages,
  currentProcess,
  onProcessUpdate,
  onNewMessage,
  isReadOnly = false,
}: ProcessChatProps) {
  const [inputBusy, setInputBusy] = useState(false);
  const [image, setImage] = useState<AIImageInput>();
  const [imageBusy, setImageBusy] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "Add manager approval step",
    "If order exceeds $10,000, add finance approval",
    "Add inventory allocation task",
    "Pick, pack, and dispatch to carrier",
  ]);

  const messagesRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(384);
  const resizeStart = useRef<{ x: number; width: number } | null>(null);
  const resizePanel = (width: number) => {
    const available = panelRef.current?.parentElement?.clientWidth || window.innerWidth;
    setPanelWidth(Math.max(Math.min(280, available), Math.min(width, 640, Math.max(280, available - 160))));
  };

  useEffect(() => {
    const container = messagesRef.current;
    container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputText.trim() || (image ? "Create or update the flowchart from this image." : "");
    if (!message.trim() || isLoading || isReadOnly || inputBusy || imageBusy) return;
    if (message.length > 24000) { setDraftError("Keep the draft under 24,000 characters before sending."); return; }
    setDraftError("");

    const userMessageId = `user-msg-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      senderType: "USER",
      message: message.trim() + (image ? `\n\n[Attached image: ${image.name}]` : ""),
      createdAt: new Date().toISOString(),
    };


    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/process-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId,
          message: message.trim(),
          currentProcess,
          image,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process message");
      }

      onNewMessage(userMessage);
      setImage(undefined);
      if (!textToSend) setInputText("");
      const aiMessage: ChatMessage = {
        id: `ai-msg-${Date.now()}`,
        senderType: "AI",
        message: data.responseMessage,
        suggestedChanges: data.suggestedChanges || [],
        createdAt: new Date().toISOString(),
      };

      onNewMessage(aiMessage);

      if (data.processUpdate) {
        onProcessUpdate(data.processUpdate);
      }

      if (data.suggestedPrompts && data.suggestedPrompts.length > 0) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-msg-${Date.now()}`,
        senderType: "AI",
        message:
          err instanceof Error ? err.message : "Sorry, I encountered an error while updating the process. Please try again.",
        createdAt: new Date().toISOString(),
      };
      onNewMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div ref={panelRef} style={{ width: panelWidth }} className="relative max-w-full min-h-0 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none overflow-hidden">
      <div
        role="separator"
        aria-label="Resize chat panel"
        aria-orientation="vertical"
        aria-valuemin={280}
        aria-valuemax={640}
        aria-valuenow={panelWidth}
        tabIndex={0}
        title="Drag to resize chat"
        className="absolute inset-y-0 right-0 z-20 w-1.5 cursor-col-resize touch-none hover:bg-blue-400 focus-visible:bg-blue-400 focus-visible:outline-none"
        onPointerDown={event => {
          if (event.button !== 0) return;
          resizeStart.current = { x: event.clientX, width: panelRef.current?.clientWidth || panelWidth };
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();
        }}
        onPointerMove={event => {
          if (resizeStart.current) resizePanel(resizeStart.current.width + event.clientX - resizeStart.current.x);
        }}
        onPointerUp={event => { resizeStart.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { resizeStart.current = null; }}
        onLostPointerCapture={() => { resizeStart.current = null; }}
        onKeyDown={event => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault(); resizePanel(panelWidth + (event.key === "ArrowRight" ? 24 : -24));
          }
        }}
      />
      <div className="shrink-0 p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Process Assistant
            </div>
            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Process Assistant
            </div>
          </div>
        </div>
      </div>

      <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3.5 select-text [overflow-wrap:anywhere]">
        {messages.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-800 mb-1">
              Start Mapping With AI
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Describe your business workflow, decision rules, SLAs, or participant responsibilities below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAI = msg.senderType === "AI";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  isAI ? "items-start" : "items-start justify-end"
                }`}
              >
                {isAI && (
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                    isAI
                      ? "bg-slate-50 border border-slate-200/80 text-slate-800 shadow-subtle"
                      : "bg-blue-600 text-white shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.message}</div>

                  {isAI &&
                    msg.suggestedChanges &&
                    msg.suggestedChanges.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Flowchart Updates
                        </div>
                        {msg.suggestedChanges.map((change, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{change}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                {!isAI && (
                  <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-500 flex items-center gap-2 shadow-subtle">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Analyzing process rules & generating visual flow...</span>
            </div>
          </div>
        )}

      {!isReadOnly && suggestedPrompts.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/40">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            Suggested Next Steps
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading || inputBusy || imageBusy}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-full text-slate-700 hover:text-blue-700 transition-colors text-left truncate max-w-full"
              >
                + {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>

      <div className="shrink-0 max-h-[60%] overflow-y-auto overscroll-contain p-3.5 border-t border-slate-200 bg-white">
        {!isReadOnly && <ChatInputTools processId={processId} disabled={isLoading || isReadOnly || imageBusy} onBusy={setInputBusy} onAppend={text => setInputText(previous => previous.trim() ? previous + "\n\n" + text : text)} />}
        {!isReadOnly && <ImageAttachment image={image} onChange={setImage} onBusy={setImageBusy} disabled={isLoading || inputBusy} />}
        {draftError && <p role="alert" className="text-xs text-red-600 mb-2">{draftError}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <textarea
            aria-label="Process description"
            rows={4}
            disabled={isLoading || isReadOnly}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isReadOnly
                ? "This flowchart is read-only"
                : "Describe the next step or condition..."
            }
            className="w-full pl-3.5 pr-11 py-3 min-h-20 max-h-[25dvh] resize-y overflow-y-auto text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-900 disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Send process description"
            disabled={(!inputText.trim() && !image) || inputText.length > 24000 || isLoading || isReadOnly || inputBusy || imageBusy}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        {inputText.length > 24000 && <p role="alert" className="mt-1 text-xs text-red-600">Keep the prompt under 24,000 characters.</p>}
      </div>
    </div>
  );
}
