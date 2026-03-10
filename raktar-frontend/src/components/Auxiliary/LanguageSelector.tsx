import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { code: "hu", flag: "🇭🇺" },
  { code: "en", flag: "🇺🇸" },
  { code: "de", flag: "🇩🇪" },
  { code: "it", flag: "🇮🇹" },
  { code: "fr", flag: "🇫🇷" },
  { code: "es", flag: "🇪🇸" },
  { code: "pt", flag: "🇵🇹" },
  { code: "pl", flag: "🇵🇱" },
  { code: "ru", flag: "🇷🇺" },
  { code: "ko", flag: "🇰🇷" },
  { code: "zh", flag: "🇨🇳" },
  { code: "ja", flag: "🇯🇵" },
];

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  const currentLang = languages.find((l) => l.code === i18n.language.split("-")[0]) || languages[0];

  return (
    <div className="relative flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[80] bg-transparent"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 right-0 z-[90] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-w-[180px] p-2 flex flex-col gap-1"
            >
              <div className="px-3 py-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t("common.languageSelector")}
                </span>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ x: 5, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors w-full text-left
                      ${i18n.language.startsWith(lang.code) 
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800" 
                        : "text-slate-700 dark:text-slate-300 border border-transparent"
                      }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-bold whitespace-nowrap">
                      {t(`languages.${lang.code}`)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`z-[100] w-14 h-14 rounded-2xl shadow-xl border-2 flex items-center justify-center text-3xl transition-all active:scale-90
          ${isOpen 
            ? "bg-blue-600 border-blue-400 scale-105" 
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 shadow-blue-500/10 text-slate-900 dark:text-white"
          }`}
      >
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          {isOpen ? "✕" : currentLang.flag}
        </motion.span>
      </button>
    </div>
  );
};

export default LanguageSelector;