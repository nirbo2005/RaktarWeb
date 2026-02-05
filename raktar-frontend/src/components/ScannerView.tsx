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
            if (decodedText.startsWith("raktarweb-id:")) {
              const id = decodedText.split(":")[1];
              await stopCamera();
              fetchProduct(Number(id));
            }
          },
          () => {}
        );
      } catch (err: any) {
        if (!err.toString().includes("is already scanning")) {
          setCamError("A kamera foglalt vagy nem elérhető.");
        }
      }
    };

    const timer = setTimeout(startCamera, 500);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try { await scannerRef.current.stop(); } catch (err) { console.warn(err); }
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
      <h1 className="text-3xl font-black mb-8 text-blue-400 tracking-tight text-center">📷 QR SZKENNER</h1>

      {camError && <div className="bg-red-500/20 border border-red-500 p-4 rounded-xl mb-4 text-center">{camError}</div>}

      {!product && !loading && (
        <div className="w-full max-w-sm rounded-3xl overflow-hidden border-4 border-blue-500/30 bg-black relative">
          <div id="reader" className="w-full"></div>
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
        </div>
      )}

      {loading && <div className="text-blue-400 animate-pulse font-bold">Adatok betöltése...</div>}

      {product && (
        <div className="w-full max-w-md bg-white text-gray-900 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
          <button 
            onClick={() => navigate(`/product/${product.id}`)}
            className="text-3xl font-black mb-4 text-blue-600 hover:text-blue-800 transition-colors text-left w-full block leading-tight"
          >
            {product.nev}
          </button>
          
          <div className="space-y-3 border-t pt-4">
            <p className="flex justify-between items-center text-lg">
              <span className="text-gray-400 font-medium">Pozíció</span> 
              <span className="font-black text-gray-800 bg-gray-100 px-3 py-1 rounded-lg uppercase">{product.parcella}</span>
            </p>
            <p className="flex justify-between items-center text-lg">
              <span className="text-gray-400 font-medium">Készlet</span> 
              <span className="font-black text-gray-800">{product.mennyiseg} db</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <button 
              onClick={() => navigate(`/product/${product.id}`)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
            >
              📄 Adatlap megnyitása
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              🔄 Új beolvasás
            </button>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/")} className="mt-12 text-gray-500 hover:text-white transition-colors flex items-center gap-2">
        <span>←</span> Vissza a listához
      </button>
    </div>
  );
}

export default ScannerView;