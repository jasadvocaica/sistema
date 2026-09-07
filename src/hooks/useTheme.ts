import { useEffect, useState, useCallback } from "react";

export type Tema = "light";
const KEY = "app:tema";

function aplicar(t: Tema) {
  const root = document.documentElement;
  root.classList.remove("dark");
}

function inicial(): Tema {
  try {
    localStorage.setItem(KEY, "light");
  } catch {}
  return "light";
}

/**
 * Mantém o tema claro como identidade visual única do sistema.
 */
export function useTheme() {
  const [tema, setTemaState] = useState<Tema>(() => {
    if (typeof window === "undefined") return "light";
    const t = inicial();
    aplicar(t);
    return t;
  });

  const setTema = useCallback((t: Tema) => {
    setTemaState(t);
    aplicar(t);
    try { localStorage.setItem(KEY, t); } catch {}
  }, []);

  useEffect(() => { aplicar(tema); }, [tema]);

  return { tema, setTema };
}

