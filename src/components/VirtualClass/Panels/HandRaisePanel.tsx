import React from 'react';
import { FaHandPaper, FaTimes, FaCheck } from 'react-icons/fa';
import { HandRaise } from '../../../types/models';

interface HandRaisePanelProps {
  handRaises: HandRaise[];
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (handRaiseId: string) => void;
  onDismiss?: (handRaiseId: string) => void;
  isTeacher: boolean;
}

export const HandRaisePanel: React.FC<HandRaisePanelProps> = ({
  handRaises,
  isOpen,
  onClose,
  onApprove,
  onDismiss,
  isTeacher,
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Az önce';
    if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} saat önce`;
  };

  if (!isOpen) return null;

  const activeHandRaises = handRaises.filter(hr => hr.isActive);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaHandPaper className="text-yellow-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">
                Parmak Kaldıranlar ({activeHandRaises.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {activeHandRaises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaHandPaper size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Şu anda parmak kaldıran öğrenci bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeHandRaises.map((handRaise) => (
                <div
                  key={handRaise.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FaHandPaper className="text-yellow-600" size={20} />
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {handRaise.studentName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatTime(handRaise.timestamp)} • {getTimeSince(handRaise.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {isTeacher && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onApprove?.(handRaise.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <FaCheck size={14} />
                        <span>Onayla</span>
                      </button>
                      <button
                        onClick={() => onDismiss?.(handRaise.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <FaTimes size={14} />
                        <span>Reddet</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};