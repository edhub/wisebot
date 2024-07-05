const { addIconSelectors } = require("@iconify/tailwind");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/typography"),
    addIconSelectors({
      prefixes: ["simple-line-icons"],
      scale: 1,
      extraMaskRules: {
        display: "block",
      },
    }),
  ],
};
