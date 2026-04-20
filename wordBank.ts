@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@1,800&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", ui-serif, Georgia, serif;
  
  /* Morandi Palette */
  --color-morandi-dusty-rose: #C99FA1;
  --color-morandi-misty-blue: #A7C1CE;
  --color-morandi-sage-green: #A4B494;
  --color-morandi-warm-grey: #D2D2D2;
  --color-morandi-clay: #96897f;
  --color-morandi-background: #E5E1DD;
  --color-morandi-text: #4A4A4A;
  
  --color-glass-bg: rgba(255, 255, 255, 0.4);
  --color-glass-border: rgba(255, 255, 255, 0.5);
  --color-accent: var(--color-morandi-clay);
}

@layer base {
  body {
    background-color: var(--color-morandi-background);
    color: var(--color-morandi-text);
    font-family: var(--font-sans);
    min-height: 100vh;
    overflow-x: hidden;
    transition: background-color 1s ease;
  }
}

@layer components {
  .glass-card {
    background: var(--color-glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.05);
  }

  .glass-button {
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid var(--color-glass-border);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    color: var(--color-morandi-text);
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  }

  .glass-button:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  .glass-button-active {
    background: var(--color-morandi-clay);
    color: white;
    border-color: var(--color-morandi-clay);
  }

  .morandi-text-shadow {
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
}
