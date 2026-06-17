import { useState } from "react";

function App() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("Backend Developer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [error, setError] = useState("");

  const startInterview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/start-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "start",
          role: role,
          difficulty: difficulty,
        }),
      });
      const data = await res.json();
      setMessages([{ from: "ai", text: data.question }]);
      setStarted(true);
    } catch (err) {
      setError("Backend connect avvatledu! Uvicorn running ga undaali.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          role: role,
          difficulty: difficulty,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: data.response },
      ]);
    } catch (err) {
      setError("Something went wrong!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      {!started ? (
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl">
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
      ) : (
        <div className="w-full max-w-2xl flex flex-col h-screen py-4">
          <h1 className="text-xl font-bold text-blue-400 text-center mb-4">
            🎯 Mock Interview — {role}
          </h1>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-lg p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.from === "ai"
                      ? "bg-gray-800 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {msg.from === "ai" && (
                    <p className="text-blue-400 font-bold mb-1">🤖 Interviewer</p>
                  )}
                  {msg.from === "user" && (
                    <p className="text-blue-200 font-bold mb-1">You</p>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-4 rounded-2xl text-gray-400">
                  🤖 Thinking...
                </div>
              </div>
            )}
          </div>

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
        </div>
      )}
    </div>
  );
}

export default App;