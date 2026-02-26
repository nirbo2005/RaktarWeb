//raktar-frontend/src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// JSON importok
import huTranslation from "./hu.json";
import enTranslation from "./en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      hu: {
        translation: huTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
    fallbackLng: "hu",
    debug: true, // Hagyd bekapcsolva, amíg meg nem javul!
    interpolation: {
      escapeValue: false,
    },
    // Kényszerítsük a tiszta kódokat
    supportedLngs: ["hu", "en"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
  });

export default i18n;
