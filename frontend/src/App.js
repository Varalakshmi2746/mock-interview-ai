import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

function App() {
  const [user, setUser] = useState(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [role, setRole] = useState("Backend Developer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [topic, setTopic] = useState("General (Mixed)");
  const [company, setCompany] = useState("General");
  const [error, setError] = useState("");
  const [finalFeedback, setFinalFeedback] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [timer, setTimer] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("interviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setHistory(data || []);
  }, [user]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveInterview = useCallback(async (score, feedback) => {
    if (!user) return;
    await supabase.from("interviews").insert([{
      user_id: user.id,
      user_email: user.email,
      role: role,
      difficulty: difficulty,
      score: score,
      feedback: feedback,
    }]);
    fetchHistory();
  }, [user, role, difficulty, fetchHistory]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleTimeUp = useCallback(async () => {
    setTimerActive(false);
    const timeUpMsg = "Time up! I need more time to think about this.";
    setMessages((prev) => [...prev, { from: "user", text: timeUpMsg }]);
    setLoading(true);
    try {
      const res = await fetch(
        "https://mock-interview-ai-hr52.onrender.com/submit-answer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: timeUpMsg, role, difficulty, topic, company }),
        }
      );
      const data = await res.json();
      const aiText = data.response;
      setMessages((prev) => [...prev, { from: "ai", text: aiText }]);
      setQuestionCount((q) => q + 1);
      setTimer(120);
      setTimerActive(true);
      setHintsUsed(0);
      if (aiText.toLowerCase().includes("interview complete") ||
          aiText.toLowerCase().includes("final score")) {
        setFinalFeedback(aiText);
        setTimerActive(false);
        const scoreMatch = aiText.match(/(\d+)\s*\/\s*10/);
        const s = scoreMatch ? scoreMatch[1] : "?";
        await saveInterview(s, aiText);
        setTimeout(() => setFinished(true), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [role, difficulty, topic, company, saveInterview]);

  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && timerActive) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [timerActive, timer, handleTimeUp]);

  const handleAuth = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setAuthError(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setAuthError(error.message);
        else setAuthError("Check your email to confirm signup!");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
  };

  const getHint = async () => {
    if (hintsUsed >= 2) return;
    setHintLoading(true);
    setTimerActive(false);
    try {
      const res = await fetch(
        "https://mock-interview-ai-hr52.onrender.com/submit-answer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "I'm stuck. Give me a small hint without revealing the full answer.",
            role, difficulty, topic, company,
          }),
        }
      );
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "hint", text: data.response }]);
      setHintsUsed((h) => h + 1);
      setTimerActive(true);
    } catch (err) {
      console.error(err);
    } finally {
      setHintLoading(false);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    setError("");
    setFinished(false);
    setMessages([]);
    setQuestionCount(1);
    setTimer(120);
    setHintsUsed(0);
    setShowHistory(false);
    try {
      const res = await fetch(
        "https://mock-interview-ai-hr52.onrender.com/start-interview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "start", role, difficulty, topic, company }),
        }
      );
      const data = await res.json();
      setMessages([{ from: "ai", text: data.question }]);
      setStarted(true);
      setTimerActive(true);
    } catch (err) {
      setError("Backend connect avvatledu!");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!input.trim()) return;
    setTimerActive(false);
    setMessages((prev) => [...prev, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
    setHintsUsed(0);
    try {
      const res = await fetch(
        "https://mock-interview-ai-hr52.onrender.com/submit-answer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input, role, difficulty, topic, company }),
        }
      );
      const data = await res.json();
      const aiText = data.response;
      setMessages((prev) => [...prev, { from: "ai", text: aiText }]);
      if (aiText.toLowerCase().includes("interview complete") ||
          aiText.toLowerCase().includes("final score") ||
          aiText.toLowerCase().includes("overall score")) {
        setFinalFeedback(aiText);
        setTimerActive(false);
        const scoreMatch = aiText.match(/(\d+)\s*\/\s*10/);
        const s = scoreMatch ? scoreMatch[1] : "?";
        await saveInterview(s, aiText);
        setTimeout(() => setFinished(true), 2000);
      } else {
        setQuestionCount((q) => q + 1);
        setTimer(120);
        setTimerActive(true);
      }
    } catch (err) {
      setError("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const tryAgain = () => {
    setStarted(false);
    setFinished(false);
    setMessages([]);
    setFinalFeedback("");
    setInput("");
    setError("");
    setQuestionCount(0);
    setTimer(120);
    setTimerActive(false);
    setHintsUsed(0);
    setCompany("General");
  };

  const extractScore = (text) => {
    const match = text.match(/(\d+)\s*\/\s*10/);
    return match ? match[1] : "?";
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-400";
    if (score >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  const getTimerColor = () => {
    if (timer > 60) return "text-green-400";
    if (timer > 30) return "text-yellow-400";
    return "text-red-400 animate-pulse";
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const score = extractScore(finalFeedback);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-2 text-blue-400">
            🎯 Mock Interview AI
          </h1>
          <p className="text-center text-gray-400 mb-6">
            {authMode === "login" ? "Login to continue" : "Create account"}
          </p>
          {authError && (
            <div className={`p-3 rounded-lg mb-4 text-sm ${
              authError.includes("Check") ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
            }`}>
              {authError}
            </div>
          )}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input
              type="email"
              className="w-full bg-gray-800 rounded-lg p-3 text-white"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-1 block">Password</label>
            <input
              type="password"
              className="w-full bg-gray-800 rounded-lg p-3 text-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            onClick={handleAuth}
            disabled={authLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition mb-4"
          >
            {authLoading ? "Loading..." : authMode === "login" ? "Login" : "Sign Up"}
          </button>
          <p className="text-center text-gray-400 text-sm">
            {authMode === "login" ? "Account ledu? " : "Already account undi? "}
            <button
              onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
              className="text-blue-400 hover:underline"
            >
              {authMode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      {!started && !finished && (
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm">👋 {user.email}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg text-sm"
              >
                📋 History
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-800 hover:bg-red-700 px-3 py-1 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="bg-gray-900 rounded-2xl p-4 mb-4 max-h-64 overflow-y-auto">
              <h2 className="text-blue-400 font-bold mb-3">📋 Past Interviews</h2>
              {history.length === 0 ? (
                <p className="text-gray-400 text-sm">No interviews yet!</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-3 mb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{h.role} • {h.difficulty}</span>
                      <span className={`font-bold text-lg ${getScoreColor(parseInt(h.score))}`}>
                        {h.score}/10
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(h.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-center mb-2 text-blue-400">
              🎯 Mock Interview AI
            </h1>
            <p className="text-center text-gray-400 mb-6">
              Practice technical interviews with AI
            </p>
            {error && (
              <div className="bg-red-900 text-red-300 p-3 rounded-lg mb-4 text-sm">
                ⚠️ {error}
              </div>
            )}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-1 block">🏢 Company Style</label>
              <select
                className="w-full bg-gray-800 rounded-lg p-3 text-white"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              >
                <option>General</option>
                <option>TCS</option>
                <option>Infosys</option>
                <option>Wipro</option>
                <option>Accenture</option>
                <option>Product Company</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-1 block">Role</label>
              <select
                className="w-full bg-gray-800 rounded-lg p-3 text-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Backend Developer</option>
                <option>Frontend Developer</option>
                <option>Full Stack Developer</option>
                <option>Data Structures & Algorithms</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-1 block">Topic</label>
              <select
                className="w-full bg-gray-800 rounded-lg p-3 text-white"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                <option>General (Mixed)</option>
                <option>DBMS</option>
                <option>OOPs</option>
                <option>Operating Systems</option>
                <option>Computer Networks</option>
                <option>Data Structures</option>
                <option>Algorithms</option>
                <option>System Design</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-1 block">Difficulty</label>
              <select
                className="w-full bg-gray-800 rounded-lg p-3 text-white"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <button
              onClick={startInterview}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
            >
              {loading ? "Starting..." : "Start Interview 🚀"}
            </button>
          </div>
        </div>
      )}

      {started && !finished && (
        <div className="w-full max-w-2xl flex flex-col h-screen py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-blue-400">
              🏢 {company} • {role}
            </h1>
            <div className="bg-gray-800 px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">Question </span>
              <span className="text-white font-bold">{questionCount}</span>
              <span className="text-gray-400 text-sm">/5</span>
            </div>
            <div className={`text-2xl font-bold ${getTimerColor()}`}>
              ⏱ {formatTime(timer)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-lg p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.from === "ai" ? "bg-gray-800 text-white" :
                  msg.from === "hint" ? "bg-yellow-900 border border-yellow-600 text-white w-full" :
                  "bg-blue-600 text-white"
                }`}>
                  {msg.from === "ai" && <p className="text-blue-400 font-bold mb-1">🤖 Interviewer</p>}
                  {msg.from === "hint" && <p className="text-yellow-400 font-bold mb-1">💡 Hint ({hintsUsed}/2 used)</p>}
                  {msg.from === "user" && <p className="text-blue-200 font-bold mb-1">You</p>}
                  {msg.text}
                </div>
              </div>
            ))}
            {(loading || hintLoading) && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-4 rounded-2xl text-gray-400">
                  {hintLoading ? "💡 Getting hint..." : "🤖 Thinking..."}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <textarea
                className="flex-1 bg-gray-800 rounded-xl p-3 text-white resize-none"
                rows={3}
                placeholder="Type your answer here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                onClick={submitAnswer}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-bold transition"
              >
                Send
              </button>
            </div>
            <button
              onClick={getHint}
              disabled={hintLoading || loading || hintsUsed >= 2}
              className={`w-full py-2 rounded-xl font-bold transition text-sm ${
                hintsUsed >= 2 ? "bg-gray-700 text-gray-500 cursor-not-allowed" :
                "bg-yellow-700 hover:bg-yellow-600 text-white"
              }`}
            >
              {hintsUsed >= 2 ? "💡 No more hints (2/2 used)" :
               hintLoading ? "💡 Getting hint..." :
               `💡 Get Hint (${2 - hintsUsed} remaining)`}
            </button>
          </div>
        </div>
      )}

      {finished && (
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-lg shadow-2xl text-center">
          <h1 className="text-3xl font-bold mb-2 text-blue-400">🏆 Interview Complete!</h1>
          <p className="text-gray-400 mb-2">Company: {company} • Role: {role}</p>
          <p className="text-gray-400 mb-6">Topic: {topic}</p>
          <div className="bg-gray-800 rounded-2xl p-6 mb-6">
            <p className="text-gray-400 mb-2">Your Score</p>
            <p className={`text-7xl font-bold ${getScoreColor(parseInt(score))}`}>{score}</p>
            <p className="text-gray-400 text-xl mt-1">/ 10</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 mb-6 text-left">
            <p className="text-blue-400 font-bold mb-2">📝 Interviewer Feedback</p>
            <p className="text-gray-300 text-sm leading-relaxed">{finalFeedback}</p>
          </div>
          <div className="mb-4 bg-gray-800 rounded-xl p-3">
            <p className="text-green-400 text-sm">✅ Interview saved to your history!</p>
          </div>
          <div className="mb-6">
            {parseInt(score) >= 8 && <p className="text-green-400 font-bold">🌟 Excellent! You're ready for {company}!</p>}
            {parseInt(score) >= 5 && parseInt(score) < 8 && <p className="text-yellow-400 font-bold">👍 Good effort! Keep practicing!</p>}
            {parseInt(score) < 5 && <p className="text-red-400 font-bold">💪 Keep going! Practice makes perfect!</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={tryAgain} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">
              🔄 Try Again
            </button>
            <button onClick={() => { setStarted(false); tryAgain(); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition">
              🏠 Home
            </button>
          </div>
        </div>
      )}
      {finished && (
  <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-lg shadow-2xl text-center">
    <h1 className="text-3xl font-bold mb-2 text-blue-400">🏆 Interview Complete!</h1>
    <p className="text-gray-400 mb-2">Company: {company} • Role: {role}</p>
    <p className="text-gray-400 mb-6">Topic: {topic}</p>
    <div className="bg-gray-800 rounded-2xl p-6 mb-6">
      <p className="text-gray-400 mb-2">Your Score</p>
      <p className={`text-7xl font-bold ${getScoreColor(parseInt(score))}`}>{score}</p>
      <p className="text-gray-400 text-xl mt-1">/ 10</p>
    </div>
    <div className="bg-gray-800 rounded-2xl p-4 mb-6 text-left">
      <p className="text-blue-400 font-bold mb-2">📝 Interviewer Feedback</p>
      <p className="text-gray-300 text-sm leading-relaxed">{finalFeedback}</p>
    </div>
    <div className="mb-4 bg-gray-800 rounded-xl p-3">
      <p className="text-green-400 text-sm">✅ Interview saved to your history!</p>
    </div>
    <div className="mb-6">
      {parseInt(score) >= 8 && <p className="text-green-400 font-bold">🌟 Excellent! You're ready for {company}!</p>}
      {parseInt(score) >= 5 && parseInt(score) < 8 && <p className="text-yellow-400 font-bold">👍 Good effort! Keep practicing!</p>}
      {parseInt(score) < 5 && <p className="text-red-400 font-bold">💪 Keep going! Practice makes perfect!</p>}
    </div>
    <div className="flex gap-3 flex-wrap">
      <button onClick={tryAgain} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">
        🔄 Try Again
      </button>
      <button onClick={shareScore} className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition">
        📸 Save Score Card
      </button>
      <button onClick={() => { setStarted(false); tryAgain(); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition">
        🏠 Home
      </button>
    </div>
  </div>
)}
    </div>
  );
}

export default App;