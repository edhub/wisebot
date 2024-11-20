import { addIconSelectors } from "@iconify/tailwind";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {},
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
