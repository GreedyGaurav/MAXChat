import React, { useState, useRef, useEffect } from "react";
import { Send, Plus, Mic, Paperclip } from "lucide-react";
import { getToken } from "../utils/auth";

interface Message {
  _id?: string;
  content: string;
  isUser: boolean;
  timestamp: Date | string;
}

interface ChatInterfaceProps {
  isDarkMode: boolean;
  selectedSession: string | null;
  setSelectedSession: (id: string | null) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isDarkMode,
  selectedSession,
  setSelectedSession,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages when session changes
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/chat/sessions/${selectedSession}/messages`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(
            data.map((msg: any) => ({
              _id: msg._id,
              content: msg.content,
              isUser: msg.sender !== "ai", // AI messages have sender === "ai"
              timestamp: msg.timestamp,
            }))
          );
        }
      } catch (err) {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [selectedSession]);

  // Helper to get user id from token payload (if needed)
  function getUserId() {
    try {
      const token = getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload._id || payload.userId;
    } catch {
      return null;
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    const token = getToken();
    if (!token) window.location.href = "/login";
  }, []);

  // Send message: if no session, create one first
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    setIsLoading(true);
    let sessionId = selectedSession;
    try {
      // If no session, create one
      if (!sessionId) {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ title: inputValue.slice(0, 30) }),
        });
        if (res.ok) {
          const data = await res.json();
          sessionId = data._id;
          setSelectedSession(sessionId);
        } else {
          throw new Error("Failed to create session");
        }
      }
      // Post message to backend
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ content: inputValue }),
      });
      if (res.ok) {
        const aiData = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            content: inputValue,
            isUser: true,
            timestamp: new Date(),
          },
          {
            _id: aiData._id,
            content: aiData.content,
            isUser: false, // AI message
            timestamp: aiData.timestamp,
          },
        ]);
        setInputValue("");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      // Optionally show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Get user info from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const username = user?.username || "User";
  const email = user?.email || "";
  // Use DiceBear Avatars for a unique profile image based on email
  const profileImg = email
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
        email
      )}`
    : "https://randomuser.me/api/portraits/men/32.jpg";

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Profile and Logout Section */}
      <div
        className={`flex items-center justify-between px-6 py-4 border-b ${
          isDarkMode
            ? "border-gray-700 bg-gray-900"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-4">
          <img
            src={profileImg}
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover"
          />
          <div>
            <div
              className={`font-semibold text-lg ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {username}
            </div>
            <div
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {email}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
        >
          Logout
        </button>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="text-center mb-8">
              <h1
                className={`text-4xl font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                What can I help with?
              </h1>
              <p
                className={`text-lg ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Ask me anything and I'll do my best to help!
              </p>
            </div>
          </div>
        ) : (
          // Messages
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.map((message, idx) => (
              <div key={message._id || idx} className="mb-8">
                <div
                  className={`flex gap-4 ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.isUser && (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDarkMode ? "bg-green-600" : "bg-green-500"
                      }`}
                    >
                      <span className="text-white text-sm font-medium">AI</span>
                    </div>
                  )}
                  <div
                    className={`max-w-2xl ${
                      message.isUser ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block p-4 rounded-2xl ${
                        message.isUser
                          ? isDarkMode
                            ? "bg-blue-600 text-white"
                            : "bg-blue-500 text-white"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-100"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                  {message.isUser && (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDarkMode ? "bg-blue-600" : "bg-blue-500"
                      }`}
                    >
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-8">
                <div className="flex gap-4 justify-start">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDarkMode ? "bg-green-600" : "bg-green-500"
                    }`}
                  >
                    <span className="text-white text-sm font-medium">AI</span>
                  </div>
                  <div
                    className={`p-4 rounded-2xl ${
                      isDarkMode ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          isDarkMode ? "bg-gray-400" : "bg-gray-600"
                        }`}
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          isDarkMode ? "bg-gray-400" : "bg-gray-600"
                        }`}
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          isDarkMode ? "bg-gray-400" : "bg-gray-600"
                        }`}
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <div
            className={`relative rounded-3xl border transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-600"
                : "bg-white border-gray-300"
            }`}
          >
            <div className="flex items-end gap-2 p-3">
              <button
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedSession(null)}
              >
                <Plus className="w-5 h-5" />
              </button>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className={`flex-1 resize-none border-none outline-none bg-transparent min-h-[24px] max-h-[200px] ${
                  isDarkMode
                    ? "text-white placeholder-gray-400"
                    : "text-gray-900 placeholder-gray-500"
                }`}
                rows={1}
                disabled={isLoading}
              />
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-full transition-colors ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                {inputValue.trim() ? (
                  <button
                    onClick={sendMessage}
                    disabled={isLoading}
                    className={`p-2 rounded-full transition-colors ${
                      isDarkMode
                        ? "bg-white text-gray-900 hover:bg-gray-100"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    } disabled:opacity-50`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    className={`p-2 rounded-full transition-colors ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p
            className={`text-xs text-center mt-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            MAXChat can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
