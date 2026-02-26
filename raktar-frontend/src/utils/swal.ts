//raktar-frontend/src/utils/swal.ts
import Swal from "sweetalert2";

export const MySwal = Swal.mixin({
  customClass: {
    confirmButton:
      "bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest mx-2 shadow-lg hover:bg-blue-500 transition-all",
    cancelButton:
      "bg-slate-500 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest mx-2 shadow-lg hover:bg-slate-400 transition-all",
    popup:
      "rounded-[2.5rem] dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl",
  },
  buttonsStyling: false,
});

export const toast = MySwal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});
