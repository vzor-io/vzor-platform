/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'blender-bg': '#1d1d1d',       // Main background (dark grey)
                'blender-panel': '#2c2c2c',    // Panel background
                'blender-header': '#303030',   // Header/Tab background
                'blender-border': '#151515',   // Borders (almost black)
                'blender-text': '#dadada',     // Standard text
                'blender-accent': '#e77e22',   // Orange selection
                'blender-blue': '#3d85c6',     // Blue action
                'blender-input': '#181818',    // Input fields
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
