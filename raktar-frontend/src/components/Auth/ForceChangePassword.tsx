//raktar-frontend/src/components/Auth/ForceChangePassword.tsx
import { useState } from "react";
import { forceChangePassword } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const MySwal = Swal.mixin({
  customClass: {
    popup:
      "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans",
    confirmButton:
      "bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2",
  },
  buttonsStyling: false,
});

function ForceChangePassword() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    ideiglenesJelszo: "",
    ujJelszo: "",
    ujJelszoUjra: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError(t("auth.forceChange.alerts.missingSession"));
      return;
    }

    const passwordRegex =
      /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
    if (form.ujJelszo.length < 8) {
      setError(t("auth.forceChange.alerts.shortPassword"));
      return;
    }
    if (!passwordRegex.test(form.ujJelszo)) {
      setError(t("auth.forceChange.alerts.weakPassword"));
      return;
    }

    if (form.ujJelszo !== form.ujJelszoUjra) {
      setError(t("auth.forceChange.alerts.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await forceChangePassword({
        felhasznalonev: user.felhasznalonev,
        ideiglenesJelszo: form.ideiglenesJelszo,
        ujJelszo: form.ujJelszo,
      });

      MySwal.fire({
        icon: "success",
        title: t("auth.forceChange.alerts.successTitle"),
        text: t("auth.forceChange.alerts.successText"),
        confirmButtonText: t("auth.forceChange.alerts.goToLogin"),
        allowOutsideClick: false,
      }).then(() => {
        localStorage.clear();
        window.location.href = "/login";
      });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        t("auth.forceChange.alerts.updateError");
      setError(errorMsg);

      MySwal.fire({
        icon: "error",
        title: t("auth.forceChange.alerts.errorTitle"),
        text: errorMsg,
        confirmButtonText: t("auth.forceChange.alerts.understand"),
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = `w-full px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm`;
  const labelStyle =
    "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-red-500/20 transition-colors relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-red-500"></div>

        <h1
          className="text-3xl font-black text-gray-800 dark:text-white mb-2 text-center italic uppercase tracking-tighter mt-2"
          dangerouslySetInnerHTML={{ __html: t("auth.forceChange.title") }}
        ></h1>
        <p className="text-slate-400 text-xs text-center font-bold mb-8 uppercase tracking-widest leading-relaxed">
          {t("auth.forceChange.subtitle")}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-3 mb-6 text-center px-4 animate-in zoom-in-95">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelStyle}>
              {t("auth.forceChange.tempPassword")}
            </label>
            <input
              type="password"
              className={inputStyle}
              placeholder={t("auth.forceChange.tempPlaceholder")}
              value={form.ideiglenesJelszo}
              onChange={(e) =>
                setForm({ ...form, ideiglenesJelszo: e.target.value })
              }
              required
            />
          </div>

          <div className="pt-2">
            <label className={labelStyle}>
              {t("auth.forceChange.newPassword")}
            </label>
            <input
              type="password"
              className={inputStyle}
              placeholder={t("auth.forceChange.newPlaceholder")}
              value={form.ujJelszo}
              onChange={(e) => setForm({ ...form, ujJelszo: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className={labelStyle}>
              {t("auth.forceChange.newPasswordAgain")}
            </label>
            <input
              type="password"
              className={inputStyle}
              placeholder={t("auth.forceChange.newAgainPlaceholder")}
              value={form.ujJelszoUjra}
              onChange={(e) =>
                setForm({ ...form, ujJelszoUjra: e.target.value })
              }
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 active:scale-95 uppercase tracking-widest text-xs mt-6 disabled:opacity-50"
          >
            {loading
              ? t("auth.forceChange.updating")
              : t("auth.forceChange.submit")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
          <button
            onClick={() => logout()}
            className="text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-all"
          >
            {t("auth.forceChange.logoutAndCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForceChangePassword;
