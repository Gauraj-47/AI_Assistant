import { ArrowUp, Bot, CircleHelp, RotateCcw, Sparkles } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { askSanjivani } from "../services/api";

const suggestions = [
  "Which farmers have pending payments above ₹40,000?",
  "Who supplied the highest quantity of sugarcane?",
  "What is the total sugarcane supplied by farmers in Kopargaon?",
  "Show the top three farmers by sugarcane supply.",
  "What is the total outstanding payment?",
  "Which village has the highest sugarcane supply?",
];

interface AIChatPanelProps {
  compact?: boolean;
}

export function AIChatPanel({ compact = false }: AIChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function submit(value = question) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setQuestion(trimmed);
    setLastQuestion(trimmed);
    setAnswer("");
    setError("");
    setLoading(true);
    try {
      setAnswer(await askSanjivani(trimmed));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  return (
    <section className={`ai-panel ${compact ? "ai-panel--compact" : ""}`}>
      <div className="ai-panel-glow" />
      <div className="ai-panel-content">
        <div className="ai-heading-row">
          <div className="ai-heading-icon"><Bot size={23} /></div>
          <div className="ai-title">
            <span className="ai-eyebrow"><Sparkles size={12} /> FARMER INTELLIGENCE</span>
            <h2>Ask Sanjivani AI</h2>
            <p>Ask questions about farmers, sugarcane supply, villages, and pending payments.</p>
          </div>
        </div>
        <form className="ai-input-card" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="ai-question">Ask a question about farmer records</label>
          <textarea
            id="ai-question"
            ref={inputRef}
            rows={compact ? 2 : 3}
            placeholder="Ask anything about your farmer records..."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
          />
          <div className="ai-input-footer">
            <span><CircleHelp size={14} /> Answers are grounded in your records</span>
            <button className="ai-send-button" disabled={!question.trim() || loading} type="submit">
              {loading ? <span className="spinner" /> : <><span>Ask AI</span><ArrowUp size={16} /></>}
            </button>
          </div>
        </form>
        <div className="suggestion-list">
          {suggestions.slice(0, compact ? 3 : suggestions.length).map((item) => (
            <button className="suggestion-chip" key={item} onClick={() => { setQuestion(item); void submit(item); }} disabled={loading}>{item}</button>
          ))}
        </div>
        {(loading || answer || error) && (
          <div className={`ai-response ${error ? "ai-response--error" : ""}`} aria-live="polite">
            <div className="response-avatar"><Sparkles size={16} /></div>
            <div className="response-body">
              <div className="response-label">{loading ? "Sanjivani AI is thinking" : error ? "Couldn't complete your request" : "Sanjivani AI"}</div>
              {loading && <div className="thinking-dots"><i /><i /><i /></div>}
              {answer && <p>{answer}</p>}
              {error && <><p>{error}</p><button className="retry-button" onClick={() => void submit(lastQuestion)} disabled={loading}><RotateCcw size={14} /> Try again</button></>}
            </div>
          </div>
        )}
      </div>
      <div className="ai-decoration" aria-hidden="true"><span>✳</span><span>✳</span></div>
    </section>
  );
}
