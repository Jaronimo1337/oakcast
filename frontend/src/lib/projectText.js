/**
 * Project title in the active UI language, with sensible fallbacks.
 * Supports legacy `title` if present in older API payloads.
 */
export function projectLocalizedTitle(project, language) {
  if (!project) return "";
  const lang = (language || "en").toLowerCase();
  const isLt = lang === "lt" || lang.startsWith("lt-");
  const en = (project.title_en || "").trim();
  const lt = (project.title_lt || "").trim();
  const legacy = (project.title || "").trim();
  if (isLt) {
    return lt || en || legacy;
  }
  return en || lt || legacy;
}

/**
 * Project description in the active UI language, with sensible fallbacks.
 * Supports legacy `description` if present in older API payloads.
 */
export function projectLocalizedDescription(project, language) {
  if (!project) return "";
  const lang = (language || "en").toLowerCase();
  const isLt = lang === "lt" || lang.startsWith("lt-");
  const en = (project.description_en || "").trim();
  const lt = (project.description_lt || "").trim();
  const legacy = (project.description || "").trim();
  if (isLt) {
    return lt || en || legacy;
  }
  return en || lt || legacy;
}
