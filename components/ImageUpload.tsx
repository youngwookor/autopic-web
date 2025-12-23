'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string | null;
  onChange: (base64: string | null, file: File | null) => void;
  disabled?: boolean;
  className?: string;
}

export default function ImageUpload({ value, onChange, disabled, className }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        onChange(base64, file);
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    disabled,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-xl transition-all cursor-pointer',
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      
      {value ? (
        <div className="relative aspect-square">
          <img
            src={`data:image/jpeg;base64,${value}`}
            alt="업로드된 이미지"
            className="w-full h-full object-contain rounded-lg"
          />
          {!disabled && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-blue-500" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <p className="text-lg font-medium text-gray-700 mb-1">
            {isDragActive ? '여기에 놓으세요' : '이미지 업로드'}
          </p>
          <p className="text-sm text-gray-500 text-center">
            드래그 앤 드롭 또는 클릭하여 선택
          </p>
          <p className="text-xs text-gray-400 mt-2">
            PNG, JPG, WEBP (최대 10MB)
          </p>
        </div>
      )}
    </div>
  );
}
