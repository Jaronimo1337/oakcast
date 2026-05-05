import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { siteCopyDefaults } from "./lib/siteCopyDefaults";

const resources = {
  en: { translation: siteCopyDefaults.en },
  lt: { translation: siteCopyDefaults.lt }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
