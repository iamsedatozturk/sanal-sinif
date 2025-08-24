import React from 'react';
import { motion } from 'framer-motion';
import { FaExpand, FaTh, FaColumns, FaDesktop, FaChalkboardTeacher } from 'react-icons/fa';
import { VideoLayout } from '../types';

interface LayoutSelectorProps {
  currentLayout: VideoLayout;
  onLayoutChange: (layout: VideoLayout) => void;
  isOpen: boolean;
  onClose: () => void;
}

const layouts: VideoLayout[] = [
  {
    id: 'grid',
    name: 'Izgara Görünümü',
    type: 'grid',
    description: 'Tüm katılımcılar eşit boyutta görünür',
  },
  {
    id: 'sidebar',
    name: 'Yan Panel Görünümü',
    type: 'sidebar',
    description: 'Ana konuşmacı büyük, diğerleri yan panelde',
  },
  {
    id: 'teacher-focus',
    name: 'Öğretmen Odaklı',
    type: 'teacher-focus',
    description: 'Öğretmen tam ekranda görünür, öğrenciler küçük panelde',
  },
];

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  onLayoutChange,
  isOpen,
  onClose,
}) => {
  const getLayoutIcon = (type: string) => {
    switch (type) {
      case 'grid':
        return <FaTh size={24} />;
      case 'speaker':
        return <FaExpand size={24} />;
      case 'presentation':
        return <FaDesktop size={24} />;
      case 'sidebar':
        return <FaColumns size={24} />;
      case 'teacher-focus':
        // Sade, tek kişilik bir ikon (öğretmen)
        return <FaChalkboardTeacher size={26} />;
      default:
        return <FaTh size={24} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-2xl w-full mx-4"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Video Layout Seçin</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layouts.map((layout) => (
              <motion.button
                key={layout.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onLayoutChange(layout);
                  onClose();
                }}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  currentLayout.id === layout.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <div className={`p-3 rounded-full ${
                    currentLayout.id === layout.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getLayoutIcon(layout.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{layout.name}</h3>
                    <p className="text-sm text-gray-600">{layout.description}</p>
                  </div>
                </div>
                
                {/* Layout Preview */}
                <div className="bg-gray-100 rounded-lg p-4 h-24 flex items-center justify-center">
                  {layout.type === 'grid' && (
                    <div className="grid grid-cols-2 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-6 h-4 bg-blue-300 rounded"></div>
                      ))}
                    </div>
                  )}
                  {layout.type === 'sidebar' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-8 bg-blue-500 rounded"></div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="w-1 h-1 bg-blue-300 rounded"></div>
                        <div className="w-1 h-1 bg-blue-300 rounded"></div>
                        <div className="w-1 h-1 bg-blue-300 rounded"></div>
                        <div className="w-1 h-1 bg-blue-300 rounded"></div>
                        <div className="w-1 h-1 bg-blue-300 rounded"></div>
                        <div className="w-1 h-1 bg-blue-300 rounded"></div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};