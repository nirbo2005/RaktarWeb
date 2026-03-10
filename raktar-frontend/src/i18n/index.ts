//raktar-frontend/src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// JSON importok (feltételezve, hogy a fájlok léteznek a mappában)
import hu from "./hu.json";
import en from "./en.json";
import de from "./de.json";
import it from "./it.json";
import fr from "./fr.json";
import es from "./es.json";
import pt from "./pt.json";
import pl from "./pl.json";
import ru from "./ru.json";
import ko from "./ko.json";
import zh from "./zh.json";
import ja from "./ja.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      hu: { translation: hu },
      en: { translation: en },
      de: { translation: de },
      it: { translation: it },
      fr: { translation: fr },
      es: { translation: es },
      pt: { translation: pt },
      pl: { translation: pl },
      ru: { translation: ru },
      ko: { translation: ko },
      zh: { translation: zh },
      ja: { translation: ja },
    },
    fallbackLng: "hu",
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ["hu", "en", "de", "it", "fr", "es", "pt", "pl", "ru", "ko", "zh", "ja"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
  });

export default i18n;