export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStream?: (userId: string, stream: MediaStream) => void;

  // STUN servers for NAT traversal
  private rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          framerate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(this.rtcConfiguration);
    this.peerConnections.set(userId, peerConnection);

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      console.log('Remote stream received from user:', userId);
      this.onRemoteStream?.(userId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated for user:', userId, event.candidate);
        // In a real implementation, this would be sent via SignalR
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        console.log(`Successfully connected to ${userId}`);
      }
    };

    return peerConnection;
  }

  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) throw new Error('Peer connection not found');

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) throw new Error('Peer connection not found');

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) throw new Error('Peer connection not found');

    await peerConnection.setRemoteDescription(answer);
  }

  async addIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) throw new Error('Peer connection not found');

    await peerConnection.addIceCandidate(candidate);
  }

  onRemoteStreamReceived(callback: (userId: string, stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  closePeerConnection(userId: string): void {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }
  }

  closeAllConnections(): void {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}