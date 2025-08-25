import * as signalR from '@microsoft/signalr';
import { SignalingMessage, AttendanceRecord, HandRaise, PresentationState, ChatMessage } from '../types/models';

export class SignalRService {
  private connection!: signalR.HubConnection;
  private isConnected: boolean = false;
  private demoMode: boolean = true; // Start in demo mode by default
  private onSignalingMessage?: (message: SignalingMessage) => void;
  private onAttendanceUpdate?: (record: AttendanceRecord) => void;
  private onParticipantJoined?: (userId: string, name: string) => void;
  private onParticipantLeft?: (userId: string) => void;
  private onChatMessage?: (message: ChatMessage) => void;
  private onParticipantMuted?: (userId: string, isMuted: boolean) => void;
  private onHandRaiseReceived?: (handRaise: HandRaise) => void;
  private onHandRaiseDismissed?: (handRaiseId: string) => void;
  private onPresentationStarted?: (presentation: PresentationState) => void;
  private onPresentationStopped?: () => void;
  private onPresentationPageChanged?: (page: number) => void;

  constructor() {
    // Only initialize connection if not in demo mode
    if (!this.demoMode) {
      // In production, replace with your actual SignalR hub URL
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('https://localhost:5001/classroomhub', {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .build();

      this.setupEventHandlers();
    }
  }

  private setupEventHandlers() {
    if (this.demoMode || !this.connection) return;
    
    this.connection.on('ReceiveSignalingMessage', (message: SignalingMessage) => {
      this.onSignalingMessage?.(message);
    });

    this.connection.on('AttendanceUpdated', (record: AttendanceRecord) => {
      this.onAttendanceUpdate?.(record);
    });

    this.connection.on('ParticipantJoined', (userId: string, name: string) => {
      this.onParticipantJoined?.(userId, name);
    });

    this.connection.on('ParticipantLeft', (userId: string) => {
      this.onParticipantLeft?.(userId);
    });

    this.connection.on('ChatMessage', (message: any) => {
      this.onChatMessage?.(message);
    });

    this.connection.on('ParticipantMuted', (userId: string, isMuted: boolean) => {
      this.onParticipantMuted?.(userId, isMuted);
    });

    this.connection.on('HandRaiseReceived', (handRaise: HandRaise) => {
      this.onHandRaiseReceived?.(handRaise);
    });

    this.connection.on('HandRaiseDismissed', (handRaiseId: string) => {
      this.onHandRaiseDismissed?.(handRaiseId);
    });

    this.connection.on('PresentationStarted', (presentation: PresentationState) => {
      this.onPresentationStarted?.(presentation);
    });

    this.connection.on('PresentationStopped', () => {
      this.onPresentationStopped?.();
    });

    this.connection.on('PresentationPageChanged', (page: number) => {
      this.onPresentationPageChanged?.(page);
    });

    this.connection.onreconnected(() => {
      console.log('SignalR reconnected');
    });

    this.connection.onclose(() => {
      console.log('SignalR connection closed');
    });
  }

  async start(): Promise<void> {
    if (this.demoMode) {
      console.log('SignalR running in demo mode - no backend connection required');
      return;
    }

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log('SignalR connection started');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      // Switch to demo mode if connection fails
      this.demoMode = true;
      this.isConnected = false;
      console.log('Switched to demo mode - SignalR simulation active');
    }
  }

  async joinClass(sessionId: string, userId: string, userName: string): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating join class for', userName);
      // Simulate successful join in demo mode
      // Don't auto-add participants in demo mode - let manual simulation handle this
      return;
    }

    try {
      await this.connection.invoke('JoinClass', sessionId, userId, userName);
    } catch (error) {
      console.error('Error joining class:', error);
    }
  }

  async leaveClass(sessionId: string, userId: string): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating leave class for user', userId);
      // Simulate successful leave in demo mode
      setTimeout(() => {
        this.onParticipantLeft?.(userId);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('LeaveClass', sessionId, userId);
    } catch (error) {
      console.error('Error leaving class:', error);
    }
  }

  async sendSignalingMessage(message: SignalingMessage): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating signaling message', message.type);
      // In demo mode, we can't send real signaling messages
      // WebRTC will need to work in local-only mode
      return;
    }

    try {
      await this.connection.invoke('SendSignalingMessage', message);
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  }

  async sendChatMessage(sessionId: string, senderId: string, senderName: string, message: string, isTeacher: boolean): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating chat message from', senderName);
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId,
        senderName,
        message,
        timestamp: new Date().toISOString(),
        isTeacher,
        messageType: 'public'
      };
      setTimeout(() => {
        this.onChatMessage?.(chatMessage);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('SendChatMessage', sessionId, senderId, senderName, message, isTeacher, 'public');
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  }

  async sendPrivateMessage(sessionId: string, senderId: string, senderName: string, message: string, recipientId: string, recipientName: string, isTeacher: boolean): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating private message from', senderName, 'to', recipientName);
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId,
        senderName,
        message,
        timestamp: new Date().toISOString(),
        isTeacher,
        recipientId,
        recipientName,
        messageType: 'private'
      };
      setTimeout(() => {
        this.onChatMessage?.(chatMessage);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('SendPrivateMessage', sessionId, senderId, senderName, message, recipientId, recipientName, isTeacher);
    } catch (error) {
      console.error('Error sending private message:', error);
    }
  }

  async sendAnnouncement(sessionId: string, senderId: string, senderName: string, message: string): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating announcement from', senderName);
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId,
        senderName,
        message,
        timestamp: new Date().toISOString(),
        isTeacher: true,
        messageType: 'announcement'
      };
      setTimeout(() => {
        this.onChatMessage?.(chatMessage);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('SendAnnouncement', sessionId, senderId, senderName, message);
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  }

  async muteParticipant(sessionId: string, userId: string, isMuted: boolean): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating mute participant', userId, isMuted);
      setTimeout(() => {
        this.onParticipantMuted?.(userId, isMuted);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('MuteParticipant', sessionId, userId, isMuted);
    } catch (error) {
      console.error('Error muting participant:', error);
    }
  }

  async raiseHand(sessionId: string, studentId: string, studentName: string): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating hand raise from', studentName);
      const handRaise: HandRaise = {
        id: `hand-${Date.now()}`,
        studentId,
        studentName,
        timestamp: new Date().toISOString(),
        isActive: true
      };
      setTimeout(() => {
        this.onHandRaiseReceived?.(handRaise);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('RaiseHand', sessionId, studentId, studentName);
    } catch (error) {
      console.error('Error raising hand:', error);
    }
  }

  async kickParticipant(sessionId: string, participantId: string): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating kick participant', participantId);
      setTimeout(() => {
        this.onParticipantLeft?.(participantId);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('KickParticipant', sessionId, participantId);
    } catch (error) {
      console.error('Error kicking participant:', error);
    }
  }

  async approveHandRaise(sessionId: string, handRaiseId: string): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating hand raise approval');
      setTimeout(() => {
        this.onHandRaiseDismissed?.(handRaiseId);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('ApproveHandRaise', sessionId, handRaiseId);
    } catch (error) {
      console.error('Error approving hand raise:', error);
    }
  }

  async dismissHandRaise(sessionId: string, handRaiseId: string): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating hand raise dismissal');
      setTimeout(() => {
        this.onHandRaiseDismissed?.(handRaiseId);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('DismissHandRaise', sessionId, handRaiseId);
    } catch (error) {
      console.error('Error dismissing hand raise:', error);
    }
  }

  async startPresentation(sessionId: string, presentation: PresentationState): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating presentation start');
      setTimeout(() => {
        this.onPresentationStarted?.(presentation);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('StartPresentation', sessionId, presentation);
    } catch (error) {
      console.error('Error starting presentation:', error);
    }
  }

  async stopPresentation(sessionId: string): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating presentation stop');
      setTimeout(() => {
        this.onPresentationStopped?.();
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('StopPresentation', sessionId);
    } catch (error) {
      console.error('Error stopping presentation:', error);
    }
  }

  async changePresentationPage(sessionId: string, page: number): Promise<void> {
    if (this.demoMode || !this.isConnected) {
      console.log('Demo mode: Simulating page change to', page);
      setTimeout(() => {
        this.onPresentationPageChanged?.(page);
      }, 100);
      return;
    }

    try {
      await this.connection.invoke('ChangePresentationPage', sessionId, page);
    } catch (error) {
      console.error('Error changing presentation page:', error);
    }
  }

  setSignalingHandler(callback: (message: SignalingMessage) => void) {
    this.onSignalingMessage = callback;
  }

  setAttendanceUpdatedHandler(callback: (record: AttendanceRecord) => void) {
    this.onAttendanceUpdate = callback;
  }

  setParticipantJoinHandler(callback: (userId: string, name: string) => void) {
    this.onParticipantJoined = callback;
  }

  setParticipantLeaveHandler(callback: (userId: string) => void) {
    this.onParticipantLeft = callback;
  }

  setChatMessageReceivedHandler(callback: (message: ChatMessage) => void) {
    this.onChatMessage = callback;
  }

  setParticipantMutedHandler(callback: (userId: string, isMuted: boolean) => void) {
    this.onParticipantMuted = callback;
  }

  setHandRaiseReceivedHandler(callback: (handRaise: HandRaise) => void) {
    this.onHandRaiseReceived = callback;
  }

  setHandRaiseDismissedHandler(callback: (handRaiseId: string) => void) {
    this.onHandRaiseDismissed = callback;
  }

  setPresentationStartedHandler(callback: (presentation: PresentationState) => void) {
    this.onPresentationStarted = callback;
  }

  setPresentationStoppedHandler(callback: () => void) {
    this.onPresentationStopped = callback;
  }

  setPresentationPageChangedHandler(callback: (page: number) => void) {
    this.onPresentationPageChanged = callback;
  }

  async disconnect(): Promise<void> {
    if (this.isConnected && this.connection) {
      await this.connection.stop();
      this.isConnected = false;
    }
  }

  isInDemoMode(): boolean {
    return this.demoMode;
  }

  getConnectionState(): boolean {
    return this.isConnected;
  }
}