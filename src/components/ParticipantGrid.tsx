import React from 'react';
import { FaMicrophoneSlash, FaExpand, FaUserTimes } from 'react-icons/fa';
import { VideoPlayer } from './VideoPlayer';
import { Participant, VideoLayout } from '../types';

interface ParticipantGridProps {
  participants: Participant[];
  localStream?: MediaStream;
  currentUserId: string;
  currentUserName: string;
  isTeacher: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeaveCall: () => void;
  onMuteParticipant?: (participantId: string, isMuted: boolean) => void;
  layout: VideoLayout;
  focusedParticipant?: string;
  onParticipantFocus?: (participantId: string | undefined) => void;
  onKickParticipant?: (participantId: string) => void;
  hasSidePanel?: boolean;
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  participants,
  localStream,
  currentUserId,
  currentUserName,
  isTeacher,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeaveCall,
  onMuteParticipant,
  layout,
  focusedParticipant,
  onParticipantFocus,
  onKickParticipant,
  hasSidePanel = false,
}) => {
  // Only show current user's video once
  const currentUserParticipant = {
    id: currentUserId,
    name: currentUserName,
    isTeacher,
    stream: localStream,
  };

  // Eğer hiç katılımcı yoksa ve localStream de yoksa hiçbir şey render etme
  if (!localStream && (!participants || participants.length === 0)) {
    return null;
  }

  const allParticipants = [currentUserParticipant, ...participants];

  // Ortak ana video kutusu container class'ı
  const mainVideoContainerClass = "w-full h-full flex flex-col justify-center";

  const renderGridLayout = () => {
    const getGridClass = (participantCount: number) => {
      if (participantCount === 1) return 'grid-cols-1';
      if (participantCount <= 2) return 'grid-cols-1 md:grid-cols-2';
      if (participantCount <= 4) return 'grid-cols-1 md:grid-cols-2';
      if (participantCount <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    };

    const getGridRows = (participantCount: number) => {
      if (participantCount === 1) return 'grid-rows-1';
      if (participantCount <= 2) return 'grid-rows-1 md:grid-rows-1';
      if (participantCount <= 4) return 'grid-rows-2';
      if (participantCount <= 6) return 'grid-rows-2 lg:grid-rows-2';
      return 'grid-rows-3';
    };

    // Sağ panel açık/kapalı fark etmeksizin oranlar ve boyutlar aynı olmalı
    return (
      <div className="h-full flex items-center justify-center p-0">
        <div className={mainVideoContainerClass}>
          <div className={`h-full grid ${getGridClass(allParticipants.length)} ${getGridRows(allParticipants.length)} gap-3 place-items-stretch`}>
            {allParticipants.map((participant) => (
              <div key={participant.id} className="w-full h-full max-h-full flex items-stretch justify-stretch">
                <div className="w-full h-full rounded-xl overflow-hidden flex">
                  {renderParticipant(participant, false)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSidebarLayout = () => {
    const mainParticipant = focusedParticipant 
      ? allParticipants.find(p => p.id === focusedParticipant) || allParticipants[0]
      : allParticipants[0];
    const otherParticipants = allParticipants.filter(p => p.id !== mainParticipant.id);

  const padding = hasSidePanel ? 'p-2' : 'p-4';
  const sidebarWidth = hasSidePanel ? 'w-64 min-w-[16rem] max-w-[22rem]' : 'w-64 min-w-[12rem] max-w-[15rem]';

    // Eğer hiç katılımcı yoksa, video player öğretmen odaklı gibi ortalanır ve geniş olur
    return (
      <div className="h-full flex items-center justify-center p-0">
        <div className={mainVideoContainerClass}>
          <div className="flex h-full">
            <div className={`flex-1 min-w-0 flex items-center justify-center`}>
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-full rounded-xl overflow-hidden transition-all duration-200">
                  {renderParticipant(mainParticipant, true)}
                </div>
              </div>
            </div>
            {otherParticipants.length > 0 && (
              <div className={`${sidebarWidth} p-2 overflow-y-auto rounded-l-lg h-full`}>
                <div className="flex flex-col gap-2 h-full min-w-0">
                  {otherParticipants.map((participant) => (
                    <div key={participant.id} className="rounded-lg border border-blue-300/40 shadow shadow-blue-200/20 backdrop-blur-sm transition-all duration-200">
                      {renderParticipant(participant, false, true)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  const renderTeacherFocusLayout = () => {
    // Sadece öğretmen gösterilecek, katılımcılar asla gösterilmeyecek
    const teacher = allParticipants.find(p => p.isTeacher) || allParticipants[0];
    return (
      <div className="h-full flex items-center justify-center p-0">
        <div className={mainVideoContainerClass}>
          <div className="h-full w-full max-h-full flex items-center justify-center">
            {renderParticipant(teacher, true)}
          </div>
        </div>
      </div>
    );
  };

  const renderParticipant = (participant: Participant, isMain: boolean = false, isSmall: boolean = false) => (
    <div
      key={participant.id}
      className={`relative w-full h-full ${isMain ? '' : isSmall ? 'aspect-video' : ''} ${!isMain && onParticipantFocus ? 'cursor-pointer' : ''}`}
      onClick={() => !isMain && onParticipantFocus?.(participant.id)}
      style={{ minHeight: 0, minWidth: 0 }}
    >
      <div className="absolute inset-0 w-full h-full">
        <VideoPlayer
          stream={participant.stream}
          isLocal={participant.id === currentUserId}
          userName={participant.name}
          isAudioEnabled={participant.id === currentUserId ? isAudioEnabled : !participant.isAudioMuted}
          isVideoEnabled={participant.id === currentUserId ? isVideoEnabled : !participant.isVideoMuted}
          onToggleAudio={participant.id === currentUserId ? onToggleAudio : undefined}
          onToggleVideo={participant.id === currentUserId ? onToggleVideo : undefined}
          onLeaveCall={participant.id === currentUserId ? onLeaveCall : undefined}
        />
      </div>
      {/* Teacher controls for students */}
      {isTeacher && participant.id !== currentUserId && (
        <div className="absolute top-2 left-2 flex space-x-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMuteParticipant?.(participant.id, !participant.isAudioMuted);
            }}
            className={`p-1 rounded-full text-white text-xs ${
              participant.isAudioMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            } transition-colors`}
            title={participant.isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            <FaMicrophoneSlash size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onKickParticipant?.(participant.id);
            }}
            className="p-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs transition-colors"
            title="Sınıftan Çıkar"
          >
            <FaUserTimes size={12} />
          </button>
        </div>
      )}
      {/* Expand button for non-main participants */}
      {!isMain && onParticipantFocus && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onParticipantFocus(participant.id);
            }}
            className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
            title="Büyüt"
          >
            <FaExpand size={12} />
          </button>
        </div>
      )}
    </div>
  );

  const renderLayout = () => {
    switch (layout.type) {
      case 'sidebar':
        return renderSidebarLayout();
      case 'teacher-focus':
        return renderTeacherFocusLayout();
      default:
        return renderGridLayout();
    }
  };

  return <div className="h-full min-h-0 flex flex-col">{renderLayout()}</div>;
};