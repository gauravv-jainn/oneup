/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // We can map our CSS variables here if we want Tailwind to use them, 
                // but for now, we just need the utility classes to work.
                primary: "var(--text-primary)",
                secondary: "var(--text-secondary)",
                muted: "var(--text-muted)",
                body: "var(--bg-body)",
                card: "var(--bg-card)",
            }
        },
    },
    plugins: [],
}
