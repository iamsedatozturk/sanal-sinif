import React from 'react';
import { motion } from 'framer-motion';
import { FaUserTimes, FaExclamationTriangle } from 'react-icons/fa';

interface KickParticipantModalProps {
  participant: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (participantId: string) => void;
}

export const KickParticipantModal: React.FC<KickParticipantModalProps> = ({
  participant,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !participant) return null;

  const handleConfirm = () => {
    onConfirm(participant.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-md w-full mx-4"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-red-100 rounded-full mr-4">
              <FaExclamationTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Katılımcıyı Çıkar</h3>
              <p className="text-sm text-gray-600">Bu işlem geri alınamaz</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              <strong>"{participant.name}"</strong> adlı katılımcıyı sınıftan çıkarmak istediğinizden emin misiniz?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-yellow-600 mt-0.5 mr-2" size={16} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Dikkat:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Katılımcı anında sınıftan çıkarılacak</li>
                    <li>Tekrar katılım için davet gerekebilir</li>
                    <li>Katılım süresi kaydedilecek</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <FaUserTimes size={16} />
              <span>Çıkar</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};