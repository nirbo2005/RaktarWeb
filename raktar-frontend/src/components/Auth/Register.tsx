//raktar-frontend/src/components/Auth/Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../services/api";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import hu from "react-phone-input-2/lang/hu.json";
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
  timer: 3000,
  timerProgressBar: true,
  background: "rgb(15, 23, 42)",
  color: "#fff",
});

function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    nev: "",
    felhasznalonev: "",
    jelszo: "",
    email: "",
    telefonszam: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState("");

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "nev":
        if (!value) error = t("auth.register.validation.nameEmpty");
        else if (!/^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű\s-]+$/.test(value))
          error = t("auth.register.validation.nameNumbers");
        else if (value.trim().split(" ").length < 2)
          error = t("auth.register.validation.nameTwoWords");
        break;
      case "felhasznalonev":
        if (value.length < 4)
          error = t("auth.register.validation.usernameShort");
        break;
      case "email":
        if (!/\S+@\S+\.\S+/.test(value))
          error = t("auth.register.validation.emailInvalid");
        break;
      case "telefonszam":
        if (!value || value.length < 5)
          error = t("auth.register.validation.phoneRequired");
        break;
      case "jelszo":
        const passwordRegex =
          /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
        if (value.length < 8) {
          error = t("auth.register.validation.passwordShort");
        } else if (!passwordRegex.test(value)) {
          error = t("auth.register.validation.passwordWeak");
        }
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    const hasEmptyFields =
      !form.nev ||
      !form.felhasznalonev ||
      !form.email ||
      !form.jelszo ||
      !form.telefonszam;
    const hasErrors = Object.values(fieldErrors).some((err) => err !== "");

    if (hasEmptyFields || hasErrors) {
      setGeneralError(t("auth.register.alerts.fillAll"));
      return;
    }

    try {
      const submitData = {
        ...form,
        telefonszam: `+${form.telefonszam.replace(/\D/g, "")}`,
      };

      await register(submitData);

      await toast.fire({
        icon: "success",
        title: t("auth.register.alerts.successTitle"),
        text: t("auth.register.alerts.successText"),
      });

      navigate("/login");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        t("auth.register.alerts.errorTitle");
      setGeneralError(errorMsg);

      const lowerMsg = errorMsg.toLowerCase();

      if (lowerMsg.includes("e-mail") || lowerMsg.includes("email")) {
        setFieldErrors((p) => ({ ...p, email: errorMsg }));
      }
      if (
        lowerMsg.includes("felhasználónév") ||
        lowerMsg.includes("username")
      ) {
        setFieldErrors((p) => ({ ...p, felhasznalonev: errorMsg }));
      }
      if (
        lowerMsg.includes("telefonszám") ||
        lowerMsg.includes("telefon") ||
        lowerMsg.includes("phone")
      ) {
        setFieldErrors((p) => ({ ...p, telefonszam: errorMsg }));
      }

      MySwal.fire({
        icon: "error",
        title: t("auth.register.alerts.errorTitle"),
        text: errorMsg,
        confirmButtonText: t("common.yes"),
      });
    }
  };

  const inputStyle = (fieldName: string) => `
    w-full px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border rounded-2xl text-gray-900 dark:text-white 
    placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm
    ${fieldErrors[fieldName] ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-gray-300 dark:border-slate-700"}
  `;

  const labelStyle =
    "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left";
  const errorStyle =
    "text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter animate-in fade-in slide-in-from-left-1 text-left";

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 text-left transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-800 backdrop-blur-xl relative overflow-hidden">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-6 text-center italic uppercase tracking-tighter">
          {t("auth.register.title")}
        </h1>

        {generalError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-3 mb-4 text-center px-4 animate-in zoom-in-95">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">
              {generalError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelStyle}>{t("auth.register.fullName")}</label>
            <input
              className={inputStyle("nev")}
              placeholder={t("auth.register.fullNamePlaceholder")}
              value={form.nev}
              onChange={(e) => setForm({ ...form, nev: e.target.value })}
              onBlur={(e) => validateField("nev", e.target.value)}
              required
            />
            {fieldErrors.nev && (
              <p className={errorStyle}>❌ {fieldErrors.nev}</p>
            )}
          </div>

          <div>
            <label className={labelStyle}>{t("auth.register.username")}</label>
            <input
              className={inputStyle("felhasznalonev")}
              placeholder={t("auth.register.usernamePlaceholder")}
              value={form.felhasznalonev}
              onChange={(e) =>
                setForm({ ...form, felhasznalonev: e.target.value })
              }
              onBlur={(e) => validateField("felhasznalonev", e.target.value)}
              required
            />
            {fieldErrors.felhasznalonev && (
              <p className={errorStyle}>❌ {fieldErrors.felhasznalonev}</p>
            )}
          </div>

          <div>
            <label className={labelStyle}>{t("auth.register.email")}</label>
            <input
              type="email"
              className={inputStyle("email")}
              placeholder={t("auth.register.emailPlaceholder")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={(e) => validateField("email", e.target.value)}
              required
            />
            {fieldErrors.email && (
              <p className={errorStyle}>❌ {fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className={labelStyle}>{t("auth.register.phone")}</label>
            <PhoneInput
              country={"hu"}
              value={form.telefonszam}
              onChange={(phone) => setForm({ ...form, telefonszam: phone })}
              onBlur={() => validateField("telefonszam", form.telefonszam)}
              localization={hu}
              masks={{ hu: ".. ... ...." }}
              countryCodeEditable={false}
              enableSearch={true}
              containerClass="phone-container-reg"
              inputClass={`phone-input-reg ${fieldErrors.telefonszam ? "!border-red-500" : ""}`}
            />
            {fieldErrors.telefonszam && (
              <p className={errorStyle}>❌ {fieldErrors.telefonszam}</p>
            )}
          </div>

          <div>
            <label className={labelStyle}>{t("auth.register.password")}</label>
            <input
              type="password"
              className={inputStyle("jelszo")}
              placeholder={t("auth.register.passwordPlaceholder")}
              value={form.jelszo}
              onChange={(e) => setForm({ ...form, jelszo: e.target.value })}
              onBlur={(e) => validateField("jelszo", e.target.value)}
              required
            />
            {fieldErrors.jelszo && (
              <p className={errorStyle}>❌ {fieldErrors.jelszo}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-xs mt-4 disabled:opacity-50"
          >
            {t("auth.register.submit")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 font-black uppercase text-[10px] tracking-widest hover:underline"
          >
            {t("auth.register.backToLogin")}
          </Link>
        </div>
      </div>

      <style>{`
        .phone-container-reg { width: 100% !important; text-align: left; }
        .phone-input-reg { 
          width: 100% !important; height: 46px !important; border-radius: 1rem !important;
          border: 1px solid rgb(226 232 240) !important; background: rgb(249 250 251) !important;
          padding-left: 58px !important; font-size: 0.875rem !important; color: #111827 !important;
        }
        .dark .phone-input-reg { background: rgba(30, 41, 59, 0.5) !important; border-color: rgb(51 65 85) !important; color: white !important; }
        .phone-input-reg:focus { border-color: rgb(37 99 235) !important; }
        .dark .phone-dropdown-reg { background: rgb(15, 23, 42) !important; color: white !important; }
      `}</style>
    </div>
  );
}

export default Register;
