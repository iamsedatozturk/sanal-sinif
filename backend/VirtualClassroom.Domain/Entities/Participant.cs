using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace VirtualClassroom.Domain.Entities
{
    public class Participant : FullAuditedAggregateRoot<Guid>
    {
        public Guid SessionId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public bool IsTeacher { get; set; }
        public bool IsAudioMuted { get; set; }
        public bool IsVideoMuted { get; set; }
        public DateTime JoinTime { get; set; }
        public string ConnectionId { get; set; }

        // Navigation properties
        public virtual ClassSession Session { get; set; }

        protected Participant()
        {
        }

        public Participant(
            Guid id,
            Guid sessionId,
            Guid userId,
            string userName,
            string userEmail,
            bool isTeacher
        ) : base(id)
        {
            SessionId = sessionId;
            UserId = userId;
            UserName = userName;
            UserEmail = userEmail;
            IsTeacher = isTeacher;
            IsAudioMuted = false;
            IsVideoMuted = false;
            JoinTime = DateTime.UtcNow;
        }

        public void MuteAudio()
        {
            IsAudioMuted = true;
        }

        public void UnmuteAudio()
        {
            IsAudioMuted = false;
        }

        public void MuteVideo()
        {
            IsVideoMuted = true;
        }

        public void UnmuteVideo()
        {
            IsVideoMuted = false;
        }

        public void UpdateConnectionId(string connectionId)
        {
            ConnectionId = connectionId;
        }
    }
}