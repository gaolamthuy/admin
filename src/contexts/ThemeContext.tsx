/**
 * Theme Context for managing light/dark theme
 * Context quản lý theme sáng/tối với device detection và manual toggle
 */
import React, { createContext, useContext, useEffect, useState } from "react";
// import { theme } from "antd";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider component
 * Provider component cho theme management
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  // Detect device theme preference
  useEffect(() => {
    // Check localStorage first (user preference)
    const savedTheme = localStorage.getItem("glt-theme") as ThemeMode;

    if (savedTheme) {
      setThemeMode(savedTheme);
    } else {
      // Auto-detect device theme
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setThemeMode(prefersDark ? "dark" : "light");
    }
  }, []);

  // Listen for device theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem("glt-theme");
      if (!savedTheme) {
        setThemeMode(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(newTheme);
    localStorage.setItem("glt-theme", newTheme);
  };

  const isDark = themeMode === "dark";

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 * Hook để sử dụng theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
