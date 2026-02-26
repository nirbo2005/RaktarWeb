//raktar-frontend/src/components/Auth/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login as apiLogin } from "../../services/api";
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

const toast = MySwal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: "rgb(15, 23, 42)",
  color: "#fff",
});

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState({ felhasznalonev: "", jelszo: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reason = params.get("reason");

    if (
      reason === "session_expired" ||
      reason === "banned" ||
      reason === "session_lost"
    ) {
      const showNotice = async () => {
        const isBan = reason === "banned";
        await MySwal.fire({
          icon: isBan ? "error" : "warning",
          title: isBan
            ? t("auth.login.alerts.accessDenied")
            : t("auth.login.alerts.sessionLost"),
          text: isBan
            ? t("auth.login.alerts.bannedText")
            : t("auth.login.alerts.sessionExpiredText"),
          confirmButtonText: t("auth.login.alerts.gotIt"),
          allowOutsideClick: false,
          backdrop: true,
        });
        navigate("/login", { replace: true });
      };
      showNotice();
    }
  }, [location, navigate, t]);

  const fillDemoData = () => {
    setForm((prev) => ({
      ...prev,
      jelszo: "User!123",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiLogin(form.felhasznalonev, form.jelszo);
      login(data.access_token, data.user);

      setTimeout(() => {
        if (data.user.mustChangePassword) {
          navigate("/force-change-password", { replace: true });
        } else {
          toast.fire({
            icon: "success",
            title: t("auth.login.alerts.welcomeBack"),
          });
          navigate("/", { replace: true });
        }
      }, 100);
    } catch (err: any) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;

      if (status === 403) {
        setError(t("auth.login.alerts.bannedText"));
        MySwal.fire({
          icon: "error",
          title: t("auth.login.alerts.bannedTitle"),
          text: serverMessage || t("auth.login.alerts.bannedServerMsg"),
          footer: t("auth.login.alerts.bannedFooter"),
          confirmButtonText: t("auth.login.alerts.gotIt"),
        });
        return;
      }

      const errorMsg = serverMessage || t("auth.login.alerts.wrongCredentials");
      setError(errorMsg);
      MySwal.fire({
        icon: "error",
        title: t("auth.login.alerts.oops"),
        text: errorMsg,
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl w-full max-md border border-slate-200 dark:border-slate-800 transition-all text-left relative overflow-hidden">
        <button
          onClick={fillDemoData}
          type="button"
          className="absolute top-4 right-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border border-blue-100 dark:border-blue-800 shadow-sm"
        >
          {t("auth.login.fillDemo")}
        </button>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6 text-center italic uppercase tracking-tighter">
          {t("auth.login.title")}
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl py-3 mb-4 text-center px-4">
            <p className="text-red-600 dark:text-red-400 text-sm font-bold animate-pulse">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {t("auth.login.username")}
            </label>
            <input
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder={t("auth.login.usernamePlaceholder")}
              value={form.felhasznalonev}
              onChange={(e) =>
                setForm({ ...form, felhasznalonev: e.target.value })
              }
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-2 mr-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {t("auth.login.password")}
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
              >
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
            <input
              type="password"
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder={t("auth.login.passwordPlaceholder")}
              value={form.jelszo}
              onChange={(e) => setForm({ ...form, jelszo: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 uppercase tracking-widest text-xs mt-2 transition-all"
          >
            {t("auth.login.submit")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link
            to="/register"
            className="text-blue-600 dark:text-blue-400 font-black uppercase text-xs tracking-widest hover:text-blue-500 transition-colors"
          >
            {t("auth.login.registerNew")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
