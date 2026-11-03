const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { primary: v("primary"), electric: v("electric"), ink: v("ink"), card: v("card"), lav: v("lav"), muted: v("muted") } } },
  plugins: [],
};
