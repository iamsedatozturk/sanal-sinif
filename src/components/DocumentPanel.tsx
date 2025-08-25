import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaFile, FaUpload, FaDownload, FaTrash, FaEye, FaTimes, FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaPlay, FaStop } from 'react-icons/fa';
import { ClassDocument } from '../types/models';

interface DocumentPanelProps {
  documents: ClassDocument[];
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (file: File) => void;
  onDelete?: (documentId: string) => void;
  onView?: (document: ClassDocument) => void;
  isTeacher: boolean;
  onStartPresentation?: (document: ClassDocument) => void;
  onStopPresentation?: () => void;
  activePresentationId?: string;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  isOpen,
  onClose,
  onUpload,
  onDelete,
  onView,
  isTeacher,
  onStartPresentation,
  onStopPresentation,
  activePresentationId,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FaFilePdf className="text-red-500" />;
    if (type.includes('word') || type.includes('doc') || type.includes('presentation') || type.includes('powerpoint')) return <FaFileWord className="text-blue-500" />;
    if (type.includes('image')) return <FaFileImage className="text-green-500" />;
    return <FaFileAlt className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isPresentationFile = (type: string, name: string) => {
    return type.includes('presentation') || 
           type.includes('powerpoint') || 
           name.toLowerCase().includes('.ppt') || 
           name.toLowerCase().includes('.pptx') ||
           type.includes('pdf');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (!isTeacher || !onUpload) return;
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => onUpload(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTeacher || !onUpload) return;
    
    const files = Array.from(e.target.files || []);
    files.forEach(file => onUpload(file));
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaFile className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Sınıf Dokümanları</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {/* Upload Area (Teacher Only) */}
          {isTeacher && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
              <FaUpload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Doküman Yükle
              </p>
              <p className="text-gray-500 mb-4">
                Dosyaları buraya sürükleyin veya seçin
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dosya Seç
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.odp"
              />
            </div>
          )}

          {/* Documents List */}
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaFile size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Henüz doküman yüklenmemiş.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getFileIcon(doc.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{doc.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Yükleyen: {doc.uploadedBy}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView?.(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Görüntüle"
                    >
                      <FaEye size={16} />
                    </button>
                    
                    {/* Sunum Başlat/Durdur Butonu */}
                    {isTeacher && isPresentationFile(doc.type, doc.name) && (
                      <button
                        onClick={() => {
                          if (activePresentationId === doc.id) {
                            onStopPresentation?.();
                          } else {
                            onStartPresentation?.(doc);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          activePresentationId === doc.id
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={activePresentationId === doc.id ? 'Sunumu Durdur' : 'Sunum Başlat'}
                      >
                        {activePresentationId === doc.id ? <FaStop size={16} /> : <FaPlay size={16} />}
                      </button>
                    )}
                    
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="İndir"
                    >
                      <FaDownload size={16} />
                    </a>
                    
                    {isTeacher && (
                      <button
                        onClick={() => onDelete?.(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <FaTrash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};