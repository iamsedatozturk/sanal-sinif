import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaComments, FaTimes, FaUsers, FaUser, FaBullhorn } from 'react-icons/fa';
import { ChatMessage } from '../../../types/models';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  isTeacher: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  participants: Array<{id: string; name: string; isTeacher: boolean}>;
  onSendPrivateMessage: (message: string, recipientId: string, recipientName: string) => void;
  onSendAnnouncement?: (message: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  currentUserName,
  isTeacher,
  isOpen,
  onClose,
  onSendMessage,
  participants,
  onSendPrivateMessage,
  onSendAnnouncement,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [messageMode, setMessageMode] = useState<'public' | 'private' | 'announcement'>('public');
  const [selectedRecipient, setSelectedRecipient] = useState<{id: string; name: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      if (messageMode === 'private' && selectedRecipient) {
        onSendPrivateMessage(newMessage.trim(), selectedRecipient.id, selectedRecipient.name);
      } else if (messageMode === 'announcement' && onSendAnnouncement) {
        onSendAnnouncement(newMessage.trim());
      } else {
        onSendMessage(newMessage.trim());
      }
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  const availableRecipients = participants.filter(p => p.id !== currentUserId);
  return (
    <div className="fixed right-4 bottom-4 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <FaComments className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-800">Sınıf Sohbeti</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FaTimes size={18} />
        </button>
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
          
          {isTeacher && (
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
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            Henüz mesaj bulunmamaktadır.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${
                message.messageType === 'announcement' ? 'w-full' : 
                message.senderId === currentUserId ? 'flex justify-end' : 'flex justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.messageType === 'announcement'
                    ? 'bg-red-100 text-red-800 border border-red-200 w-full text-center'
                    : message.messageType === 'private'
                    ? message.senderId === currentUserId
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-800 border border-green-200'
                    : message.senderId === currentUserId
                    ? 'bg-blue-600 text-white'
                    : message.isTeacher
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.senderId !== currentUserId && (
                  <div className="text-xs font-semibold mb-1">
                    {message.senderName}
                    {message.isTeacher && ' (Öğretmen)'}
                    {message.messageType === 'private' && message.recipientId === currentUserId && ' (Size özel)'}
                  </div>
                )}
                {message.messageType === 'private' && message.senderId === currentUserId && (
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
                      : message.senderId === currentUserId
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
};