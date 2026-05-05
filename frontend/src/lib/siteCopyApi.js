import axios from "axios";
import i18n from "../i18n";
import { siteCopyDefaults } from "./siteCopyDefaults";

function cloneSiteCopy() {
  return {
    en: JSON.parse(JSON.stringify(siteCopyDefaults.en)),
    lt: JSON.parse(JSON.stringify(siteCopyDefaults.lt))
  };
}

/** Merge server JSON over bundled defaults so new keys appear after deploy. */
export function mergeSiteCopyWithDefaults(server) {
  const base = cloneSiteCopy();
  if (!server?.en || !server?.lt) return base;
  const mergeLng = (defaults, patch) => {
    const out = { ...defaults, ...patch };
    if (!Array.isArray(patch.timeline) || patch.timeline.length !== 4) {
      out.timeline = defaults.timeline;
    } else {
      out.timeline = patch.timeline.map((row, i) => ({
        title: typeof row?.title === "string" ? row.title : defaults.timeline[i]?.title ?? "",
        text: typeof row?.text === "string" ? row.text : defaults.timeline[i]?.text ?? ""
      }));
    }
    return out;
  };
  return {
    en: mergeLng(base.en, server.en),
    lt: mergeLng(base.lt, server.lt)
  };
}

/**
 * Load site copy from API and merge into i18n (deep). Falls back to bundled defaults on failure.
 */
export async function applySiteCopyFromApi(apiBase) {
  const base = apiBase.replace(/\/$/, "");
  try {
    const { data } = await axios.get(`${base}/site-copy`);
    if (data?.en && typeof data.en === "object" && data?.lt && typeof data.lt === "object") {
      const merged = mergeSiteCopyWithDefaults(data);
      i18n.addResourceBundle("en", "translation", merged.en, true, true);
      i18n.addResourceBundle("lt", "translation", merged.lt, true, true);
    }
  } catch {
    /* Bundled defaults from i18n init stay in place */
  }
}
