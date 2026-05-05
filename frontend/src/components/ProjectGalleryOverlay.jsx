import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { assetUrl, projectImageUrls } from "../lib/assets";
import { projectLocalizedDescription, projectLocalizedTitle } from "../lib/projectText";
import SaleStatusPill from "./SaleStatusPill";

export default function ProjectGalleryOverlay({ project, onClose }) {
  const { i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const [fullscreenSrc, setFullscreenSrc] = useState(null);
  const [dir, setDir] = useState(0);

  const urls = useMemo(() => {
    if (!project) return [];
    return projectImageUrls(project).map((u) => assetUrl(u));
  }, [project]);

  useEffect(() => {
    if (!project) {
      setFullscreenSrc(null);
      return;
    }
    setIndex(0);
    setFullscreenSrc(null);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const onKey = (e) => {
      if (fullscreenSrc) {
        if (e.key === "Escape") {
          setFullscreenSrc(null);
          e.preventDefault();
        }
        return;
      }
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && urls.length) {
        setDir(-1);
        setIndex((i) => (i - 1 + urls.length) % urls.length);
        e.preventDefault();
      }
      if (e.key === "ArrowRight" && urls.length) {
        setDir(1);
        setIndex((i) => (i + 1) % urls.length);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, fullscreenSrc, urls.length, onClose]);

  const title = project ? projectLocalizedTitle(project, i18n.language) : "";
  const description = project ? projectLocalizedDescription(project, i18n.language) : "";
  const currentSrc = urls[index] || "";

  return (
    <>
      <AnimatePresence>
        {project ? (
          <motion.div
            key={project.id ?? "gallery"}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-charcoal/97 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 md:px-8">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-parchment/65">{project.category}</p>
                  <SaleStatusPill saleStatus={project.sale_status} />
                </div>
                <h2 className="mt-1 text-2xl font-semibold text-parchment md:text-3xl">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-white/20 px-4 py-2 text-sm text-parchment hover:bg-white/10"
              >
                ✕
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="relative flex min-h-[42vh] items-center justify-center px-2 py-6 md:min-h-[50vh] md:px-12">
                {urls.length === 0 ? (
                  <p className="text-parchment/60">No images.</p>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-4 text-2xl text-parchment backdrop-blur-sm hover:bg-black/70 md:left-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!urls.length) return;
                        setDir(-1);
                        setIndex((i) => (i - 1 + urls.length) % urls.length);
                      }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-4 text-2xl text-parchment backdrop-blur-sm hover:bg-black/70 md:right-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!urls.length) return;
                        setDir(1);
                        setIndex((i) => (i + 1) % urls.length);
                      }}
                    >
                      ›
                    </button>

                    <div className="relative mx-auto flex h-[42vh] w-full max-w-5xl cursor-zoom-in items-center justify-center md:h-[50vh]">
                      <AnimatePresence initial={false} custom={dir} mode="wait">
                        <motion.img
                          key={`${currentSrc}-${index}`}
                          src={currentSrc}
                          alt=""
                          custom={dir}
                          initial={{ opacity: 0, x: dir >= 0 ? 28 : -28 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: dir >= 0 ? -28 : 28 }}
                          transition={{ type: "spring", stiffness: 280, damping: 28 }}
                          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenSrc(currentSrc);
                          }}
                        />
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>

              {urls.length > 1 ? (
                <div className="flex justify-center gap-2 pb-4">
                  {urls.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to image ${i + 1}`}
                      className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-amber-warm" : "w-2.5 bg-white/25 hover:bg-white/40"}`}
                      onClick={() => {
                        setDir(i > index ? 1 : -1);
                        setIndex(i);
                      }}
                    />
                  ))}
                </div>
              ) : null}

              {urls.length > 1 ? (
                <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-4">
                  {urls.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-charcoal transition-all ${
                        i === index ? "ring-amber-warm" : "ring-transparent opacity-70 hover:opacity-100"
                      }`}
                      onClick={() => {
                        setDir(i > index ? 1 : -1);
                        setIndex(i);
                      }}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="border-t border-white/10 px-4 py-8 md:px-12">
                <p className="mx-auto max-w-3xl whitespace-pre-wrap text-lg leading-relaxed text-parchment/85">{description}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {fullscreenSrc ? (
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black p-4"
            onClick={() => setFullscreenSrc(null)}
          >
            <button
              type="button"
              aria-label="Close fullscreen"
              className="absolute right-4 top-4 z-10 rounded-full border border-white/30 bg-black/60 px-4 py-2 text-lg text-parchment backdrop-blur hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenSrc(null);
              }}
            >
              ✕
            </button>
            <motion.img
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              src={fullscreenSrc}
              alt=""
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
