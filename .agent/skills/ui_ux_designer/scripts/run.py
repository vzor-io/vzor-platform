"""
Skill: ui_ux_designer
Entry Point
"""
import sys
import os
import random
import json

PALETTES = {
    "modern_dark": {
        "bg": "bg-slate-900",
        "text": "text-slate-50",
        "primary": "bg-indigo-600 hover:bg-indigo-700",
        "accent": "text-indigo-400"
    },
    "clean_light": {
        "bg": "bg-white",
        "text": "text-gray-900",
        "primary": "bg-blue-600 hover:bg-blue-700",
        "accent": "text-blue-500"
    },
    "vibrant": {
        "bg": "bg-neutral-900",
        "text": "text-white",
        "primary": "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90",
        "accent": "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
    }
}

FONTS = {
    "modern": "font-sans",
    "serif": "font-serif",
    "mono": "font-mono"
}

def generate_design_system(style="modern_dark"):
    """
    Generates a basic Tailwind CSS design system based on requested style.
    """
    palette = PALETTES.get(style, PALETTES["modern_dark"])
    
    design_system = {
        "style": style,
        "colors": palette,
        "font": FONTS["modern"],
        "layout": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
        "components": {
            "button": f"rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 {palette['primary']} text-white",
            "card": f"rounded-xl border border-gray-200 dark:border-gray-700 p-6 {palette['bg']}",
            "heading": f"text-3xl font-bold tracking-tight {palette['text']} sm:text-4xl"
        }
    }
    
    return json.dumps(design_system, indent=2)

def main():
    args = sys.argv[1:]
    style = args[0] if len(args) > 0 else "modern_dark"
    
    print(f"🎨 Generating UI/UX Design System for style: {style}")
    result = generate_design_system(style)
    print(result)
    
    # Save to a file for the agent to read if needed
    with open("design_system.json", "w") as f:
        f.write(result)

if __name__ == "__main__":
    main()
