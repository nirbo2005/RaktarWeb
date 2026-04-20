// raktar-frontend/src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import hu from "./hu.json";
import en from "./en.json";
import de from "./de.json";
import fr from "./fr.json";
import es from "./es.json";
import ru from "./ru.json";
import zh from "./zh.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      hu: { translation: hu },
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      ru: { translation: ru },
      zh: { translation: zh },
    },
    fallbackLng: "hu",
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ["hu", "en", "de", "fr", "es", "ru", "zh"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
  });

export default i18n;