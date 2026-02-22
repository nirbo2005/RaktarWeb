import { useEffect, useState, useRef, useMemo } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getProductById } from "../../services/api";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/Product";
import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
  },
  buttonsStyling: false,
});

function ScannerView() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  
  const stockSummary = useMemo(() => {
    if (!product?.batches || product.batches.length === 0) return { total: 0, locations: "Nincs készleten" };
    
    const total = product.batches.reduce((sum, b) => sum + (b.mennyiseg || 0), 0);
    const uniqueLocations = Array.from(new Set(product.batches.map(b => b.parcella))).filter(Boolean);
    
    return {
      total,
      locations: uniqueLocations.length > 0 ? uniqueLocations.join(", ") : "Ismeretlen hely"
    };
  }, [product]);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    const startCamera = async () => {
      try {
        await scannerRef.current?.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {},
        );
      } catch (err: any) {
        if (!err.toString().includes("is already scanning")) {
          setCamError("A kamera nem elérhető vagy le van tiltva.");
        }
      }
    };

    const timer = setTimeout(startCamera, 500);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    let id: string;
    if (decodedText.includes("/product/")) {
      id = decodedText.split("/product/")[1];
    } else if (decodedText.includes(":")) {
      id = decodedText.split(":")[1];
    } else {
      id = decodedText;
    }

    const numericId = Number(id);
    if (!isNaN(numericId)) {
      await stopCamera();
      fetchProduct(numericId);
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Érvénytelen kód',
        text: 'Ez nem egy érvényes RaktárWeb QR kód!',
      });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("Hiba a kamera leállításakor:", err);
      }
    }
  };

  const fetchProduct = async (id: number) => {
    setLoading(true);
    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (err) {
      MySwal.fire({
        icon: 'error',
        title: 'Nincs találat',
        text: 'A keresett termék nem található a rendszerben.',
      }).then(() => window.location.reload());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center transition-colors duration-300 text-left">
      <h1 className="text-3xl font-black mb-8 text-slate-900 dark:text-blue-400 tracking-tighter text-center italic uppercase">
        📷 QR SZKENNER
      </h1>

      <div
        id="reader"
        className={`w-full max-w-sm rounded-[3rem] overflow-hidden border-4 border-slate-200 dark:border-blue-500/30 bg-black relative shadow-2xl transition-all
        ${!product && !loading && !camError ? "block" : "hidden"}`}
      >
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
      </div>

      {camError && !product && !loading && (
        <div className="w-full max-w-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-6 rounded-[2.5rem] text-center">
          <p className="text-red-600 dark:text-red-400 font-black uppercase text-xs tracking-widest">{camError}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-blue-600 dark:text-blue-400 font-black tracking-widest uppercase text-[10px] animate-pulse">Keresés...</div>
        </div>
      )}

      {product && (
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 leading-tight italic uppercase tracking-tighter">
              {product.nev}
            </h2>
            <span className="text-slate-300 dark:text-slate-600 font-mono text-xs font-bold">#{product.id}</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest mb-6 pb-4 border-b border-slate-50 dark:border-slate-800">
            {product.gyarto} • {product.kategoria}
          </p>

          <div className="space-y-6 mb-10">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Helyszínek</span>
              <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-xl uppercase text-sm border border-blue-100 dark:border-blue-500/20 truncate max-w-[200px]">
                {stockSummary.locations}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Összkészlet</span>
              <span className={`text-2xl font-black ${stockSummary.total <= product.minimumKeszlet ? 'text-red-500' : 'dark:text-white'}`}>
                {stockSummary.total} db
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => navigate(`/product/${product.id}`)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-xs">Termék adatlap</button>
            <button onClick={() => window.location.reload()} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-3 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase text-[9px] tracking-[0.2em]">Új szkennelés</button>
          </div>
        </div>
      )}

      {!loading && (
        <button onClick={() => navigate("/")} className="mt-12 text-slate-400 hover:text-blue-500 transition-colors font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
          ← Vissza a menübe
        </button>
      )}
    </div>
  );
}

export default ScannerView;