import React, { useCallback, useRef } from 'react';
import type { UploadedImage } from '../types';
import Icon from './Icon';

interface ImageUploaderProps {
  title: string;
  icon: 'person' | 'outfit' | 'bottoms' | 'shoes';
  onImageUpload: (images: UploadedImage[] | null) => void;
  imagePreviewUrl: string | null;
  allowMultiple?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, icon, onImageUpload, imagePreviewUrl, allowMultiple = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      onImageUpload(null);
      return;
    }

    const filePromises = Array.from(files).map((file: File) => {
      return new Promise<UploadedImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve({
            file,
            previewUrl: result,
            base64,
            mimeType: file.type,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then(uploadedImages => {
        onImageUpload(uploadedImages);
      })
      .catch(error => {
        console.error("Error reading files:", error);
        onImageUpload(null);
      });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageUpload(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }
  
  const isAddButton = !title;

  return (
    <div className="w-full h-full">
      {title && (
         <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center">
            <Icon icon={icon} className="w-5 h-5 mr-2 text-indigo-400" />
            {title}
        </h3>
      )}
      <div
        className={`relative group w-full aspect-square bg-slate-800 border-2 border-dashed rounded-xl flex items-center justify-center text-center p-1 cursor-pointer transition-all duration-300 ${isAddButton ? 'border-slate-700 hover:border-indigo-500 hover:bg-slate-700/50 active:scale-95' : 'border-slate-600 hover:border-indigo-500'}`}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          multiple={allowMultiple}
        />
        {imagePreviewUrl ? (
          <>
            <img src={imagePreviewUrl} alt="Preview" className="object-contain h-full w-full rounded-lg animate-fade-in-scale" />
            <button 
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all duration-300 transform hover:scale-110 active:scale-95"
              aria-label="Remove image"
            >
              <Icon icon="close" className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" aria-hidden="true" />
          </>
        ) : isAddButton ? (
            <div className="text-slate-500 group-hover:text-indigo-400 transition-colors">
                 <Icon icon="plus" className="w-8 h-8"/>
            </div>
        ): (
          <div className="text-slate-500 pointer-events-none">
            <Icon icon="upload" className="w-10 h-10 mx-auto mb-2"/>
            <p className="font-semibold">{allowMultiple ? 'Click to add files' : 'Click to upload'}</p>
            <p className="text-xs mt-1">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;