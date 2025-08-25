import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaCalendarAlt, FaClock, FaUsers, FaPlay, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { ClassSession, User } from '../types/models';

interface DashboardProps {
  currentUser: User;
  onCreateClass: (classData: Partial<ClassSession>) => void;
  onJoinClass: (classSession: ClassSession) => void;
  onEditClass: (classId: string, classData: Partial<ClassSession>) => void;
  onDeleteClass: (classId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onCreateClass,
  onJoinClass,
  onEditClass,
  onDeleteClass,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClass, setDeletingClass] = useState<ClassSession | null>(null);
  const [scheduledClasses, setScheduledClasses] = useState<ClassSession[]>([
    {
      id: '1',
      name: 'Matematik 101 - Diferansiyel Denklemler',
      description: 'İleri matematik konuları ve uygulamaları',
      teacherId: 'teacher1',
      teacherName: 'Prof. Dr. Mehmet Özkan',
      scheduledStartTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago (can join)
      startTime: '',
      isActive: false,
      isScheduled: true,
      participantCount: 0,
      maxParticipants: 30,
      subject: 'Matematik',
      duration: 90,
    },
    {
      id: '2',
      name: 'Fizik 201 - Kuantum Mekaniği',
      description: 'Modern fizik ve kuantum teorisi temelleri',
      teacherId: 'teacher2',
      teacherName: 'Dr. Ayşe Kaya',
      scheduledStartTime: new Date(Date.now() + 1800000).toISOString(), // 30 minutes from now
      startTime: '',
      isActive: false,
      isScheduled: true,
      participantCount: 0,
      maxParticipants: 25,
      subject: 'Fizik',
      duration: 120,
    },
    {
      id: '3',
      name: 'Kimya 301 - Organik Kimya',
      description: 'Organik bileşikler ve reaksiyon mekanizmaları',
      teacherId: 'current-teacher',
      teacherName: 'Dr. Ali Veli',
      scheduledStartTime: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago (can join)
      startTime: '',
      isActive: false,
      isScheduled: true,
      participantCount: 0,
      maxParticipants: 20,
      subject: 'Kimya',
      duration: 75,
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    scheduledStartTime: '',
    duration: 60,
    maxParticipants: 30,
    settings: {
      allowHandRaise: true,
      defaultMicrophoneState: 'muted' as 'muted' | 'unmuted',
      defaultCameraState: 'on' as 'on' | 'off',
      defaultLayout: 'grid',
      allowStudentScreenShare: false,
      allowStudentChat: true,
      allowPrivateMessages: true,
      autoMuteNewParticipants: true,
      recordSession: false,
      waitingRoomEnabled: false,
    }
  });

  const canJoinClass = (scheduledTime: string) => {
    const scheduled = new Date(scheduledTime);
    const now = new Date();
    const tenMinutesBefore = new Date(scheduled.getTime() - 10 * 60 * 1000);
    const twoHoursAfter = new Date(scheduled.getTime() + 2 * 60 * 60 * 1000); // 2 saat sonrasına kadar
    return now >= tenMinutesBefore && now <= twoHoursAfter;
  };

  const getTimeUntilClass = (scheduledTime: string) => {
    const scheduled = new Date(scheduledTime);
    const now = new Date();
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff <= 0) {
      // Sınıf başladıysa, ne kadar süredir devam ettiğini göster
      const elapsed = Math.abs(diff);
      const elapsedMinutes = Math.floor(elapsed / (1000 * 60));
      if (elapsedMinutes < 60) {
        return `${elapsedMinutes} dakikadır devam ediyor`;
      }
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      const remainingMinutes = elapsedMinutes % 60;
      return `${elapsedHours}s ${remainingMinutes}d devam ediyor`;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}s ${minutes}d kaldı`;
    }
    return `${minutes}d kaldı`;
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass: Partial<ClassSession> = {
      ...formData,
      id: `class-${Date.now()}`,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      isActive: false,
      isScheduled: true,
      participantCount: 0,
    };
    
    onCreateClass(newClass);
    setScheduledClasses(prev => [...prev, newClass as ClassSession]);
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      subject: '',
      scheduledStartTime: '',
      duration: 60,
      maxParticipants: 30,
      settings: {
        allowHandRaise: true,
        defaultMicrophoneState: 'muted',
        defaultCameraState: 'on',
        defaultLayout: 'grid',
        allowStudentScreenShare: false,
        allowStudentChat: true,
        allowPrivateMessages: true,
        autoMuteNewParticipants: true,
        recordSession: false,
        waitingRoomEnabled: false,
      }
    });
  };

  const handleEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    
    const updatedClass = {
      ...editingClass,
      ...formData,
    };
    
    setScheduledClasses(prev =>
      prev.map(c => c.id === editingClass.id ? updatedClass : c)
    );
    onEditClass(editingClass.id, formData);
    setShowEditModal(false);
    setEditingClass(null);
    resetForm();
  };

  const handleDeleteClass = () => {
    if (!deletingClass) return;
    
    setScheduledClasses(prev => prev.filter(c => c.id !== deletingClass.id));
    onDeleteClass(deletingClass.id);
    setShowDeleteModal(false);
    setDeletingClass(null);
  };

  const openEditModal = (classSession: ClassSession) => {
    setEditingClass(classSession);
    setFormData({
      name: classSession.name,
      description: classSession.description || '',
      subject: classSession.subject || '',
      scheduledStartTime: new Date(classSession.scheduledStartTime).toISOString().slice(0, 16),
      duration: classSession.duration || 60,
      maxParticipants: classSession.maxParticipants || 30,
      settings: classSession.settings || {
        allowHandRaise: true,
        defaultMicrophoneState: 'muted',
        defaultCameraState: 'on',
        defaultLayout: 'grid',
        allowStudentScreenShare: false,
        allowStudentChat: true,
        allowPrivateMessages: true,
        autoMuteNewParticipants: true,
        recordSession: false,
        waitingRoomEnabled: false,
      }
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (classSession: ClassSession) => {
    setDeletingClass(classSession);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      scheduledStartTime: '',
      duration: 60,
      maxParticipants: 30,
      settings: {
        allowHandRaise: true,
        defaultMicrophoneState: 'muted',
        defaultCameraState: 'on',
        defaultLayout: 'grid',
        allowStudentScreenShare: false,
        allowStudentChat: true,
        allowPrivateMessages: true,
        autoMuteNewParticipants: true,
        recordSession: false,
        waitingRoomEnabled: false,
      }
    });
  };

  const handleStartClass = (classSession: ClassSession) => {
    const updatedClass = {
      ...classSession,
      isActive: true,
      startTime: new Date().toISOString(),
    };
    
    setScheduledClasses(prev =>
      prev.map(c => c.id === classSession.id ? updatedClass : c)
    );
    onJoinClass(updatedClass);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sanal Sınıf Dashboard</h1>
              <p className="text-gray-600">Hoş geldiniz, {currentUser.name}</p>
            </div>
            {currentUser.role === 'teacher' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                <FaPlus size={20} />
                <span className="hidden sm:inline">Yeni Sınıf Oluştur</span>
                <span className="sm:hidden">Yeni Sınıf</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6"
          >
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <FaCalendarAlt className="text-blue-600" size={20} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam Sınıf</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{scheduledClasses.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6"
          >
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <FaPlay className="text-green-600" size={20} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Aktif Sınıf</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {scheduledClasses.filter(c => c.isActive).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                <FaUsers className="text-purple-600" size={20} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam Katılımcı</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {scheduledClasses.reduce((sum, c) => sum + c.participantCount, 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scheduled Classes */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Programlı Sınıflar</h2>
          </div>
          <div className="p-4 sm:p-6">
            {scheduledClasses.length === 0 ? (
              <div className="text-center py-12">
                <FaCalendarAlt size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Henüz programlanmış sınıf bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {scheduledClasses.map((classSession, index) => (
                  <motion.div
                    key={classSession.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                            {classSession.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                            classSession.isActive
                              ? 'bg-green-100 text-green-800'
                              : canJoinClass(classSession.scheduledStartTime)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {classSession.isActive
                              ? 'Aktif'
                              : canJoinClass(classSession.scheduledStartTime)
                              ? 'Katılım Açık'
                              : 'Beklemede'
                            }
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 text-sm sm:text-base">{classSession.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <FaCalendarAlt size={12} className="flex-shrink-0" />
                            <span className="truncate">{formatDateTime(classSession.scheduledStartTime)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaClock size={12} className="flex-shrink-0" />
                            <span>{classSession.duration} dakika</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaUsers size={12} className="flex-shrink-0" />
                            <span>{classSession.participantCount}/{classSession.maxParticipants}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaEye size={12} className="flex-shrink-0" />
                            <span className="truncate">{getTimeUntilClass(classSession.scheduledStartTime)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-4 w-full lg:w-auto">
                        {currentUser.role === 'teacher' && classSession.teacherId === currentUser.id && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(classSession)}
                              disabled={classSession.isActive}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                              title="Sınıfı Düzenle"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(classSession)}
                              disabled={classSession.isActive}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                              title="Sınıfı Sil"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        )}
                        
                        {canJoinClass(classSession.scheduledStartTime) && (
                          <button
                            onClick={() => 
                              currentUser.role === 'teacher' && classSession.teacherId === currentUser.id
                                ? handleStartClass(classSession)
                                : onJoinClass(classSession)
                            }
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto ${
                              currentUser.role === 'teacher' && classSession.teacherId === currentUser.id
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {currentUser.role === 'teacher' && classSession.teacherId === currentUser.id
                              ? (classSession.isActive ? 'Sınıfa Git' : 'Dersi Başlat')
                              : 'Katıl'
                            }
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

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto"
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Yeni Sınıf Oluştur</h2>
            </div>
            
            <form onSubmit={handleCreateClass} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sınıf Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Matematik 101 - Diferansiyel Denklemler"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ders hakkında kısa açıklama..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ders Konusu
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Matematik, Fizik, Kimya"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi ve Saati *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledStartTime}
                    onChange={(e) => setFormData({...formData, scheduledStartTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Süre (dakika)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maksimum Katılımcı
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sınıf Ayarları */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Sınıf Ayarları</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Katılımcı İzinleri</h4>                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowHandRaise}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, allowHandRaise: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Parmak kaldırma izni</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowStudentChat}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, allowStudentChat: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Öğrenci sohbet izni</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowPrivateMessages}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, allowPrivateMessages: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Özel mesaj izni</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowStudentScreenShare}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, allowStudentScreenShare: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Öğrenci ekran paylaşımı</span>
                    </label>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Varsayılan Ayarlar</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Varsayılan mikrofon durumu
                      </label>
                      <select
                        value={formData.settings.defaultMicrophoneState}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, defaultMicrophoneState: e.target.value as 'muted' | 'unmuted' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="muted">Kapalı</option>
                        <option value="unmuted">Açık</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Varsayılan kamera durumu
                      </label>
                      <select
                        value={formData.settings.defaultCameraState}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, defaultCameraState: e.target.value as 'on' | 'off' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="on">Açık</option>
                        <option value="off">Kapalı</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Varsayılan layout
                      </label>
                      <select
                        value={formData.settings.defaultLayout}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, defaultLayout: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="grid">Izgara Görünümü</option>
                        <option value="teacher-focus">Öğretmen Odaklı</option>
                        <option value="presentation">Sunum Modu</option>
                        <option value="sidebar">Yan Panel</option>
                      </select>
                    </div>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.autoMuteNewParticipants}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, autoMuteNewParticipants: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Yeni katılımcıları otomatik sustur</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sınıf Oluştur
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto"
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sınıfı Düzenle</h2>
            </div>
            
            <form onSubmit={handleEditClass} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sınıf Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Matematik 101 - Diferansiyel Denklemler"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ders hakkında kısa açıklama..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ders Konusu
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Matematik, Fizik, Kimya"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi ve Saati *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledStartTime}
                    onChange={(e) => setFormData({...formData, scheduledStartTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Süre (dakika)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maksimum Katılımcı
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClass(null);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full mx-4"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-full mr-4">
                  <FaTrash className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Sınıfı Sil</h3>
                  <p className="text-sm text-gray-600">Bu işlem geri alınamaz</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                <strong>"{deletingClass.name}"</strong> adlı sınıfı silmek istediğinizden emin misiniz?
              </p>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingClass(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteClass}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};