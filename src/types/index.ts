export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'observer';
}

export interface ClassSession {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  scheduledStartTime: string;
  endTime?: string;
  isActive: boolean;
  isScheduled: boolean;
  participantCount: number;
  maxParticipants?: number;
  subject?: string;
  duration?: number; // in minutes
  settings?: ClassSettings;
}

export interface ClassSettings {
  allowHandRaise: boolean;
  defaultMicrophoneState: 'muted' | 'unmuted';
  defaultCameraState: 'on' | 'off';
  defaultLayout: string;
  allowStudentScreenShare: boolean;
  allowStudentChat: boolean;
  allowPrivateMessages: boolean;
  autoMuteNewParticipants: boolean;
  recordSession: boolean;
  waitingRoomEnabled: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  joinTime: string;
  leaveTime?: string;
  totalDurationMinutes: number;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  fromUserId: string;
  toUserId: string;
  data: any;
}

export interface Participant {
  id: string;
  name: string;
  isTeacher: boolean;
  isObserver?: boolean;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  stream?: MediaStream;
  screenStream?: MediaStream;
  isScreenSharing?: boolean;
  peerConnection?: RTCPeerConnection;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isTeacher: boolean;
  recipientId?: string; // Özel mesaj için
  recipientName?: string;
  messageType: 'public' | 'private' | 'announcement';
}

export interface VideoLayout {
  id: string;
  name: string;
  type: 'grid' | 'sidebar' | 'teacher-focus';
  description: string;
}

export interface TeacherLayout extends VideoLayout {
  id: 'teacher-focus';
  name: 'Öğretmen Odaklı';
  type: 'teacher-focus';
  description: 'Öğretmen tam ekranda, öğrenciler küçük panelde';
}

export interface ScheduledClass {
  id: string;
  name: string;
  scheduledTime: string;
  duration: number;
  canJoin: boolean;
}

export interface HandRaise {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  isActive: boolean;
}

export interface ClassDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  isPresentation?: boolean;
  totalPages?: number;
}



export interface ScreenShareRequest {
  userId: string;
  userName: string;
  isActive: boolean;
}