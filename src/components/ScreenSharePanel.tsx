import React from 'react';
import { motion } from 'framer-motion';
import { FaDesktop, FaTimes, FaStop, FaPlay } from 'react-icons/fa';

interface ScreenSharePanelProps {
  isSharing: boolean;
  onStartShare: () => void;
  onStopShare: () => void;
  sharedScreen?: MediaStream;
  sharerName?: string;
}

export const ScreenSharePanel: React.FC<ScreenSharePanelProps> = ({
  isSharing,
  onStartShare,
  onStopShare,
  sharedScreen,
  sharerName,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaDesktop className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-800">Ekran Paylaşımı</h3>
        </div>
        
        {isSharing ? (
          <button
            onClick={onStopShare}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaStop size={16} />
            <span>Paylaşımı Durdur</span>
          </button>
        ) : (
          <button
            onClick={onStartShare}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlay size={16} />
            <span>Ekranı Paylaş</span>
          </button>
        )}
      </div>

      {sharedScreen && (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <video
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
            ref={(video) => {
              if (video && sharedScreen) {
                video.srcObject = sharedScreen;
              }
            }}
          />
          
          {sharerName && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {sharerName} ekranını paylaşıyor
            </div>
          )}
        </div>
      )}

      {isSharing && !sharedScreen && (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <FaDesktop size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Ekran paylaşımı başlatılıyor...</p>
        </div>
      )}
    </div>
  );
};