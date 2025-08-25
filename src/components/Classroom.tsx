import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaComments, FaUserPlus, FaTh, FaExpand, FaHandPaper, FaVolumeMute, FaVolumeUp, FaFile, FaDesktop, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone, FaTimes, FaCompress, FaUserFriends, FaClipboardList, FaLayerGroup, FaWrench, FaCheck, FaUserTimes, FaDownload, FaTrash, FaEye, FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaPaperPlane, FaBullhorn, FaUser, FaBars } from 'react-icons/fa';
import { ParticipantGrid } from './ParticipantGrid';
import { KickParticipantModal } from './KickParticipantModal';
import { SignalRService } from '../services/signalr';
import { WebRTCService } from '../services/webrtc';
import { Participant, AttendanceRecord, ClassSession, ChatMessage, VideoLayout, HandRaise, ClassDocument, ClassSettings } from '../types/models';
import { ScreenSharePanel } from './VirtualClass/Panels/ScreenSharePanel';

interface ClassroomProps {
  classSession: ClassSession;
  currentUser: { id: string; name: string; role: 'teacher' | 'student' | 'observer' };
  onLeaveClass: () => void;
}

type SidePanelType = 'chat' | 'participants' | 'documents' | 'handraises' | 'layout' | 'settings' | null;

export const Classroom: React.FC<ClassroomProps> = ({
  classSession,
  currentUser,
  onLeaveClass,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentLayout, setCurrentLayout] = useState<VideoLayout>({ id: 'grid', name: 'Izgara Görünümü', type: 'grid', description: 'Tüm katılımcılar eşit boyutta görünür' });
  const [focusedParticipant, setFocusedParticipant] = useState<string>();
  const [handRaises, setHandRaises] = useState<HandRaise[]>([]);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [isAllMuted, setIsAllMuted] = useState(false);
  const [kickingParticipant, setKickingParticipant] = useState<{ id: string; name: string } | null>(null);
  const [documents, setDocuments] = useState<ClassDocument[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream>();
  const [screenSharer, setScreenSharer] = useState<string>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<SidePanelType>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageMode, setMessageMode] = useState<'public' | 'private' | 'announcement'>('public');
  const [selectedRecipient, setSelectedRecipient] = useState<{id: string; name: string} | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [participantsActiveTab, setParticipantsActiveTab] = useState<'participants' | 'attendance'>('participants');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [classSettings, setClassSettings] = useState<ClassSettings>({
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
  });

  const signalRServiceRef = useRef<SignalRService>();
  const webRTCServiceRef = useRef<WebRTCService>();

  const layouts: VideoLayout[] = [
    {
      id: 'grid',
      name: 'Izgara Görünümü',
      type: 'grid',
      description: 'Tüm katılımcılar eşit boyutta görünür',
    },
    {
      id: 'sidebar',
      name: 'Sunum Modu',
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

  useEffect(() => {
    initializeServices();
    return () => {
      cleanup();
    };
  }, []);

  // Apply class settings
  useEffect(() => {
    if (classSession.settings) {
      setClassSettings(classSession.settings);
      const selectedLayout = layouts.find(l => l.id === classSession.settings!.defaultLayout) || layouts[0];
      setCurrentLayout(selectedLayout);
      
      // Apply default audio/video states for new participants
      if (currentUser.role === 'student') {
        setIsAudioEnabled(classSession.settings.defaultMicrophoneState === 'unmuted');
        setIsVideoEnabled(classSession.settings.defaultCameraState === 'on');
      }
    }
  }, [classSession.settings, currentUser.role]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeServices = async () => {
    try {
      // Initialize SignalR
      signalRServiceRef.current = new SignalRService();
      await signalRServiceRef.current.start();

      // Initialize WebRTC
      webRTCServiceRef.current = new WebRTCService();
      const stream = await webRTCServiceRef.current.initializeLocalStream();
      setLocalStream(stream);

      // Setup WebRTC remote stream handler
      webRTCServiceRef.current.onRemoteStreamReceived((userId, stream) => {
        console.log('Received remote stream from:', userId);
        setParticipants(prev =>
          prev.map(p =>
            p.id === userId ? { ...p, stream } : p
          )
        );
      });

      // Setup SignalR event handlers
      signalRServiceRef.current.setParticipantJoinHandler((userId, name) => {
        console.log(`Participant joined: ${name}`);
        
        // Create WebRTC connection for new participant
        if (webRTCServiceRef.current) {
          webRTCServiceRef.current.createPeerConnection(userId);
        }
        
        setParticipants(prev => {
          const existing = prev.find(p => p.id === userId);
          if (existing) return prev;
          return [...prev, { 
            id: userId, 
            name, 
            isTeacher: false,
            isAudioMuted: classSettings.autoMuteNewParticipants,
            isVideoMuted: classSettings.defaultCameraState === 'off'
          }];
        });
      });

      signalRServiceRef.current.setParticipantLeaveHandler((userId) => {
        console.log(`Participant left: ${userId}`);
        setParticipants(prev => prev.filter(p => p.id !== userId));
        webRTCServiceRef.current?.closePeerConnection(userId);
      });

      signalRServiceRef.current.setAttendanceUpdatedHandler((record) => {
        setAttendanceRecords(prev => {
          const existing = prev.find(r => r.id === record.id);
          if (existing) {
            return prev.map(r => r.id === record.id ? record : r);
          }
          return [...prev, record];
        });
      });

      signalRServiceRef.current.setChatMessageReceivedHandler((message) => {
        setChatMessages(prev => [...prev, message]);
      });

      signalRServiceRef.current.setParticipantMutedHandler((userId, isMuted) => {
        setParticipants(prev =>
          prev.map(p =>
            p.id === userId ? { ...p, isAudioMuted: isMuted } : p
          )
        );
      });

      // Hand raise events
      signalRServiceRef.current.setHandRaiseReceivedHandler?.((handRaise) => {
        setHandRaises(prev => [...prev, handRaise]);
      });

      signalRServiceRef.current.setHandRaiseDismissedHandler?.((handRaiseId) => {
        setHandRaises(prev => prev.map(hr => 
          hr.id === handRaiseId ? { ...hr, isActive: false } : hr
        ));
      });

      // Join the class
      await signalRServiceRef.current.joinClass(
        classSession.id,
        currentUser.id,
        currentUser.name
      );

    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const cleanup = async () => {
    if (signalRServiceRef.current) {
      await signalRServiceRef.current.leaveClass(classSession.id, currentUser.id);
      await signalRServiceRef.current.disconnect();
    }
    
    webRTCServiceRef.current?.closeAllConnections();
  };

  const handleToggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    webRTCServiceRef.current?.toggleAudio(!isAudioEnabled);
  };

  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    webRTCServiceRef.current?.toggleVideo(!isVideoEnabled);
  };

  const handleLeaveCall = async () => {
    await cleanup();
    onLeaveClass();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && signalRServiceRef.current) {
      if (messageMode === 'private' && selectedRecipient) {
        await signalRServiceRef.current.sendPrivateMessage(
          classSession.id,
          currentUser.id,
          currentUser.name,
          newMessage.trim(),
          selectedRecipient.id,
          selectedRecipient.name,
          currentUser.role === 'teacher'
        );
      } else if (messageMode === 'announcement' && currentUser.role === 'teacher') {
        await signalRServiceRef.current.sendAnnouncement(
          classSession.id,
          currentUser.id,
          currentUser.name,
          newMessage.trim()
        );
      } else {
        await signalRServiceRef.current.sendChatMessage(
          classSession.id,
          currentUser.id,
          currentUser.name,
          newMessage.trim(),
          currentUser.role === 'teacher'
        );
      }
      setNewMessage('');
    }
  };

  const handleMuteParticipant = async (participantId: string, isMuted: boolean) => {
    if (signalRServiceRef.current && currentUser.role === 'teacher') {
      await signalRServiceRef.current.muteParticipant(classSession.id, participantId, isMuted);
    }
  };

  const handleMuteAll = async () => {
    if (signalRServiceRef.current && currentUser.role === 'teacher') {
      const newMuteState = !isAllMuted;
      setIsAllMuted(newMuteState);
      
      // Mute all participants except teacher
      for (const participant of participants) {
        if (!participant.isTeacher) {
          await signalRServiceRef.current.muteParticipant(classSession.id, participant.id, newMuteState);
        }
      }
    }
  };

  const handleRaiseHand = async () => {
    if (signalRServiceRef.current && currentUser.role === 'student' && !hasRaisedHand && classSettings.allowHandRaise) {
      await signalRServiceRef.current.raiseHand(
        classSession.id,
        currentUser.id,
        currentUser.name
      );
      setHasRaisedHand(true);
    }
  };

  const handleApproveHandRaise = async (handRaiseId: string) => {
    if (signalRServiceRef.current && currentUser.role === 'teacher') {
      await signalRServiceRef.current.approveHandRaise(classSession.id, handRaiseId);
      setHandRaises(prev => prev.map(hr => 
        hr.id === handRaiseId ? { ...hr, isActive: false } : hr
      ));
    }
  };

  const handleDismissHandRaise = async (handRaiseId: string) => {
    if (signalRServiceRef.current && currentUser.role === 'teacher') {
      await signalRServiceRef.current.dismissHandRaise(classSession.id, handRaiseId);
      setHandRaises(prev => prev.map(hr => 
        hr.id === handRaiseId ? { ...hr, isActive: false } : hr
      ));
    }
  };

  const handleKickParticipant = async (participantId: string) => {
    if (signalRServiceRef.current && currentUser.role === 'teacher') {
      await signalRServiceRef.current.kickParticipant(classSession.id, participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      // Update attendance record for kicked participant
      setAttendanceRecords(prev => prev.map(r => {
        if (r.studentId === participantId && !r.leaveTime) {
          const leaveTime = new Date().toISOString();
          const join = new Date(r.joinTime);
          const leave = new Date(leaveTime);
          const totalDurationMinutes = Math.max(1, Math.round((leave.getTime() - join.getTime()) / 60000));
          return { ...r, leaveTime, totalDurationMinutes };
        }
        return r;
      }));
    }
  };

  const handleUploadDocument = async (file: File) => {
    // In a real app, this would upload to a server
    const newDoc: ClassDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
    };
    
    setDocuments(prev => [...prev, newDoc]);
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  };

  const handleViewDocument = (document: ClassDocument) => {
    window.open(document.url, '_blank');
  };

  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      setScreenSharer(currentUser.name);
      
      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const handleStopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(undefined);
    }
    setIsScreenSharing(false);
    setScreenSharer(undefined);
  };

  const handleLayoutChange = (layout: VideoLayout) => {
    setCurrentLayout(layout);
    if (layout.type === 'grid') {
      setFocusedParticipant(undefined);
    }
  };

  const handleParticipantFocus = (participantId: string | undefined) => {
    setFocusedParticipant(participantId);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleSidePanel = (panelType: SidePanelType) => {
    setActiveSidePanel(activeSidePanel === panelType ? null : panelType);
  };

  // Demo: Simulate student joining
  const simulateStudentJoin = () => {
    const studentNames = ['Ahmet Yılmaz', 'Fatma Demir', 'Mehmet Kaya', 'Ayşe Özkan', 'Ali Çelik'];
    const availableNames = studentNames.filter(name => 
      !participants.some(p => p.name === name)
    );
    
    if (availableNames.length === 0) {
      alert('Tüm demo öğrenciler zaten sınıfta!');
      return;
    }
    
    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    const studentId = `student-${Date.now()}`;
    
    setParticipants(prev => {
      return [...prev, { 
        id: studentId, 
        name: randomName, 
        isTeacher: false,
        isAudioMuted: classSettings.autoMuteNewParticipants,
        isVideoMuted: classSettings.defaultCameraState === 'off'
      }];
    });

    // Add attendance record
    setAttendanceRecords(prev => {
      // Check if student already has an active attendance record
      const existingRecord = prev.find(r => r.studentId === studentId && !r.leaveTime);
      if (existingRecord) return prev;
      
      return [...prev, {
        id: `attendance-${Date.now()}`,
        sessionId: classSession.id,
        studentId,
        studentName: randomName,
        joinTime: new Date().toISOString(),
        totalDurationMinutes: 0,
      }];
    });
  };

  const handleSettingsChange = (newSettings: Partial<ClassSettings>) => {
    setClassSettings(prev => ({ ...prev, ...newSettings }));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (currentUser.role !== 'teacher' || !handleUploadDocument) return;
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleUploadDocument(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser.role !== 'teacher' || !handleUploadDocument) return;
    
    const files = Array.from(e.target.files || []);
    files.forEach(file => handleUploadDocument(file));
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getLayoutIcon = (type: string) => {
    switch (type) {
      case 'grid':
        return <FaTh size={24} />;
      case 'speaker':
        return <FaExpand size={24} />;
      case 'presentation':
        return <FaDesktop size={24} />;
      case 'sidebar':
        return <FaUsers size={24} />;
      default:
        return <FaTh size={24} />;
    }
  };

  const renderSidePanel = () => {
    if (!activeSidePanel) return null;

    const panelContent = () => {
      switch (activeSidePanel) {
        case 'chat': {
          const availableRecipients = participants.filter(p => p.id !== currentUser.id);
          return (
            <div className="h-full bg-white flex flex-col text-gray-900">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sınıf Sohbeti</h3>
                  <button 
                    onClick={() => setActiveSidePanel(null)}
                    className="p-1 hover:bg-gray-100 rounded lg:hidden"
                  >
                    <FaTimes className="text-gray-500" size={16} />
                  </button>
                </div>
              </div>

              {/* Message Mode Selector */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-2 mb-2">
                  <button
                    onClick={() => {setMessageMode('public'); setSelectedRecipient(null);}}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
                      messageMode === 'public' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaUsers size={12} />
                    <span>Herkese</span>
                  </button>
                  
                  <button
                    onClick={() => setMessageMode('private')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
                      messageMode === 'private' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaUser size={12} />
                    <span>Özel</span>
                  </button>
                  
                  {currentUser.role === 'teacher' && (
                    <button
                      onClick={() => {setMessageMode('announcement'); setSelectedRecipient(null);}}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
                        messageMode === 'announcement' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaBullhorn size={12} />
                      <span>Duyuru</span>
                    </button>
                  )}
                </div>
                
                {messageMode === 'private' && (
                  <select
                    value={selectedRecipient?.id || ''}
                    onChange={(e) => {
                      const recipient = availableRecipients.find(p => p.id === e.target.value);
                      setSelectedRecipient(recipient ? {id: recipient.id, name: recipient.name} : null);
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="">Kişi seçin...</option>
                    {availableRecipients.map(participant => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name} {participant.isTeacher ? '(Öğretmen)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm">
                    Henüz mesaj bulunmamaktadır.
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`${
                        message.messageType === 'announcement' ? 'w-full' : 
                        message.senderId === currentUser.id ? 'flex justify-end' : 'flex justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.messageType === 'announcement'
                            ? 'bg-red-100 text-red-800 border border-red-200 w-full text-center'
                            : message.messageType === 'private'
                            ? message.senderId === currentUser.id
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-800 border border-green-200'
                            : message.senderId === currentUser.id
                            ? 'bg-blue-600 text-white'
                            : message.isTeacher
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.senderId !== currentUser.id && (
                          <div className="text-xs font-semibold mb-1">
                            {message.senderName}
                            {message.isTeacher && ' (Öğretmen)'}
                            {message.messageType === 'private' && message.recipientId === currentUser.id && ' (Size özel)'}
                          </div>
                        )}
                        {message.messageType === 'private' && message.senderId === currentUser.id && (
                          <div className="text-xs mb-1 opacity-75">
                            → {message.recipientName}
                          </div>
                        )}
                        {message.messageType === 'announcement' && (
                          <div className="text-xs font-semibold mb-1">
                            📢 DUYURU - {message.senderName}
                          </div>
                        )}
                        <div className="text-sm">{message.message}</div>
                        <div
                          className={`text-xs mt-1 opacity-75 ${
                            message.messageType === 'announcement'
                              ? 'text-red-600'
                              : message.senderId === currentUser.id
                              ? 'text-white'
                              : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
                  {messageMode === 'public' && 'Herkese mesaj gönderiyorsunuz'}
                  {messageMode === 'private' && selectedRecipient && `${selectedRecipient.name} kişisine özel mesaj`}
                  {messageMode === 'private' && !selectedRecipient && 'Önce bir kişi seçin'}
                  {messageMode === 'announcement' && 'Sınıfa duyuru gönderiyorsunuz'}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      messageMode === 'private' && !selectedRecipient 
                        ? 'Önce kişi seçin...' 
                        : messageMode === 'announcement'
                        ? 'Duyuru mesajınız...'
                        : 'Mesajınızı yazın...'
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    maxLength={500}
                    disabled={messageMode === 'private' && !selectedRecipient}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || (messageMode === 'private' && !selectedRecipient)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaPaperPlane size={16} />
                  </button>
                </div>
              </form>
            </div>
          );
        }

        case 'participants': {
          return (
            <div className="h-full bg-white flex flex-col text-gray-900">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Katılımcılar ({participants.length + 1})</h3>
                  <button onClick={() => setActiveSidePanel(null)}>
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setParticipantsActiveTab('participants')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      participantsActiveTab === 'participants'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FaUsers className="inline mr-1" size={14} />
                    Katılımcılar
                  </button>
                  <button
                    onClick={() => setParticipantsActiveTab('attendance')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      participantsActiveTab === 'attendance'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FaClipboardList className="inline mr-1" size={14} />
                    Katılım Raporu
                  </button>
                </div>
              </div>
              
              {participantsActiveTab === 'participants' && (
                <>
                  {currentUser.role === 'teacher' && participants.length > 0 && (
                    <div className="flex">
                      <button
                        onClick={async () => {
                          if (signalRServiceRef.current && currentUser.role === 'teacher') {
                            const now = new Date();
                            // Remove all non-teacher participants
                            const nonTeacherIds = participants.filter(p => !p.isTeacher).map(p => p.id);
                            for (const participantId of nonTeacherIds) {
                              await signalRServiceRef.current.kickParticipant(classSession.id, participantId);
                            }
                            setParticipants(prev => prev.filter(p => p.isTeacher));
                            setAttendanceRecords(prev => prev.map(r => {
                              if (nonTeacherIds.includes(r.studentId) && !r.leaveTime) {
                                const leaveTime = now.toISOString();
                                const join = new Date(r.joinTime);
                                const leave = now;
                                const totalDurationMinutes = Math.max(1, Math.round((leave.getTime() - join.getTime()) / 60000));
                                return { ...r, leaveTime, totalDurationMinutes };
                              }
                              return r;
                            }));
                          }
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white p-2 shadow text-sm transition-all"
                      >
                        Tüm Katılımcıları Çıkar
                      </button>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-2">
                      {/* Current User */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {currentUser.name.charAt(0)}
                          </div>
                          <span className="text-gray-900">{currentUser.name} (Siz)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {currentUser.role === 'teacher' && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Öğretmen</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Other Participants */}
                      {participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {participant.name.charAt(0)}
                            </div>
                            <span
                              className="text-gray-900 cursor-pointer hover:underline"
                              onClick={() => {
                                setMessageMode('private');
                                setSelectedRecipient({ id: participant.id, name: participant.name });
                                setActiveSidePanel('chat');
                              }}
                            >
                              {participant.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {/* Ses aç/kapat butonu */}
                            {currentUser.role === 'teacher' && !participant.isTeacher && (
                              <button
                                onClick={async () => {
                                  await handleMuteParticipant(participant.id, !participant.isAudioMuted);
                                }}
                                className={`p-1 rounded transition-colors ${participant.isAudioMuted ? 'text-green-600 hover:bg-green-50' : 'text-yellow-600 hover:bg-yellow-50'}`}
                                title={participant.isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                              >
                                {participant.isAudioMuted ? <FaMicrophone /> : <FaMicrophoneSlash />}
                              </button>
                            )}
                            {/* Video durumu gösterimi */}
                            {participant.isVideoMuted && <FaVideoSlash className="text-red-500 text-sm" />}
                            {participant.isTeacher && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Öğretmen</span>
                            )}
                            {currentUser.role === 'teacher' && !participant.isTeacher && (
                              <button
                                onClick={() => setKickingParticipant({ id: participant.id, name: participant.name })}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Sınıftan Çıkar"
                              >
                                <FaUserTimes size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {participantsActiveTab === 'attendance' && (
                <div className="flex-1 overflow-y-auto p-4">
                  {attendanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaClipboardList size={32} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-sm text-gray-600">Henüz katılım kaydı bulunmamaktadır.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attendanceRecords.map((record) => (
                        <div key={record.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">{record.studentName}</h4>
                            <span className="text-sm font-semibold text-blue-600">
                              {formatDuration(record.totalDurationMinutes)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Giriş: {formatTime(record.joinTime)}</div>
                            <div>
                              Çıkış: {record.leaveTime ? formatTime(record.leaveTime) : 'Devam ediyor'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        case 'documents':
          return (
            <div className="h-full bg-white flex flex-col text-gray-900">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Sınıf Dokümanları</h3>
                  <button onClick={() => setActiveSidePanel(null)}>
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Upload Area (Teacher Only) */}
                {currentUser.role === 'teacher' && (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-colors ${
                      dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                  >
                    <FaFile size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Doküman Yükle
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Dosyaları buraya sürükleyin veya seçin
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
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
                    <FaFile size={32} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">Henüz doküman yüklenmemiş.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="text-lg flex-shrink-0">
                            {getFileIcon(doc.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-800 text-sm truncate">{doc.name}</h4>
                            <p className="text-xs text-gray-600">
                              {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.uploadedBy}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Görüntüle"
                          >
                            <FaEye size={12} />
                          </button>
                          
                          
                          <a
                            href={doc.url}
                            download={doc.name}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="İndir"
                          >
                            <FaDownload size={12} />
                          </a>
                          
                          {currentUser.role === 'teacher' && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Sil"
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

        case 'handraises': {
          const activeHandRaises = handRaises.filter(hr => hr.isActive);
          return (
            <div className="h-full bg-white flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Parmak Kaldıranlar ({activeHandRaises.length})
                  </h3>
                  <button onClick={() => setActiveSidePanel(null)}>
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activeHandRaises.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaHandPaper size={32} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-sm text-gray-600">Şu anda parmak kaldıran öğrenci bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeHandRaises.map((handRaise) => (
                      <div
                        key={handRaise.id}
                        className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FaHandPaper className="text-yellow-600" size={16} />
                          <div>
                            <h4 className="font-medium text-gray-800 text-sm">
                              {handRaise.studentName}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {formatTime(handRaise.timestamp)} • {getTimeSince(handRaise.timestamp)}
                            </p>
                          </div>
                        </div>
                        
                        {currentUser.role === 'teacher' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleApproveHandRaise(handRaise.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              <FaCheck size={10} />
                              <span>Onayla</span>
                            </button>
                            <button
                              onClick={() => handleDismissHandRaise(handRaise.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              <FaTimes size={10} />
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
          );
        }

        case 'layout':
          return (
            <div className="h-full bg-white flex flex-col text-gray-900">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Video Layout Seçin</h3>
                  <button onClick={() => setActiveSidePanel(null)}>
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-3">
                  {layouts.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => {
                        handleLayoutChange(layout);
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        currentLayout.id === layout.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-full ${
                          currentLayout.id === layout.id
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getLayoutIcon(layout.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{layout.name}</h4>
                          <p className="text-xs text-gray-600">{layout.description}</p>
                        </div>
                      </div>
                      
                      {/* Layout Preview */}
                      <div className="bg-gray-100 rounded p-3 h-16 flex items-center justify-center">
                        {layout.type === 'grid' && (
                          <div className="grid grid-cols-2 gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="w-4 h-3 bg-blue-300 rounded"></div>
                            ))}
                          </div>
                        )}
                        {layout.type === 'sidebar' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-6 bg-blue-500 rounded"></div>
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
                        {layout.type === 'teacher-focus' && (
                          <div className="space-y-1">
                            <div className="w-12 h-4 bg-green-500 rounded"></div>
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-blue-300 rounded"></div>
                              <div className="w-1 h-1 bg-blue-300 rounded"></div>
                              <div className="w-1 h-1 bg-blue-300 rounded"></div>
                              <div className="w-1 h-1 bg-blue-300 rounded"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'settings':
          return (
            <div className="h-full bg-white flex flex-col text-gray-900">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Sınıf Ayarları</h3>
                  <button onClick={() => setActiveSidePanel(null)}>
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Katılımcı Davranışları */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Katılımcı İzinleri</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Parmak kaldırma izni</span>
                        <input
                          type="checkbox"
                          checked={classSettings.allowHandRaise}
                          onChange={(e) => handleSettingsChange({ allowHandRaise: e.target.checked })}
                          className="rounded"
                          disabled={currentUser.role !== 'teacher'}
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Öğrenci sohbet izni</span>
                        <input
                          type="checkbox"
                          checked={classSettings.allowStudentChat}
                          onChange={(e) => handleSettingsChange({ allowStudentChat: e.target.checked })}
                          className="rounded"
                          disabled={currentUser.role !== 'teacher'}
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Özel mesaj izni</span>
                        <input
                          type="checkbox"
                          checked={classSettings.allowPrivateMessages}
                          onChange={(e) => handleSettingsChange({ allowPrivateMessages: e.target.checked })}
                          className="rounded"
                          disabled={currentUser.role !== 'teacher'}
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Öğrenci ekran paylaşımı</span>
                        <input
                          type="checkbox"
                          checked={classSettings.allowStudentScreenShare}
                          onChange={(e) => handleSettingsChange({ allowStudentScreenShare: e.target.checked })}
                          className="rounded"
                          disabled={currentUser.role !== 'teacher'}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Varsayılan Ayarlar */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Varsayılan Ayarlar</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Varsayılan mikrofon durumu
                        </label>
                        <select
                          value={classSettings.defaultMicrophoneState}
                          onChange={(e) => handleSettingsChange({ defaultMicrophoneState: e.target.value as 'muted' | 'unmuted' })}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          disabled={currentUser.role !== 'teacher'}
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
                          value={classSettings.defaultCameraState}
                          onChange={(e) => handleSettingsChange({ defaultCameraState: e.target.value as 'on' | 'off' })}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          disabled={currentUser.role !== 'teacher'}
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
                          value={classSettings.defaultLayout}
                          onChange={(e) => handleSettingsChange({ defaultLayout: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          disabled={currentUser.role !== 'teacher'}
                        >
                          <option value="grid">Izgara Görünümü</option>
                          <option value="sidebar">Sunum Modu</option>
                          <option value="teacher-focus">Öğretmen Odaklı</option>
                          <option value="interview">Karşılıklı Görüşme</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Otomatik Ayarlar */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Otomatik Ayarlar</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Yeni katılımcıları otomatik sustur</span>
                        <input
                          type="checkbox"
                          checked={classSettings.autoMuteNewParticipants}
                          onChange={(e) => handleSettingsChange({ autoMuteNewParticipants: e.target.checked })}
                          className="rounded"
                          disabled={currentUser.role !== 'teacher'}
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Bekleme odası aktif</span>
                        <input
                          type="checkbox"
                          checked={classSettings.waitingRoomEnabled}
                          onChange={(e) => handleSettingsChange({ waitingRoomEnabled: e.target.checked })}
                          className="rounded"
                          disabled={currentUser.role !== 'teacher'}
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Oturumu kaydet</span>
                        <input
                          type="checkbox"
                          checked={classSettings.recordSession}
                          onChange={(e) => handleSettingsChange({ recordSession: e.target.checked })}
                          className="rounded"
                          disabled={currentUser.role !== 'teacher'}
                        />
                      </label>
                    </div>
                  </div>

                  {currentUser.role !== 'teacher' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Ayarları sadece öğretmen değiştirebilir.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
  <div className="w-full lg:w-80 bg-white shadow-xl border-l border-gray-200 flex-shrink-0 h-full">
        {panelContent()}
        {/* Kapat butonu kaldırıldı, ana panelde gösterilecek */}
      </div>
    );
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col relative overflow-hidden"
      >
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row relative min-h-0 h-full">
          {/* Left Content Area - Video and Screen Share */}
          <div className={`flex-1 flex flex-col min-h-0 h-full transition-all duration-300 ${!activeSidePanel ? 'flex items-center justify-center' : ''}`}>
            {/* Video Container - Panel kapalıyken ortalanmış */}
            <div className={`${!activeSidePanel ? 'w-full max-w-6xl' : 'w-full h-full'} flex flex-col min-h-0 h-full`}>
              {/* Screen Share Panel */}
              {(isScreenSharing || screenStream) && (
                <div className="p-2 sm:p-4 flex-shrink-0">
                  <ScreenSharePanel
                    isSharing={isScreenSharing}
                    onStartShare={handleStartScreenShare}
                    onStopShare={handleStopScreenShare}
                    sharedScreen={screenStream}
                    sharerName={screenSharer}
                  />
                </div>
              )}
              {/* Video Grid */}
              <div className="flex-1 relative overflow-hidden min-h-0 h-full">
                <ParticipantGrid
                  participants={participants}
                  localStream={currentUser.role === 'observer' ? undefined : localStream}
                  currentUserId={currentUser.id}
                  currentUserName={currentUser.name}
                  isTeacher={currentUser.role === 'teacher'}
                  isAudioEnabled={isAudioEnabled}
                  isVideoEnabled={isVideoEnabled}
                  onToggleAudio={currentUser.role === 'observer' ? () => { } : handleToggleAudio}
                  onToggleVideo={currentUser.role === 'observer' ? () => { } : handleToggleVideo}
                  onLeaveCall={handleLeaveCall}
                  onMuteParticipant={handleMuteParticipant}
                  layout={currentLayout}
                  focusedParticipant={focusedParticipant}
                  onParticipantFocus={handleParticipantFocus}
                  hasSidePanel={!!activeSidePanel}
                  onKickParticipant={currentUser.role === 'teacher' ? (participantId) => {
                    const participant = participants.find(p => p.id === participantId);
                    if (participant) {
                      setKickingParticipant({ id: participant.id, name: participant.name });
                    }
                  } : undefined}
                />
              </div>
            </div>
          </div>

          {/* Side Panel */}
          {activeSidePanel && (
            <div
              className="fixed inset-0 z-40 bg-white flex flex-col w-full h-full lg:relative lg:inset-auto lg:w-80 lg:h-full lg:z-0 lg:bg-white"
            >
              {renderSidePanel()}
            </div>
          )}
        </div>

        {/* Bottom Control Bar - Google Meet Style */}
        <div className="bg-gray-800 p-2 sm:p-3 flex-shrink-0">
          {/* Mobile Layout */}
          <div className="flex lg:hidden items-center justify-between">
            {/* Left Side - Main Controls */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Audio Control */}
              {currentUser.role !== 'observer' && (
                <button
                  onClick={handleToggleAudio}
                  className={`p-2 sm:p-3 rounded-full transition-all ${
                    isAudioEnabled 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={isAudioEnabled ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
                >
                  {isAudioEnabled ? <FaMicrophone size={16} /> : <FaMicrophoneSlash size={16} />}
                </button>
              )}

              {/* Video Control */}
              {currentUser.role !== 'observer' && (
                <button
                  onClick={handleToggleVideo}
                  className={`p-2 sm:p-3 rounded-full transition-all ${
                    isVideoEnabled 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={isVideoEnabled ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                >
                  {isVideoEnabled ? <FaVideo size={16} /> : <FaVideoSlash size={16} />}
                </button>
              )}

              {/* Screen Share */}
              {(currentUser.role === 'teacher' || classSettings.allowStudentScreenShare) && (
                <button
                  onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                  className={`p-2 sm:p-3 rounded-full transition-all ${
                    isScreenSharing 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  title={isScreenSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş'}
                >
                  <FaDesktop size={16} />
                </button>
              )}

              {/* Hand Raise (Students) */}
              {currentUser.role === 'student' && classSettings.allowHandRaise && (
                <button
                  onClick={handleRaiseHand}
                  disabled={hasRaisedHand}
                  className={`p-2 sm:p-3 rounded-full transition-all ${
                    hasRaisedHand 
                      ? 'bg-yellow-600 text-white cursor-not-allowed' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white hover:bg-yellow-600'
                  }`}
                  title={hasRaisedHand ? 'Parmak Kaldırıldı' : 'Parmak Kaldır'}
                >
                  <FaHandPaper size={16} />
                </button>
              )}

              {/* Leave Call */}
              <button
                onClick={handleLeaveCall}
                className="p-2 sm:p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
                title="Aramayı Sonlandır"
              >
                <FaPhone size={16} />
              </button>
            </div>

            {/* Right Side - Panel Controls */}
            <div className="flex items-center">
              <button
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menüyü Aç"
              >
                <FaBars size={20} />
              </button>
            </div>

            {/* Hamburger Menu Modal */}
            {mobileMenuOpen && (
              <>
                {/* Overlay */}
                <div className="fixed inset-0 z-40 bg-black bg-opacity-40" onClick={() => setMobileMenuOpen(false)} />
                {/* Drawer */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed inset-0 z-50 w-full h-full bg-white shadow-2xl flex flex-col p-0 lg:top-0 lg:right-0 lg:w-80 lg:h-full lg:inset-y-0 lg:left-auto"
                >
                  <div className="flex items-center justify-between px-4 py-4 border-b">
                    <span className="font-semibold text-gray-800 text-lg">Menü</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                      <FaTimes size={22} />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col space-y-1 px-2 py-2 overflow-y-auto">
                    <button
                      onClick={() => { setMobileMenuOpen(false); setTimeout(() => toggleSidePanel('chat'), 200); }}
                      className={`flex items-center space-x-2 p-3 rounded-lg transition-all text-base ${activeSidePanel === 'chat' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      <FaComments /> <span>Sohbet</span>
                      {chatMessages.length > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{chatMessages.length > 9 ? '9+' : chatMessages.length}</span>
                      )}
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setTimeout(() => toggleSidePanel('participants'), 200); }}
                      className={`flex items-center space-x-2 p-3 rounded-lg transition-all text-base ${activeSidePanel === 'participants' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      <FaUserFriends /> <span>Katılımcılar</span>
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setTimeout(() => toggleSidePanel('documents'), 200); }}
                      className={`flex items-center space-x-2 p-3 rounded-lg transition-all text-base ${activeSidePanel === 'documents' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      <FaFile /> <span>Dokümanlar</span>
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setTimeout(() => toggleSidePanel('handraises'), 200); }}
                      className={`flex items-center space-x-2 p-3 rounded-lg transition-all text-base ${activeSidePanel === 'handraises' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      <FaHandPaper /> <span>Parmak Kaldıranlar</span>
                      {handRaises.filter(hr => hr.isActive).length > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{handRaises.filter(hr => hr.isActive).length}</span>
                      )}
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setTimeout(() => toggleSidePanel('layout'), 200); }}
                      className={`flex items-center space-x-2 p-3 rounded-lg transition-all text-base ${activeSidePanel === 'layout' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      <FaLayerGroup /> <span>Görünüm</span>
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setTimeout(() => toggleSidePanel('settings'), 200); }}
                      className={`flex items-center space-x-2 p-3 rounded-lg transition-all text-base ${activeSidePanel === 'settings' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      <FaWrench /> <span>Ayarlar</span>
                    </button>
                    {currentUser.role === 'teacher' && (
                      <>
                        <button
                          onClick={() => { setMobileMenuOpen(false); setTimeout(() => simulateStudentJoin(), 200); }}
                          className="flex items-center space-x-2 p-3 rounded-lg transition-all hover:bg-gray-100 text-gray-700 text-base"
                        >
                          <FaUserPlus /> <span>Öğrenci Ekle (Demo)</span>
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); setTimeout(() => handleMuteAll(), 200); }}
                          className="flex items-center space-x-2 p-3 rounded-lg transition-all hover:bg-gray-100 text-gray-700 text-base"
                        >
                          {isAllMuted ? <FaVolumeUp /> : <FaVolumeMute />} <span>{isAllMuted ? 'Hepsinin Sesini Aç' : 'Hepsini Sustur'}</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setMobileMenuOpen(false); setTimeout(() => toggleFullscreen(), 200); }}
                      className="flex items-center space-x-2 p-3 rounded-lg transition-all hover:bg-gray-100 text-gray-700 text-base"
                    >
                      {isFullscreen ? <FaCompress /> : <FaExpand />} <span>{isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-center relative">
            {/* Left Side - Meeting Info */}
            <div className="flex items-center space-x-4 text-white absolute left-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium truncate">{classSession.name}</span>
                <div className="w-px h-4 bg-gray-600"></div>
                <span className="text-sm text-gray-300">
                  {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Center - Main Controls */}
            <div className="flex items-center space-x-2">
              {/* Audio Control */}
              {currentUser.role !== 'observer' && (
                <button
                  onClick={handleToggleAudio}
                  className={`p-3 rounded-full transition-all ${
                    isAudioEnabled 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={isAudioEnabled ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
                >
                  {isAudioEnabled ? <FaMicrophone size={16} /> : <FaMicrophoneSlash size={16} />}
                </button>
              )}

              {/* Video Control */}
              {currentUser.role !== 'observer' && (
                <button
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-full transition-all ${
                    isVideoEnabled 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={isVideoEnabled ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                >
                  {isVideoEnabled ? <FaVideo size={16} /> : <FaVideoSlash size={16} />}
                </button>
              )}

              {/* Screen Share */}
              {(currentUser.role === 'teacher' || classSettings.allowStudentScreenShare) && (
                <button
                  onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                  className={`p-3 rounded-full transition-all ${
                    isScreenSharing 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  title={isScreenSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş'}
                >
                  <FaDesktop size={16} />
                </button>
              )}

              {/* Hand Raise (Students) */}
              {currentUser.role === 'student' && classSettings.allowHandRaise && (
                <button
                  onClick={handleRaiseHand}
                  disabled={hasRaisedHand}
                  className={`p-3 rounded-full transition-all ${
                    hasRaisedHand 
                      ? 'bg-yellow-600 text-white cursor-not-allowed' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white hover:bg-yellow-600'
                  }`}
                  title={hasRaisedHand ? 'Parmak Kaldırıldı' : 'Parmak Kaldır'}
                >
                  <FaHandPaper size={16} />
                </button>
              )}

              {/* Leave Call */}
              <button
                onClick={handleLeaveCall}
                className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
                title="Aramayı Sonlandır"
              >
                <FaPhone size={16} />
              </button>
            </div>

            {/* Right Side - Panel Controls & Participant Count */}
            <div className="flex items-center space-x-2 absolute right-0">
              {/* Participant Count */}
              <div className="text-white text-sm mr-2">
                <FaUsers size={14} className="inline mr-1" />
                {participants.length + 1}
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all"
                title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
              >
                {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
              </button>

              {/* Chat */}
              {((currentUser.role !== 'observer' && classSettings.allowStudentChat) || currentUser.role === 'teacher') && (
                <button
                  onClick={() => toggleSidePanel('chat')}
                  className={`p-2 rounded-lg transition-all relative ${
                    activeSidePanel === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  title="Sohbet"
                >
                  <FaComments size={14} />
                  {chatMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      {chatMessages.length > 9 ? '9+' : chatMessages.length}
                    </span>
                  )}
                </button>
              )}

              {/* Participants */}
              <button
                onClick={() => toggleSidePanel('participants')}
                className={`p-2 rounded-lg transition-all ${
                  activeSidePanel === 'participants' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="Katılımcılar"
              >
                <FaUserFriends size={14} />
              </button>

              {/* Teacher Only Options */}
              {currentUser.role === 'teacher' && (
                <>
                  {/* Documents Button */}
                  <button
                    onClick={() => toggleSidePanel('documents')}
                    className={`p-2 rounded-lg transition-all ${
                      activeSidePanel === 'documents' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                    title="Dokümanlar"
                  >
                    <FaFile size={14} />
                  </button>

                  {/* Hand Raises Button */}
                  <button
                    onClick={() => toggleSidePanel('handraises')}
                    className={`p-2 rounded-lg transition-all relative ${
                      activeSidePanel === 'handraises' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                    title="Parmak Kaldıranlar"
                  >
                    <FaHandPaper size={14} />
                    {handRaises.filter(hr => hr.isActive).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {handRaises.filter(hr => hr.isActive).length}
                      </span>
                    )}
                  </button>

                  {/* Mute All Button */}
                  <button
                    onClick={handleMuteAll}
                    className="p-2 rounded-lg transition-all bg-gray-700 hover:bg-gray-600 text-white"
                    title={isAllMuted ? 'Hepsinin Sesini Aç' : 'Hepsini Sustur'}
                  >
                    {isAllMuted ? <FaVolumeUp size={14} /> : <FaVolumeMute size={14} />}
                  </button>

                  {/* Add Student Demo Button */}
                  <button
                    onClick={simulateStudentJoin}
                    className="p-2 rounded-lg transition-all bg-gray-700 hover:bg-gray-600 text-white"
                    title="Öğrenci Ekle (Demo)"
                  >
                    <FaUserPlus size={14} />
                  </button>
                </>
              )}

              {/* Layout Button */}
              <button
                onClick={() => toggleSidePanel('layout')}
                className={`p-2 rounded-lg transition-all ${
                  activeSidePanel === 'layout' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="Layout"
              >
                <FaLayerGroup size={14} />
              </button>

              {/* Settings Button */}
              <button
                onClick={() => toggleSidePanel('settings')}
                className={`p-2 rounded-lg transition-all ${
                  activeSidePanel === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="Ayarlar"
              >
                <FaWrench size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Kick Participant Modal */}
        <KickParticipantModal
          participant={kickingParticipant}
          isOpen={!!kickingParticipant}
          onClose={() => setKickingParticipant(null)}
          onConfirm={handleKickParticipant}
        />
      </motion.div>
    </div>
  );
};