# Carcino Vantage

A beautiful, minimal Markdown editor by **The Carcino Foundation**.

Built with **Next.js 14**, **TypeScript**, **CodeMirror 6**, and **Tailwind CSS**. Designed for article and blog writers with a liquid glass aesthetic, Carcino brand colours, and Google Sans Flex typography.

---

## Features

- **Live split-view** — Editor + Preview side-by-side, or focus on either alone
- **Document Outline** — Auto-parsed sidebar of all headings with active tracking and scroll-to
- **Rich formatting toolbar** — Bold, italic, headings, lists, tables, code blocks, links, images, HR
- **Find & Replace** — Native CodeMirror search panel (Ctrl+H)
- **Syntax highlighting** — Code fences with language-specific colour tokens in both light and dark mode
- **Auto-save** — Debounced localStorage persistence (800 ms), with save indicator
- **Light & Dark mode** — Persistent preference via localStorage
- **Export** — Download as `.md` or `.html`
- **Open local files** — Open `.md`, `.markdown`, or `.txt` from your filesystem
- **Rename documents** — Inline click-to-edit title
- **Document stats** — Word count, character count, estimated reading time, line count
- **Cursor position** — Live Ln / Col in the status bar
- **Keyboard shortcuts** — `Ctrl+B`, `Ctrl+I`, `Ctrl+S`, `Ctrl+N`, `Ctrl+H`
- **GFM support** — Tables, task lists, strikethrough, autolinks

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS variables |
| Editor | CodeMirror 6 via `@uiw/react-codemirror` |
| Markdown parsing | `react-markdown` + `remark-gfm` |
| Syntax highlighting | `rehype-highlight` + `highlight.js` |
| Icons | `lucide-react` |
| Deployment | Vercel |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Framework is auto-detected as **Next.js**
5. Click **Deploy** — no environment variables required

---

## Project Structure

```
carcino-vantage/
├── public/
│   └── logo.svg               # Carcino Foundation logo
├── src/
│   ├── app/
│   │   ├── globals.css         # Design tokens, glass utility, prose styles
│   │   ├── layout.tsx          # Root layout + font imports
│   │   └── page.tsx            # Main editor page (all state lives here)
│   ├── components/
│   │   ├── Header.tsx          # Top bar: logo, title, view switcher, actions
│   │   ├── Toolbar.tsx         # Formatting toolbar
│   │   ├── EditorPane.tsx      # CodeMirror 6 editor with custom Carcino theme
│   │   ├── PreviewPane.tsx     # react-markdown live preview
│   │   ├── OutlineSidebar.tsx  # Heading outline with active tracking
│   │   └── StatusBar.tsx       # Doc stats + cursor + save indicator
│   └── types/
│       └── index.ts            # Shared TypeScript interfaces
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── vercel.json
```

---

## Customisation

All brand colours are defined as CSS custom properties in `globals.css`. To update the accent colour, change the `--accent*` variables in `:root`.

```css
:root {
  --accent:        #9875c1;   /* Primary brand purple */
  --accent-light:  #b399d4;
  --accent-dark:   #7b5aa0;
  --accent-glow:   rgba(152, 117, 193, 0.35);
  --accent-subtle: rgba(152, 117, 193, 0.1);
}
```

---

## Licence

© The Carcino Foundation. All rights reserved.
