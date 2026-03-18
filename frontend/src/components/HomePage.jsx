import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/HomePage.module.css";

const API = "http://localhost:8000";

const FLOWERS = ["🌸", "🌻", "🌺", "🌼", "💐", "🌷", "🏵️", "🌹"];

function getToken() { return localStorage.getItem("token"); }
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}
function getCurrentUsername() {
  const token = getToken();
  if (!token) return null;
  try { return JSON.parse(atob(token.split(".")[1])).sub; } catch { return null; }
}
function timeAgo(isoString) {
  if (!isoString) return "";
  const seconds = Math.floor((new Date() - new Date(isoString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// ── Flower Results ────────────────────────────────────────────────
function FlowerResults({ options, votedOptionId }) {
  const [grown, setGrown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setGrown(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
  const maxVotes = Math.max(...options.map((o) => o.votes), 1);
  const MAX_STEM = 110;

  return (
    <div className={styles.flowerGarden} ref={ref}>
      {options.map((opt, i) => {
        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const stemH = grown ? Math.max(Math.round((opt.votes / maxVotes) * MAX_STEM), 6) : 0;
        const isChosen = opt.id === votedOptionId;
        const flowerEmoji = FLOWERS[i % FLOWERS.length];
        const flowerSize = 16 + Math.round((opt.votes / maxVotes) * 10);

        return (
          <div
            key={opt.id}
            className={styles.flowerCol}
          >
            <div className={styles.flowerHead} style={{ fontSize: `${flowerSize}px` }}>
              {flowerEmoji}
            </div>
            <div className={styles.flowerStem} style={{ height: `${stemH}px` }} />
            <div className={styles.flowerPct}>
              {isChosen ? "✓" : `${pct}%`}
            </div>
            <div className={`${styles.flowerLabel} ${isChosen ? styles.chosenLabel : ""}`}>
              {opt.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Create Poll Form ──────────────────────────────────────────────
function CreatePollForm({ onCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateOption = (i, val) => {
    const updated = [...options]; updated[i] = val; setOptions(updated);
  };
  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filledOptions = options.filter((o) => o.trim() !== "");
    if (filledOptions.length < 2) { setError("Please provide at least 2 options."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/polls`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ question, options: filledOptions.map((text) => ({ text })) }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Failed to create poll."); return; }
      setQuestion(""); setOptions(["", ""]); onCreated();
    } catch { setError("Could not connect to server."); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.createPoll}>
      <h2>New Poll 🍯</h2>
      {error && <p className={styles.formError}>{error}</p>}
      <form className={styles.createPollForm} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label htmlFor="question">Question</label>
          <input id="question" type="text" value={question}
            onChange={(e) => setQuestion(e.target.value)} placeholder="Ask the hive..." required />
        </div>
        <div className={styles.fieldGroup}>
          <label>Options</label>
          {options.map((opt, i) => (
            <div key={i} className={styles.optionRow}>
              <input type="text" value={opt} onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`} />
              {options.length > 2 && (
                <button type="button" className={styles.removeOptionBtn} onClick={() => removeOption(i)}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className={styles.addOptionBtn} onClick={addOption}>+ Add Option</button>
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Post Poll 🐝"}
        </button>
      </form>
    </div>
  );
}

// ── Comments ──────────────────────────────────────────────────────
function Comments({ pollId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API}/polls/${pollId}/comments`, { headers: authHeaders() });
      if (!res.ok) return;
      setComments(await res.json());
    } catch {}
  };

  useEffect(() => { fetchComments(); }, [pollId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/polls/${pollId}/comments`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(Array.isArray(d.detail) ? d.detail.map((e) => e.msg).join(", ") : d.detail || "Failed to post.");
        return;
      }
      setText(""); fetchComments();
    } catch { setError("Could not connect to server."); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.commentsSection}>
      <h4>Comments</h4>
      <div className={styles.commentList}>
        {comments.length === 0
          ? <p className={styles.noComments}>No comments yet. Be the first! 🐝</p>
          : comments.map((c) => (
            <div key={c.id} className={styles.comment}>
              <span className={styles.commentAuthor}>@{c.author}</span>
              <span className={styles.commentTimestamp}>{timeAgo(c.created_at)}</span>
              <p className={styles.commentText}>{c.text}</p>
            </div>
          ))
        }
      </div>
      {error && <p className={styles.formError}>{error}</p>}
      <form className={styles.commentForm} onSubmit={handleSubmit}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..." />
        <button type="submit" className={styles.commentPostBtn} disabled={loading}>
          {loading ? "..." : "Post"}
        </button>
      </form>
    </div>
  );
}

// ── Poll Card ─────────────────────────────────────────────────────
function PollCard({ poll, currentUsername, onVoted, onDeleted }) {
  const [showComments, setShowComments] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const hasVoted = poll.voted_option_id !== null;
  const isOwner = poll.creator === currentUsername;

  const vote = async (optionId) => {
    if (hasVoted) return;
    setVoting(true); setError("");
    try {
      const res = await fetch(`${API}/polls/${poll.id}/vote`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ option_id: optionId }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Vote failed."); return; }
      onVoted(poll.id, optionId);
    } catch { setError("Could not connect to server."); }
    finally { setVoting(false); }
  };

  const deletePoll = async () => {
    if (!confirm("Delete this poll?")) return;
    try {
      const res = await fetch(`${API}/polls/${poll.id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) return;
      onDeleted();
    } catch {}
  };

  return (
    <div className={styles.pollCard}>
      <div className={styles.pollCardHeader}>
        <span className={styles.pollCreator}>@{poll.creator}</span>
        <span className={styles.pollTimestamp}>{timeAgo(poll.created_at)}</span>
        {isOwner && (
          <button className={styles.deleteBtn} onClick={deletePoll}>Delete</button>
        )}
      </div>

      <h3 className={styles.pollQuestion}>{poll.question}</h3>
      {error && <p className={styles.formError}>{error}</p>}

      {hasVoted ? (
        <FlowerResults options={poll.options} votedOptionId={poll.voted_option_id} />
      ) : (
        <div className={styles.pollOptions}>
          {poll.options.map((opt) => (
            <button
              key={opt.id}
              className={styles.voteBtn}
              onClick={() => vote(opt.id)}
              disabled={voting}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}

      <div className={styles.pollCardFooter}>
        <p className={styles.pollTotal}>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
        <button className={styles.toggleCommentsBtn} onClick={() => setShowComments((v) => !v)}>
          {showComments ? "Hide Comments" : "💬 Comments"}
        </button>
      </div>

      {showComments && <Comments pollId={poll.id} />}
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────
function HomePage() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const currentUsername = getCurrentUsername();

  const logout = () => { localStorage.removeItem("token"); navigate("/"); };

  useEffect(() => {
    const verifyToken = async () => {
      const token = getToken();
      try {
        const res = await fetch(`${API}/verify-token/${token}`);
        if (!res.ok) throw new Error();
      } catch { localStorage.removeItem("token"); navigate("/"); }
    };
    verifyToken();
  }, [navigate]);

  const fetchPolls = async (p = page) => {
    setLoadingPolls(true);
    try {
      const res = await fetch(`${API}/polls?page=${p}&page_size=10`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPolls(data.polls);
      setTotalPages(data.total_pages);
    } catch {} finally { setLoadingPolls(false); }
  };

  useEffect(() => { fetchPolls(page); }, [page]);

  const handleVoted = (pollId, optionId) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          voted_option_id: optionId,
          options: p.options.map((o) =>
            o.id === optionId ? { ...o, votes: o.votes + 1 } : o
          ),
        };
      })
    );
  };

  return (
    <div className={styles.homePage}>
      <header className={styles.homeHeader}>
        <h1>Poll Feed</h1>
        <div className={styles.headerActions}>
          <button className={styles.newPollBtn} onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "+ New Poll"}
          </button>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </header>

      {showCreate && (
        <CreatePollForm onCreated={() => { setShowCreate(false); setPage(1); fetchPolls(1); }} />
      )}

      <div className={styles.pollFeed}>
        {loadingPolls ? (
          <p className={styles.feedLoading}>Loading polls... 🐝</p>
        ) : !polls || polls.length === 0 ? (
          <p className={styles.feedEmpty}>No polls yet. Create the first one! 🍯</p>
        ) : (
          polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} currentUsername={currentUsername}
              onVoted={handleVoted} onDeleted={fetchPolls} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}

export default HomePage;