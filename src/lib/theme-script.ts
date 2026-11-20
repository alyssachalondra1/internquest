// Runs before first paint so the correct theme is on <html> with no flash.
// Kept in a plain module (no "use client") so the server layout can inline it.
export const THEME_STORAGE_KEY = "sloe-theme"

// Default is the light lavender theme. "system" is only used when the visitor
// picks it in Settings, so a dark OS does not turn the product dark by surprise.
export const THEME_SCRIPT = `(function(){try{var v=localStorage.getItem('${THEME_STORAGE_KEY}');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=(v==='light'||v==='dark')?v:(v==='system'?(m?'dark':'light'):'light');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()`
