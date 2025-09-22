import { useState } from "react";
import axios from "axios";

export default function ChatBot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);

  const sendMessage = async () => {
    setMessages(prev => [...prev, { role: "user", text: input }]);
    const res = await axios.post("http://localhost:5000/chat", { question: input });
    setMessages(prev => [...prev, { role: "bot", text: res.data.answer }]);
    setInput("");
  };

  return (
    <div className="max-w-md max-auto p-4 border rounded-lg">
      <div className="h-64 overflow-auto mb-4 bg-gray-50 p-2 rounded">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-blue-600": "text-green-600"}>
            <strong>{m.role}:</strong> {m.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Ask me something..."
          className="flex=1 border p-2 rounded-l"
        />
        <button onClick={sendMessage}className="bg-blue-500 text-white px-4 rounded-r">
          Send
        </button>
      </div>
    </div>
  );
}
