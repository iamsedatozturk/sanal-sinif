import React, { useEffect, useState } from 'react';
import { FaClock, FaUsers } from 'react-icons/fa';
import { AttendanceRecord } from '../types';

interface AttendancePanelProps {
  attendanceRecords: AttendanceRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export const AttendancePanel: React.FC<AttendancePanelProps> = ({
  attendanceRecords,
  isOpen,
  onClose,
}) => {
  // Anlık süre güncellemesi için state ve timer
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 60000); // her dakika
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getLiveDuration = (joinTime: string, nowValue: number) => {
    const nowDate = new Date(nowValue);
    const join = new Date(joinTime);
    const diffMs = nowDate.getTime() - join.getTime();
    const mins = Math.floor(diffMs / 60000);
    return formatDuration(mins);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaUsers className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Katılım Raporu</h2>
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
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaClock size={48} className="mx-auto mb-4" />
              <p>Henüz katılım kaydı bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Öğrenci Adı
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Giriş Saati
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Çıkış Saati
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Toplam Süre
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-gray-800">
                        {record.studentName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-600">
                        {formatTime(record.joinTime)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-600">
                        {record.leaveTime ? formatTime(record.leaveTime) : 'Devam ediyor'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-800 font-semibold">
                        {(() => {
                          // Her zaman canlı süreyi hesapla, çıkış varsa oraya kadar, yoksa şimdiye kadar
                          const endTime = record.leaveTime ? new Date(record.leaveTime).getTime() : now;
                          const join = new Date(record.joinTime).getTime();
                          const mins = Math.floor((endTime - join) / 60000);
                          return formatDuration(mins);
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};