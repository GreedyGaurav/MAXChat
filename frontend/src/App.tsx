import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import Login from "./pages/Login";
import Register from "./pages/Register";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const isAuthenticated = !!localStorage.getItem("token");
  const location = useLocation();

  return (
    <div
      className={`flex h-screen ${
        isDarkMode ? "dark bg-gray-900" : "bg-white"
      }`}
    >
      {/* Show Sidebar only if logged in and on /chat */}
      {isAuthenticated && location.pathname === "/chat" && (
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          isDarkMode={isDarkMode}
          onThemeToggle={toggleTheme}
          selectedSession={selectedSession}
          setSelectedSession={setSelectedSession}
        />
      )}

      <div
        className={`flex-1 flex flex-col ${
          isAuthenticated && location.pathname === "/chat" ? "lg:ml-64" : ""
        }`}
      >
        {/* Mobile Header */}
        {isAuthenticated && location.pathname === "/chat" && (
          <div
            className={`lg:hidden flex items-center justify-between p-4 border-b ${
              isDarkMode
                ? "border-gray-700 bg-gray-900"
                : "border-gray-200 bg-white"
            }`}
          >
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-md transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-800 text-white"
                  : "hover:bg-gray-100 text-gray-900"
              }`}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1
              className={`text-lg font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              NAXChat
            </h1>
            <div className="w-10"></div>
          </div>
        )}

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/chat"
            element={
              isAuthenticated ? (
                <ChatInterface
                  isDarkMode={isDarkMode}
                  selectedSession={selectedSession}
                  setSelectedSession={setSelectedSession}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="*"
            element={
              <h1 className="text-center text-2xl mt-20">
                404 - Page Not Found
              </h1>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
