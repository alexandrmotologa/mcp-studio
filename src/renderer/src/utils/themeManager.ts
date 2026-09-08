export type ThemeId =
  | 'cyberpunk-indigo'
  | 'midnight-oled'
  | 'emerald-matrix'
  | 'dracula-slate'
  | 'nordic-light'
  | 'github-light'
  | 'solarized-light'

export interface StudioTheme {
  id: ThemeId
  name: string
  category: 'dark' | 'light'
  description: string
  previewBg: string
  previewAccent: string
  previewBorder: string
}

export const AVAILABLE_THEMES: StudioTheme[] = [
  {
    id: 'cyberpunk-indigo',
    name: 'Cyberpunk Indigo (Default)',
    category: 'dark',
    description: 'Deep navy-indigo dark aesthetic with radiant violet and cyan accents.',
    previewBg: '#090a0f',
    previewAccent: '#6366f1',
    previewBorder: '#23293d'
  },
  {
    id: 'midnight-oled',
    name: 'Midnight True Black',
    category: 'dark',
    description: 'Pure pitch black #000000 optimized for OLED screens and high contrast.',
    previewBg: '#000000',
    previewAccent: '#8b5cf6',
    previewBorder: '#27272a'
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    category: 'dark',
    description: 'Cyber hacker dark aesthetic with glowing neon emerald and mint accents.',
    previewBg: '#050d0a',
    previewAccent: '#10b981',
    previewBorder: '#143829'
  },
  {
    id: 'dracula-slate',
    name: 'Dracula Slate',
    category: 'dark',
    description: 'Soft purple and dark slate tones inspired by the classic Dracula palette.',
    previewBg: '#181825',
    previewAccent: '#cba6f7',
    previewBorder: '#313244'
  },
  {
    id: 'nordic-light',
    name: 'Nordic Clean Light',
    category: 'light',
    description: 'Crisp, clean minimal white & sky-slate palette for well-lit environments.',
    previewBg: '#f8fafc',
    previewAccent: '#4f46e5',
    previewBorder: '#e2e8f0'
  },
  {
    id: 'github-light',
    name: 'GitHub Crisp White',
    category: 'light',
    description: 'Clean developer light theme with high contrast typography and subtle gray borders.',
    previewBg: '#ffffff',
    previewAccent: '#0969da',
    previewBorder: '#d0d7de'
  },
  {
    id: 'solarized-light',
    name: 'Solarized Warm Cream',
    category: 'light',
    description: 'Gentle warm sepia-cream tones designed for reduced eye strain.',
    previewBg: '#fdf6e3',
    previewAccent: '#d97706',
    previewBorder: '#eee8d5'
  }
]

const THEME_STORAGE_KEY = 'mcp_studio_active_theme'

export function getActiveTheme(): ThemeId {
  if (typeof window === 'undefined') return 'cyberpunk-indigo'
  return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || 'cyberpunk-indigo'
}

export function applyTheme(themeId: ThemeId): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_STORAGE_KEY, themeId)
  document.documentElement.setAttribute('data-theme', themeId)

  const found = AVAILABLE_THEMES.find((t) => t.id === themeId)
  if (found?.category === 'light') {
    document.documentElement.classList.add('light-mode')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.remove('light-mode')
    document.documentElement.classList.add('dark')
  }
}
