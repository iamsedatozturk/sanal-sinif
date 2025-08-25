import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaUsers, FaClock, FaPlay, FaStop } from 'react-icons/fa';
import { ClassSession } from '../types/models';

interface ClassListProps {
  onJoinClass: (classSession: ClassSession, userName: string) => void;
  userRole: 'teacher' | 'student';
}

export const ClassList: React.FC<ClassListProps> = ({ onJoinClass, userRole }) => {
  const [userName, setUserName] = useState('');
  const [activeSessions, setActiveSessions] = useState<ClassSession[]>([
    {
      id: '1',
      name: 'Matematik 101 - Integral ve Türev',
      teacherId: 'teacher1',
      teacherName: 'Prof. Dr. Mehmet Özkan',
      startTime: new Date(Date.now()).toISOString(), // Started 15 mins ago
      scheduledStartTime: new Date(Date.now()).toISOString(),
      isActive: true,
      isScheduled: false,
      participantCount: 12,
    },
    {
      id: '2',
      name: 'Fizik 201 - Elektromanyetizma',
      teacherId: 'teacher2',
      teacherName: 'Dr. Ayşe Kaya',
      startTime: new Date(Date.now() - 1800000).toISOString(), // Started 30 mins ago
      scheduledStartTime: new Date(Date.now() - 1800000).toISOString(),
      isActive: true,
      isScheduled: false,
      participantCount: 8,
    },
  ]);

  const handleStartClass = () => {
    const now = new Date().toISOString();
    const newSession: ClassSession = {
      id: `session-${Date.now()}`,
      name: 'Yeni Ders Oturumu',
      teacherId: 'current-teacher',
      teacherName: userName || 'Öğretmen',
      startTime: now,
      scheduledStartTime: now,
      isActive: true,
      isScheduled: false,
      participantCount: 0,
    };
    
    setActiveSessions(prev => [...prev, newSession]);
    onJoinClass(newSession, userName || 'Öğretmen');
  };

  const handleEndClass = (sessionId: string) => {
    setActiveSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, isActive: false, endTime: new Date().toISOString() }
          : session
      )
    );
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / 60000);
    
    if (diffMinutes < 60) {
      return `${diffMinutes} dakika`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}s ${minutes}d`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sanal Sınıf Sistemi
          </h1>
          <p className="text-xl text-gray-600">
            {userRole === 'teacher' ? 'Ders başlatın veya mevcut derslere katılın' : 'Aktif derslere katılın'}
          </p>
        </motion.div>

        {/* User Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              {userRole === 'teacher' ? 'Öğretmen Adınız' : 'Öğrenci Adınız'}
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={userRole === 'teacher' ? 'Örn: Dr. Ahmet Yılmaz' : 'Örn: Mehmet Demir'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </motion.div>

        {/* Teacher Controls */}
        {userRole === 'teacher' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md mx-auto mb-8"
          >
            <button
              onClick={handleStartClass}
              disabled={!userName.trim()}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <FaPlay size={20} />
              <span>Yeni Ders Başlat</span>
            </button>
          </motion.div>
        )}

        {/* Active Classes */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <FaBook className="mr-2 text-blue-600" />
            Aktif Dersler
          </h2>

          {activeSessions.filter(session => session.isActive).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FaBook size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-500">Şu anda aktif ders bulunmamaktadır.</p>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeSessions
                .filter(session => session.isActive)
                .map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {session.name}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <FaUsers size={16} className="mr-2" />
                        <span className="text-sm">Öğretmen: {session.teacherName}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <FaClock size={16} className="mr-2" />
                        <span className="text-sm">Süre: {formatDuration(session.startTime)}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <FaUsers size={16} className="mr-2" />
                        <span className="text-sm">{session.participantCount} katılımcı</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => onJoinClass(session, userName)}
                        disabled={!userName.trim()}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Katıl
                      </button>
                      
                      {userRole === 'teacher' && session.teacherId === 'current-teacher' && (
                        <button
                          onClick={() => handleEndClass(session.id)}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                        >
                          <FaStop size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};