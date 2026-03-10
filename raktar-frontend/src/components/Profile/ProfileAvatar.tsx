// raktar-frontend/src/components/Profile/ProfileAvatar.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { uploadAvatar, BASE_URL } from "../../services/api";
import { type User } from "../../types/User";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

interface ProfileAvatarProps {
  user: User;
  onUploadSuccess?: (updatedUser: User) => void;
  readonly?: boolean;
}

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans",
    confirmButton: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2",
  },
  buttonsStyling: false,
});

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  user, 
  onUploadSuccess, 
  readonly = false 
}) => {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!showModal || image) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => setImage(event.target?.result as string);
            reader.readAsDataURL(blob);
          }
        }
      }
    }
  }, [showModal, image]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const loadFromUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImage(imageUrlInput);
  };

  const createIdolCanvas = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(t("profile.avatar.urlError")));
    });

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context error");

    ctx.drawImage(
      img,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      }, "image/jpeg", 0.9);
    });
  };

  const handleUpload = async () => {
    if (!image || !croppedAreaPixels || !onUploadSuccess || !user.id) {
        return;
    }
    
    setIsUploading(true);
    try {
      const croppedImageBlob = await createIdolCanvas(image, croppedAreaPixels);
      const updatedUser = await uploadAvatar(user.id.toString(), croppedImageBlob);
      
      onUploadSuccess(updatedUser);
      closeModal();
    } catch (error: any) {
      MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setImage(null);
    setImageUrlInput("");
    setZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const modalContent = showModal ? createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={closeModal}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl transition-all" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
            {image ? t("profile.avatar.cropTitle") : t("profile.avatar.sourceTitle")}
          </h3>
          <button onClick={closeModal} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-xl">✕</button>
        </div>

        {!image ? (
          <div className="p-10 space-y-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">📁</span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("profile.avatar.uploadFile")}</span>
              </button>
              
              <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20">
                <span className="text-4xl opacity-50">📋</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("profile.avatar.pasteHint")}</span>
              </div>
            </div>

            <div className="relative group">
              <input 
                type="text" 
                placeholder={t("profile.avatar.urlPlaceholder")} 
                className="w-full pl-5 pr-14 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadFromUrl()}
              />
              <button 
                onClick={loadFromUrl}
                className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="relative h-96 w-full bg-slate-100 dark:bg-black">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>{t("profile.avatar.zoom")}</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range" min={1} max={3} step={0.1} value={zoom}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-4 font-black uppercase italic tracking-tighter">
                <button 
                  className="flex-1 py-4 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" 
                  onClick={() => setImage(null)}
                >
                  {t("common.back")}
                </button>
                <button 
                  className="flex-[2] py-4 px-4 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-50 transition-all"
                  onClick={handleUpload} disabled={isUploading}
                >
                  {isUploading ? t("profile.avatar.uploading") : t("profile.avatar.saveBtn")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div 
        className={`w-full h-full rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative transition-all ${!readonly ? 'cursor-pointer hover:ring-8 hover:ring-blue-500/20 group' : ''}`}
        onClick={() => !readonly && setShowModal(true)}
      >
        {user.avatarUrl ? (
          <img src={`${BASE_URL}${user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-3xl uppercase italic">
            {user.nev?.charAt(0) || user.felhasznalonev?.charAt(0)}
          </div>
        )}
        {!readonly && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
            <span className="bg-white/20 px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/30">{t("profile.avatar.modifyOverlay")}</span>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      {modalContent}
    </>
  );
};

export default ProfileAvatar;