import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence, useInView, useScroll, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "react-i18next";
import { assetUrl, projectPrimaryImage } from "./lib/assets";
import { projectLocalizedTitle } from "./lib/projectText";
import SaleStatusPill from "./components/SaleStatusPill";
import ProjectGalleryOverlay from "./components/ProjectGalleryOverlay";
import { applySiteCopyFromApi } from "./lib/siteCopyApi";

gsap.registerPlugin(ScrollTrigger);

const API_BASE = import.meta.env.VITE_API_URL || "/api";

/** Optional profile URLs — set in `.env`. Use empty string to show “coming soon” (greyed icon, no link). */
function envSocialUrl(key, fallback) {
  const v = import.meta.env[key];
  if (v === "") return "";
  return v || fallback;
}
const SOCIAL_URLS = {
  facebook: envSocialUrl("VITE_SOCIAL_FACEBOOK_URL", "https://www.facebook.com/profile.php?id=61588933092891"),
  instagram: envSocialUrl("VITE_SOCIAL_INSTAGRAM_URL", "https://www.instagram.com/oakcaststudio/"),
  youtube: envSocialUrl("VITE_SOCIAL_YOUTUBE_URL", "https://www.youtube.com/@oakcaststudio")
};

/** Main hero / banner (full-bleed) */
const HERO_BANNER_SRC = "/images/3.jpg";

const SECTION_IDS = {
  hero: "hero",
  philosophy: "philosophy",
  materials: "materials",
  projects: "projects",
  faq: "faq",
  story: "story",
  contact: "contact"
};

/** Homepage gallery shows this many tiles; extras open behind “View all”. */
const HOMEPAGE_GALLERY_LIMIT = 8;

const galleryListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 }
  }
};

const galleryCardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 22 }
  }
};

const sectionMotion = {
  initial: { opacity: 0, y: 34 },
  whileInView: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 90, damping: 18, mass: 0.7 },
  viewport: { once: true, amount: 0.25 }
};

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const update = () => {
      const center = window.innerHeight * 0.35;
      let best = ids[0];
      let bestDist = Infinity;
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const mid = r.top + Math.min(r.height * 0.25, 120);
        const d = Math.abs(mid - center);
        if (d < bestDist) {
          bestDist = d;
          best = id;
        }
      });
      setActive(best);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function IconFacebook({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.988h-2.54v-2.875h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.875h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function IconInstagram({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z" />
    </svg>
  );
}

function IconYoutube({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconMenu({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}

function IconClose({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function SocialLinks({ className = "" }) {
  const { t } = useTranslation();
  const items = [
    { id: "facebook", url: SOCIAL_URLS.facebook, label: t("socialFacebook"), Icon: IconFacebook },
    { id: "instagram", url: SOCIAL_URLS.instagram, label: t("socialInstagram"), Icon: IconInstagram },
    { id: "youtube", url: SOCIAL_URLS.youtube, label: t("socialYoutube"), Icon: IconYoutube }
  ];
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-parchment transition hover:border-amber-warm/50 hover:bg-white/10";
  const disabled = "cursor-not-allowed opacity-45 hover:border-white/20 hover:bg-black/30";

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {items.map(({ id, url, label, Icon }) =>
        url ? (
          <a key={id} href={url} target="_blank" rel="noopener noreferrer" className={btn} aria-label={label}>
            <Icon className="h-5 w-5" />
          </a>
        ) : (
          <span
            key={id}
            className={`${btn} ${disabled}`}
            role="img"
            aria-label={`${label}: ${t("socialComingSoon")}`}
            title={t("socialComingSoon")}
          >
            <Icon className="h-5 w-5" />
          </span>
        )
      )}
    </div>
  );
}

function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-white/10 px-6 py-10 md:px-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <SocialLinks className="justify-center" />
        <p className="text-center text-sm text-parchment/75">{t("brand")}</p>
      </div>
    </footer>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-50 h-1 w-full origin-left bg-gradient-to-r from-amber-warm via-copper-400 to-walnut-400"
    />
  );
}

function TopNav() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const ids = useMemo(
    () => [
      SECTION_IDS.hero,
      SECTION_IDS.philosophy,
      SECTION_IDS.materials,
      SECTION_IDS.projects,
      SECTION_IDS.story,
      SECTION_IDS.faq,
      SECTION_IDS.contact
    ],
    []
  );
  const active = useActiveSection(ids);
  const current = i18n.language;

  const items = useMemo(
    () => [
      { id: SECTION_IDS.hero, label: t("navHome") },
      { id: SECTION_IDS.philosophy, label: t("navPhilosophy") },
      { id: SECTION_IDS.materials, label: t("navMaterials") },
      { id: SECTION_IDS.projects, label: t("navProjects") },
      { id: SECTION_IDS.story, label: t("navStory") },
      { id: SECTION_IDS.faq, label: t("navFaq") },
      { id: SECTION_IDS.contact, label: t("navContact") }
    ],
    [t]
  );

  const handleSectionNavigate = useCallback((id) => {
    scrollToId(id);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setMenuOpen(false);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="fixed left-0 right-0 top-2 z-40 px-3 pt-0.5 md:px-8">
      {/* Mobile: menu button + compact bar (no sideways scroll); desktop: horizontal pills. */}
      <div className="relative mx-auto max-w-6xl">
        <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/50 px-2 py-2 shadow-lg backdrop-blur-md md:gap-3 md:px-4 md:py-2.5">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-black/35 text-parchment transition hover:bg-white/10 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-section-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            <span className="sr-only">{menuOpen ? t("navMenuCloseAria") : t("navMenuOpenAria")}</span>
          </button>

          <nav
            aria-label="Section navigation"
            className="hidden min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden"
          >
            {items.map(({ id, label }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToId(id)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                    isActive
                      ? "bg-gradient-to-r from-copper-500 to-amber-warm text-charcoal shadow-sm"
                      : "text-parchment/90 hover:bg-white/10 hover:text-parchment"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 gap-1 rounded-full border border-white/20 bg-black/30 p-1" role="group" aria-label="Language">
            <button
              type="button"
              className={`flex h-9 min-w-[2.35rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold md:h-auto md:min-w-0 md:px-3 md:py-1 md:text-xs ${
                current.startsWith("en") ? "bg-amber-warm text-charcoal shadow-sm" : "text-parchment"
              }`}
              onClick={() => i18n.changeLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={`flex h-9 min-w-[2.35rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold md:h-auto md:min-w-0 md:px-3 md:py-1 md:text-xs ${
                current.startsWith("lt") ? "bg-amber-warm text-charcoal shadow-sm" : "text-parchment"
              }`}
              onClick={() => i18n.changeLanguage("lt")}
            >
              LT
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              key="mobile-section-menu"
              className="fixed inset-0 z-[35] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                aria-label={t("navMenuCloseAria")}
                onClick={() => setMenuOpen(false)}
              />
              <motion.nav
                id="mobile-section-nav"
                aria-label={t("navMobileSectionsLabel")}
                role="navigation"
                className="absolute left-3 right-3 top-[4.65rem] max-h-[min(72vh,26rem)] overflow-y-auto rounded-2xl border border-white/15 bg-charcoal/95 py-2 shadow-2xl ring-1 ring-black/35 backdrop-blur-md"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ul className="flex flex-col divide-y divide-white/10">
                  {items.map(({ id, label }) => {
                    const isActive = active === id;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => handleSectionNavigate(id)}
                          className={`w-full px-4 py-3.5 text-left text-sm font-semibold uppercase tracking-wider transition ${
                            isActive
                              ? "bg-gradient-to-r from-copper-500/25 to-amber-warm/20 text-parchment"
                              : "text-parchment/92 hover:bg-white/10"
                          }`}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useTranslation();
  const heroRef = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      if (bannerRef.current && heroRef.current) {
        gsap.to(bannerRef.current, {
          scale: 1.04,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }
    });

    return () => {
      mm.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      id={SECTION_IDS.hero}
      ref={heroRef}
      className="relative isolate flex min-h-screen scroll-mt-28 items-center overflow-hidden px-6 pt-[7.5rem] pb-16 md:scroll-mt-32 md:px-12 md:pt-28 md:pb-20"
    >
      <div className="absolute inset-0 overflow-hidden">
        {/* Mobile: widen + slide left (~20%) so framing shifts without exposing the charcoal gap on the right. */}
        <div className="absolute inset-y-0 left-0 h-full max-md:right-auto max-md:left-[-22%] max-md:w-[122%] md:right-0 md:left-0 md:w-auto">
          <img
            ref={bannerRef}
            src={HERO_BANNER_SRC}
            alt=""
            className="h-full w-full object-cover object-center"
            style={{ transformOrigin: "50% 50%" }}
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1510]/88 via-[#4a2e20]/70 to-[#6a4028]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/20 to-transparent" />
      </div>
      <div className="relative mx-auto w-full max-w-6xl py-28 md:py-36 lg:-translate-x-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
          className="mb-6 w-fit rounded-full border border-amber-warm/35 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.2em] text-parchment"
        >
          {t("heroBadge")}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 80, damping: 16 }}
          className="max-w-3xl text-5xl font-semibold leading-tight text-parchment drop-shadow-md md:text-7xl"
        >
          {t("heroTitle")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 95, damping: 20 }}
          className="mt-8 max-w-2xl text-base text-parchment/90 md:text-xl"
        >
          {t("heroSubtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, type: "spring", stiffness: 95, damping: 20 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <button
            type="button"
            onClick={() => scrollToId(SECTION_IDS.projects)}
            className="rounded-full bg-gradient-to-r from-copper-500 to-amber-warm px-8 py-3 text-sm font-semibold uppercase tracking-wider text-charcoal shadow-lg transition hover:from-copper-400 hover:to-amber-warm/90"
          >
            {t("heroCtaProjects")}
          </button>
          <button
            type="button"
            onClick={() => scrollToId(SECTION_IDS.contact)}
            className="rounded-full border border-white/25 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-parchment shadow-lg transition hover:bg-white/10"
          >
            {t("heroCtaQuote")}
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function Philosophy() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      id={SECTION_IDS.philosophy}
      ref={ref}
      className="scroll-mt-24 px-6 py-24 md:scroll-mt-28 md:px-12"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="rounded-3xl bg-white/12 p-8 shadow-soft ring-1 ring-copper-400/25 md:p-12"
        >
          <h2 className="text-3xl font-semibold text-parchment md:text-4xl">{t("philosophyTitle")}</h2>
          <p className="mt-5 text-lg leading-relaxed text-parchment/80">{t("philosophyText")}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 85, damping: 16, delay: 0.06 }}
          className="relative overflow-hidden rounded-3xl shadow-soft ring-1 ring-amber-warm/25"
        >
          <img
            src="/images/1.jpg"
            alt=""
            className="aspect-[4/5] w-full object-cover md:aspect-[3/4]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-charcoal/25 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}

function MaterialsSection() {
  const { t } = useTranslation();
  const cols = useMemo(
    () => [
      { title: t("materialsCol1Title"), text: t("materialsCol1Text") },
      { title: t("materialsCol2Title"), text: t("materialsCol2Text") },
      { title: t("materialsCol3Title"), text: t("materialsCol3Text") }
    ],
    [t]
  );

  return (
    <motion.section
      {...sectionMotion}
      id={SECTION_IDS.materials}
      className="scroll-mt-24 border-y border-white/10 bg-black/25 px-6 py-20 md:scroll-mt-28 md:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold text-parchment md:text-4xl">{t("materialsTitle")}</h2>
        <p className="mt-4 max-w-3xl text-lg text-parchment/80">{t("materialsIntro")}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cols.map((col, idx) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ type: "spring", stiffness: 100, damping: 18, delay: idx * 0.08 }}
              className="rounded-2xl bg-white/10 p-6 shadow-soft ring-1 ring-copper-400/20 md:p-8"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-warm/90">{col.title}</p>
              <p className="mt-3 text-parchment/80 leading-relaxed">{col.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function FaqSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const items = useMemo(
    () => [1, 2, 3, 4, 5, 6].map((i) => ({ i, q: t(`faq${i}Q`), a: t(`faq${i}A`) })),
    [t]
  );

  return (
    <motion.section
      {...sectionMotion}
      id={SECTION_IDS.faq}
      className="scroll-mt-24 px-6 py-20 md:scroll-mt-28 md:px-12"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-semibold text-parchment md:text-4xl">{t("faqTitle")}</h2>
        <div className="mt-10 space-y-3">
          {items.map(({ i, q, a }) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                layout
                className="overflow-hidden rounded-2xl border border-white/12 bg-white/6 ring-1 ring-white/5"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/5"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-parchment">{q}</span>
                  <span className="shrink-0 text-lg text-amber-warm/90">{isOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="overflow-hidden border-t border-white/10"
                    >
                      <p className="px-5 py-4 text-parchment/80 leading-relaxed">{a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function StickyQuoteCta() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const contactEl = () => document.getElementById(SECTION_IDS.contact);
    const onScroll = () => {
      const y = window.scrollY;
      const pastHero = y > window.innerHeight * 0.32;
      const el = contactEl();
      let contactInView = false;
      if (el) {
        const r = el.getBoundingClientRect();
        contactInView = r.top < window.innerHeight * 0.88;
      }
      setVisible(pastHero && !contactInView);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="sticky-quote"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed bottom-5 right-4 z-[35] md:bottom-8 md:right-8"
        >
          <button
            type="button"
            onClick={() => scrollToId(SECTION_IDS.contact)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-copper-500 to-amber-warm px-5 py-3 text-sm font-semibold uppercase tracking-wider text-charcoal shadow-xl shadow-black/40 ring-2 ring-black/30 transition hover:from-copper-400 hover:to-amber-warm/95"
          >
            {t("stickyCtaLabel")}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function GalleryProjectCard({ project, onSelect, enableLayout = true }) {
  const { i18n } = useTranslation();
  return (
    <motion.article
      layout={enableLayout}
      variants={enableLayout ? galleryCardVariants : undefined}
      whileHover={{ y: enableLayout ? -6 : -3, transition: { type: "spring", stiffness: 250, damping: 20 } }}
      className="cursor-pointer overflow-hidden rounded-2xl bg-white/12 shadow-soft ring-1 ring-copper-400/20"
      onClick={() => onSelect(project)}
    >
      <div className="relative">
        <img
          src={assetUrl(projectPrimaryImage(project))}
          alt={projectLocalizedTitle(project, i18n.language)}
          loading="lazy"
          className="h-64 w-full object-cover transition duration-500 hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          <SaleStatusPill saleStatus={project.sale_status} />
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-parchment/65">{project.category}</p>
        <h3 className="mt-2 text-xl font-medium text-parchment">{projectLocalizedTitle(project, i18n.language)}</h3>
      </div>
    </motion.article>
  );
}

function AllProjectsModal({ open, projects, onClose, onSelectProject }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="all-projects-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("projectsTitle")}
          className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-black/72 p-4 pt-24 pb-10 backdrop-blur-sm md:p-8 md:pt-28"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-6xl rounded-3xl border border-white/15 bg-charcoal/95 p-6 shadow-2xl ring-1 ring-black/40 md:p-10"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-2xl font-semibold text-parchment md:text-3xl">{t("projectsTitle")}</h2>
                <p className="mt-2 max-w-xl text-sm text-parchment/65">{t("projectsViewAllHint")}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/25 px-4 py-2 text-sm text-parchment hover:bg-white/10"
              >
                {t("projectsModalClose")}
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="text-center text-parchment/70">{t("projectsEmpty")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <GalleryProjectCard
                    key={project.id}
                    project={project}
                    enableLayout={false}
                    onSelect={(p) => {
                      onSelectProject(p);
                      onClose();
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Gallery({ projects, onSelect, onViewAll }) {
  const { t } = useTranslation();
  const preview = useMemo(() => projects.slice(0, HOMEPAGE_GALLERY_LIMIT), [projects]);
  const hasMore = projects.length > HOMEPAGE_GALLERY_LIMIT;

  return (
    <motion.section
      {...sectionMotion}
      id={SECTION_IDS.projects}
      className="scroll-mt-24 px-6 py-20 md:scroll-mt-28 md:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold text-parchment md:text-4xl">{t("projectsTitle")}</h2>
          {hasMore ? (
            <button
              type="button"
              onClick={onViewAll}
              className="rounded-full border border-amber-warm/40 bg-amber-warm/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-amber-warm hover:bg-amber-warm/20"
            >
              {t("projectsViewAll")}
            </button>
          ) : null}
        </div>
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-parchment/70">{t("projectsEmpty")}</p>
        ) : null}
        {preview.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 gap-5 justify-items-stretch sm:grid-cols-2 lg:grid-cols-3"
            variants={galleryListVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
          >
            {preview.map((project) => (
              <GalleryProjectCard key={project.id} project={project} onSelect={onSelect} />
            ))}
          </motion.div>
        ) : null}
        {projects.length === 0 ? null : hasMore ? (
          <button
            type="button"
            onClick={onViewAll}
            className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] py-4 text-sm font-semibold uppercase tracking-[0.12em] text-parchment hover:bg-white/[0.09] md:hidden"
          >
            {t("projectsViewAll")}
          </button>
        ) : null}
      </div>
    </motion.section>
  );
}

function AboutStory() {
  const { t } = useTranslation();
  const steps = useMemo(() => t("timeline", { returnObjects: true }), [t]);

  return (
    <motion.section
      {...sectionMotion}
      id={SECTION_IDS.story}
      className="scroll-mt-24 px-6 py-24 md:scroll-mt-28 md:px-12"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-3xl font-semibold text-parchment md:text-4xl">{t("storyTitle")}</h2>
        <div className="mb-12 overflow-hidden rounded-3xl shadow-soft ring-1 ring-copper-400/25">
          <img src="/images/2.jpg" alt="" className="aspect-[21/9] w-full object-cover md:aspect-[24/9]" loading="lazy" />
        </div>
        <div className="relative space-y-8 border-l border-amber-warm/25 pl-7">
          {steps.map((step, idx) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ type: "spring", stiffness: 95, damping: 18, delay: idx * 0.06 }}
              className="relative"
            >
              <span className="absolute -left-[36px] top-2 h-4 w-4 rounded-full bg-gradient-to-br from-amber-warm to-copper-500 shadow-md ring-2 ring-charcoal/40" />
              <h3 className="text-xl text-parchment">{step.title}</h3>
              <p className="mt-2 text-parchment/75">{step.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ customer_name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const validate = () => {
    const nextErrors = {};
    if (!form.customer_name.trim()) nextErrors.customer_name = t("nameRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = t("emailRequired");
    if (form.message.trim().length < 10) nextErrors.message = t("messageRequired");
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus({ state: "loading", message: t("sendingRequest") });

    try {
      await axios.post(`${API_BASE}/inquiries`, form);
      setStatus({ state: "success", message: t("successMessage") });
      setForm({ customer_name: "", email: "", message: "" });
    } catch (error) {
      setStatus({ state: "error", message: t("errorMessage") });
    }
  };

  return (
    <motion.section
      {...sectionMotion}
      id={SECTION_IDS.contact}
      className="scroll-mt-24 px-6 pb-28 pt-16 md:scroll-mt-28 md:px-12 md:pb-32"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-semibold text-parchment md:text-4xl">{t("contactTitle")}</h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-parchment/85">{t("contactLead")}</p>
        <div className="mt-8 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.12em] text-parchment/50">{t("contactSocialHeading")}</p>
          <SocialLinks />
        </div>
        <motion.form
          onSubmit={handleSubmit}
          layout
          className="glass mt-10 rounded-3xl border border-copper-400/20 p-6 shadow-soft md:p-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 95, damping: 20 }}
        >
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.18em] text-amber-warm/90">{t("contactFormCaption")}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <input
                className="w-full rounded-xl border border-white/25 bg-black/30 px-4 py-3 text-parchment outline-none focus:border-amber-warm"
                placeholder={t("yourName")}
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
              {errors.customer_name ? <p className="mt-1 text-sm text-red-300">{errors.customer_name}</p> : null}
            </div>
            <div>
              <input
                className="w-full rounded-xl border border-white/25 bg-black/30 px-4 py-3 text-parchment outline-none focus:border-amber-warm"
                placeholder={t("email")}
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              {errors.email ? <p className="mt-1 text-sm text-red-300">{errors.email}</p> : null}
            </div>
          </div>
          <div className="mt-4">
            <textarea
              rows="5"
              className="w-full rounded-xl border border-white/25 bg-black/30 px-4 py-3 text-parchment outline-none focus:border-amber-warm"
              placeholder={t("messagePlaceholder")}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
            {errors.message ? <p className="mt-1 text-sm text-red-300">{errors.message}</p> : null}
          </div>
          <button
            type="submit"
            className="mt-5 rounded-xl bg-gradient-to-r from-copper-500 to-amber-warm px-6 py-3 font-medium text-charcoal transition hover:from-copper-400 hover:to-amber-warm/95"
            disabled={status.state === "loading"}
          >
            {status.state === "loading" ? t("sending") : t("sendInquiry")}
          </button>
          <AnimatePresence mode="wait">
            {status.state !== "idle" ? (
              <motion.p
                key={status.state}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 130, damping: 20 }}
                className={`mt-4 text-sm ${
                  status.state === "success"
                    ? "text-emerald-300"
                    : status.state === "error"
                      ? "text-red-300"
                      : "text-parchment/75"
                }`}
              >
                {status.message}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </motion.form>
      </div>
    </motion.section>
  );
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [allProjectsOpen, setAllProjectsOpen] = useState(false);

  useEffect(() => {
    applySiteCopyFromApi(API_BASE);
  }, []);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${API_BASE}/projects`)
      .then((response) => {
        if (!mounted) return;
        const d = response.data;
        setProjects(Array.isArray(d) ? d : []);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-charcoal">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-copper-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-amber-warm/15 blur-3xl" />
      <TopNav />
      <ScrollProgress />
      <Hero />
      <Philosophy />
      <MaterialsSection />
      <Gallery projects={projects} onSelect={setActiveProject} onViewAll={() => setAllProjectsOpen(true)} />
      <AboutStory />
      <FaqSection />
      <Contact />
      <StickyQuoteCta />
      <AllProjectsModal
        open={allProjectsOpen}
        projects={projects}
        onClose={() => setAllProjectsOpen(false)}
        onSelectProject={setActiveProject}
      />
      <ProjectGalleryOverlay project={activeProject} onClose={() => setActiveProject(null)} />
      <SiteFooter />
    </div>
  );
}
