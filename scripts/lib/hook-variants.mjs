/** CLI twin of src/lib/hook-variants.ts */

function shorten(text, words) {
  return String(text).split(/\s+/).filter(Boolean).slice(0, words).join(" ");
}

function stripPunct(text) {
  return String(text).replace(/[¿?¡!.,;:]+$/g, "").trim();
}

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function generateHookVariants(seed = {}) {
  const raw = stripPunct(String(seed.title || seed.topic || "Tu idea").trim() || "Tu idea");
  const base = shorten(raw, 8);
  const lower = base.charAt(0).toLowerCase() + base.slice(1);

  const questionTitle = base.includes("?")
    ? base
    : shorten(`¿${capitalize(lower)}?`, 8);

  const boldTitle = shorten(
    /^(deja|para|no|nunca|deja de)/i.test(base) ? base : `Deja de ${lower}`,
    8
  );

  const curiosityTitle = shorten(`${capitalize(lower)} (casi nadie lo hace)`, 8);

  const bodyHint = stripPunct(String(seed.body || "").trim()) || "Desliza para ver cómo.";

  const specs = [
    { style: "question", title: questionTitle, body: bodyHint },
    { style: "bold", title: boldTitle, body: "Una verdad incómoda. Desliza." },
    {
      style: "stat",
      title: curiosityTitle,
      body: "El detalle que cambia el resultado.",
    },
  ];

  // Deduplicate titles deterministically with guaranteed termination
  const seen = new Set();
  return specs.map((s, index) => {
    let title = s.title;
    if (seen.has(title.toLowerCase())) {
      const suffixes = ["ahora", "hoy", "clave", "guía", "tip"];
      const baseWords = shorten(s.title, 6);
      let resolved = false;
      for (const suffix of suffixes) {
        const candidate = `${baseWords} (${suffix})`;
        if (!seen.has(candidate.toLowerCase())) {
          title = candidate;
          resolved = true;
          break;
        }
      }
      if (!resolved) {
        title = `${baseWords} #${index + 1}`;
      }
    }
    seen.add(title.toLowerCase());
    return {
      id: crypto.randomUUID(),
      style: s.style,
      title,
      body: s.body,
    };
  });
}
