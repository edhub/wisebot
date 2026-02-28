import { addIconSelectors } from "@iconify/tailwind";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563eb", // blue-600
          hover: "#1d4ed8", // blue-700
          light: "#eff6ff", // blue-50
          shadow: "#bfdbfe", // blue-200 (用于 FAB 阴影)
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f9fafb", // gray-50
          input: "#e5e7eb", // gray-200
        },
        content: {
          DEFAULT: "#111827", // gray-900
          secondary: "#1f2937", // gray-800
          muted: "#9ca3af", // gray-400
          subtle: "#d1d5db", // gray-300
          placeholder: "#6b7280", // gray-500
        },
        border: {
          DEFAULT: "#e5e7eb", // gray-200
          light: "#f3f4f6", // gray-100
        },
        danger: {
          DEFAULT: "#ef4444", // red-500
          hover: "#dc2626", // red-600
        },
        favorite: "#fbbf24", // amber-400 (统一收藏色)
        overlay: {
          heavy: "rgba(17,24,39,0.4)", // 模态遮罩
          light: "rgba(17,24,39,0.05)", // 输入框遮罩
          sidebar: "rgba(0,0,0,0.2)", // 侧边栏遮罩
        },
      },
      borderRadius: {
        card: "0.5rem", // 8px — 消息卡片、设置面板
        button: "0.75rem", // 12px — 所有按钮
        input: "0.75rem", // 12px — 输入框
        dialog: "1rem", // 16px — 对话框
        pill: "9999px", // 药丸形 — FAB、标签
      },
      zIndex: {
        toast: "50",
        "sidebar-overlay": "60",
        "mobile-fab": "65",
        sidebar: "70",
        "selection-popup": "75",
        "input-overlay": "80",
        "menu-overlay": "100",
        "menu-panel": "101",
        dialog: "200",
      },
    },
  },
  plugins: [
    typography(),
    addIconSelectors({
      prefixes: ["simple-line-icons"],
      scale: 1,
      extraMaskRules: {
        display: "block",
      },
    }),
  ],
};
