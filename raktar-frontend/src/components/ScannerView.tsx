import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getProductById } from "../services/api";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types/Product";

function ScannerView() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
          () => {}
        );
      } catch (err: any) {
        // Ha nem sikerül a kamera indítása (pl. nincs kamera), beállítjuk a hibát
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
    if (decodedText.startsWith("raktarweb-id:")) {
      const id = decodedText.split(":")[1];
      await stopCamera();
      fetchProduct(Number(id));
    } else {
      alert("Ez nem egy érvényes RaktárWeb QR kód!");
    }
  };

  // Fájlfeltöltés kezelése laptophoz vagy hibás kamerához
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setLoading(true);
    try {
      // A html5-qrcode beépített fájl-szkennere
      const decodedText = await scannerRef.current.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      console.error(err);
      alert("Nem sikerült QR-kódot beolvasni erről a képről. Próbálkozz másikkal!");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
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
      alert("Termék nem található!");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex flex-col items-center justify-center text-white font-sans">
      <h1 className="text-3xl font-black mb-8 text-blue-400 tracking-tight text-center italic uppercase">
        📷 QR SZKENNER
      </h1>

      {/* FONTOS: A #reader div-nek mindig léteznie kell a DOM-ban a scanFile() miatt is.
          Csak akkor rejtjük el CSS-sel, ha már megvan a termék vagy töltünk.
      */}
      <div 
        id="reader" 
        className={`w-full max-w-sm rounded-[3rem] overflow-hidden border-4 border-blue-500/30 bg-black relative shadow-2xl 
        ${(!product && !loading && !camError) ? 'block' : 'hidden'}`}
      >
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
      </div>

      {/* Kamera hiba esetén megjelenő fájlfeltöltő felület */}
      {camError && !product && !loading && (
        <div className="w-full max-w-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6 text-center text-red-400 font-medium text-sm">
            {camError}
          </div>
          
          <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-blue-500/40 rounded-[2.5rem] bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <span className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">📂</span>
              <p className="text-sm font-bold text-blue-400 uppercase tracking-[0.2em]">Feltöltés és szkennelés</p>
              <p className="text-[10px] text-slate-500 mt-2 font-bold italic text-center px-4">Kattints ide a QR-kódot tartalmazó kép kiválasztásához</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* Töltési állapot */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-blue-400 animate-pulse font-black tracking-widest uppercase text-xs">Feldolgozás...</div>
        </div>
      )}

      {/* Találat megjelenítése */}
      {product && (
        <div className="w-full max-w-md bg-white text-gray-900 rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
          <h2 className="text-3xl font-black mb-2 text-blue-600 leading-tight">
            {product.nev}
          </h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-6">
            Gyártó: {product.gyarto}
          </p>
          
          <div className="space-y-4 border-y py-6 border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Helyszín</span> 
              <span className="font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl uppercase text-lg">
                {product.parcella}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Készlet</span> 
              <span className="font-black text-gray-800 text-xl">{product.mennyiseg} db</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <button 
              onClick={() => navigate(`/product/${product.id}`)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 hover:bg-blue-700 transition-all uppercase tracking-widest text-sm"
            >
              Adatlap megtekintése
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all uppercase text-[10px]"
            >
              🔄 Új beolvasás
            </button>
          </div>
        </div>
      )}

      {/* Navigáció */}
      <button 
        onClick={() => navigate("/")} 
        className="mt-12 text-gray-500 hover:text-white transition-colors font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Vissza a főoldalra
      </button>
    </div>
  );
}

export default ScannerView;