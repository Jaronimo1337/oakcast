/** API origin without trailing /api — used for uploaded files under /uploads */
export function getAssetBase() {
  const api = import.meta.env.VITE_API_URL || "/api";
  return api.replace(/\/api\/?$/, "") || "";
}

/** Absolute URL for a stored upload path like /uploads/projects/x.jpg */
export function assetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = getAssetBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function projectImageUrls(project) {
  if (!project) return [];
  const raw = project.image_urls;
  let list = [];
  if (Array.isArray(raw)) list = raw.filter(Boolean);
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed.filter(Boolean);
    } catch {
      list = [];
    }
  }
  if (list.length === 0 && project.image_url) list = [project.image_url];
  return list;
}

export function projectPrimaryImage(project) {
  const urls = projectImageUrls(project);
  return urls[0] || "";
}
