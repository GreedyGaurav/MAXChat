import React, { useEffect, useState } from "react";
import { Plus, Moon, Sun, X, MessageSquare, Trash2 } from "lucide-react";
import { getToken } from "../utils/auth";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  selectedSession: string | null;
  setSelectedSession: (id: string | null) => void;
}

interface ChatSession {
  _id: string;
  title?: string;
  createdAt: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  isDarkMode,
  onThemeToggle,
  selectedSession,
  setSelectedSession,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Fetch sessions (refactored to allow refresh after delete)
  const fetchSessions = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat/sessions`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Delete session handler
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this chat session?")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat/sessions/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s._id !== id));
        if (selectedSession === id) setSelectedSession(null);
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDarkMode
            ? "bg-gray-900 border-r border-gray-800"
            : "bg-white border-r border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1
              className={`text-xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              MAXChat
            </h1>
            <button
              onClick={onToggle}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-800 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all hover:scale-105 ${
              isDarkMode
                ? "border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                : "border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setSelectedSession(null)}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        {/* Recent Chats */}
        <div className="flex-1 min-h-0 px-4">
          <div
            className={`text-xs font-semibold mb-3 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            RECENT
          </div>
          <div className="h-full overflow-y-auto space-y-1 pb-4">
            {sessions.length === 0 ? (
              <div
                className={`text-sm ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                No chats yet.
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session._id} className="flex items-center group">
                  <button
                    className={`flex-1 flex items-center gap-3 p-3 rounded-lg text-sm transition-all hover:scale-[1.02] ${
                      isDarkMode
                        ? "hover:bg-gray-800 text-gray-300 hover:text-white"
                        : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                    } ${
                      selectedSession === session._id
                        ? isDarkMode
                          ? "bg-gray-800"
                          : "bg-gray-200"
                        : ""
                    }`}
                    onClick={() => setSelectedSession(session._id)}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                    <span className="truncate text-left">
                      {session.title ||
                        new Date(session.createdAt).toLocaleString()}
                    </span>
                  </button>
                  <button
                    className={`ml-2 p-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? "hover:bg-gray-700 text-gray-500 hover:text-red-400"
                        : "hover:bg-gray-200 text-gray-400 hover:text-red-600"
                    }`}
                    title="Delete chat"
                    onClick={() => handleDelete(session._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4">
          <button
            onClick={onThemeToggle}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all hover:scale-105 ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900"
            }`}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
