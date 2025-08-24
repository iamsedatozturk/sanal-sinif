using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace VirtualClassroom.Domain.Entities
{
    public class ChatMessage : FullAuditedAggregateRoot<Guid>
    {
        public Guid SessionId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsTeacher { get; set; }

        // Navigation properties
        public virtual ClassSession Session { get; set; }

        protected ChatMessage()
        {
        }

        public ChatMessage(
            Guid id,
            Guid sessionId,
            Guid senderId,
            string senderName,
            string message,
            bool isTeacher
        ) : base(id)
        {
            SessionId = sessionId;
            SenderId = senderId;
            SenderName = senderName;
            Message = message;
            IsTeacher = isTeacher;
            Timestamp = DateTime.UtcNow;
        }
    }
}