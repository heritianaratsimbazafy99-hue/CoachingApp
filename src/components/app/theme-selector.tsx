"use client";

import { Check, ChevronDown, Palette } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  defaultInterfaceTheme,
  interfaceThemes,
  interfaceThemeStorageKey,
  isInterfaceThemeId,
  type InterfaceThemeId,
} from "@/lib/interface-theme";
import { cn } from "@/utils/cn";

const themeChangeEvent = "coaching-platform-interface-theme-change";

function applyInterfaceTheme(theme: InterfaceThemeId) {
  document.documentElement.dataset.interfaceTheme = theme;
}

function getStoredTheme(): InterfaceThemeId {
  if (typeof window === "undefined") {
    return defaultInterfaceTheme;
  }

  const storedTheme = window.localStorage.getItem(interfaceThemeStorageKey);

  return isInterfaceThemeId(storedTheme) ? storedTheme : defaultInterfaceTheme;
}

function subscribeToThemeChanges(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEvent, callback);
  };
}

function setStoredTheme(theme: InterfaceThemeId) {
  window.localStorage.setItem(interfaceThemeStorageKey, theme);
  applyInterfaceTheme(theme);
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTheme = useSyncExternalStore<InterfaceThemeId>(
    subscribeToThemeChanges,
    getStoredTheme,
    () => defaultInterfaceTheme,
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const selected =
    interfaceThemes.find((theme) => theme.id === selectedTheme) ??
    interfaceThemes[0];

  useEffect(() => {
    applyInterfaceTheme(selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Choisir le theme d'interface"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-950/[0.03] transition hover:border-sky-200 hover:text-sky-800 focus-visible:outline-sky-600 sm:px-3"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Palette className="h-4 w-4 text-sky-600" />
        <span className="hidden items-center -space-x-1 sm:flex">
          {selected.swatches.map((swatch) => (
            <span
              className="h-3.5 w-3.5 rounded-full border border-white shadow-sm shadow-slate-950/10 ring-1 ring-slate-200/70"
              key={swatch}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </span>
        <span className="hidden xl:inline">{selected.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition",
            isOpen ? "rotate-180" : null,
          )}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white/96 p-2 shadow-xl shadow-slate-950/12 ring-1 ring-white backdrop-blur-xl">
          <div className="px-2 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Theme
            </p>
          </div>
          <div className="grid gap-1">
            {interfaceThemes.map((theme) => {
              const isSelected = theme.id === selectedTheme;

              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition",
                    isSelected
                      ? "border-sky-200 bg-sky-50 text-slate-950 shadow-sm shadow-sky-950/[0.04]"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                  )}
                  key={theme.id}
                  onClick={() => {
                    setStoredTheme(theme.id);
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <span className="flex shrink-0 -space-x-1">
                    {theme.swatches.map((swatch) => (
                      <span
                        className="h-5 w-5 rounded-full border border-white shadow-sm shadow-slate-950/10 ring-1 ring-slate-200/70"
                        key={swatch}
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {theme.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                      {theme.description}
                    </span>
                  </span>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-sky-700" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
