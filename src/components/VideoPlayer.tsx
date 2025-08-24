import React, { useRef, useEffect } from 'react';
import { FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';

// VideoOff component replacement
const VideoOff: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <FaVideoSlash size={size} className={className} />
);

interface VideoPlayerProps {
  stream?: MediaStream;
  isLocal?: boolean;
  userName: string;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onLeaveCall?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  isLocal = false,
  userName,
  isAudioEnabled = true,
  isVideoEnabled = true,
  onToggleAudio,
  onToggleVideo,
  onLeaveCall,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden p-2 h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      
      {/* User name overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {userName} {isLocal && '(You)'}
      </div>

      {/* Video disabled overlay */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <VideoOff size={32} className="mx-auto mb-2 text-white" />
            <p className="text-sm">{userName}</p>
          </div>
        </div>
      )}

      {/* Audio indicator */}
      {!isAudioEnabled && (
        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
          <FaMicrophoneSlash size={16} className="text-white" />
        </div>
      )}
    </div>
  );
};