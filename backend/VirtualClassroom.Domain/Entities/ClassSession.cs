using System;
using System.Collections.Generic;
using Volo.Abp.Domain.Entities.Auditing;

namespace VirtualClassroom.Domain.Entities
{
    public class ClassSession : FullAuditedAggregateRoot<Guid>
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Subject { get; set; }
        public Guid TeacherId { get; set; }
        public string TeacherName { get; set; }
        public DateTime ScheduledStartTime { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int Duration { get; set; } // minutes
        public int MaxParticipants { get; set; }
        public bool IsActive { get; set; }
        public bool IsScheduled { get; set; }
        public int ParticipantCount { get; set; }
        
        public virtual ICollection<Participant> Participants { get; set; }
        public virtual ICollection<AttendanceRecord> AttendanceRecords { get; set; }
        public virtual ICollection<ChatMessage> ChatMessages { get; set; }

        protected ClassSession()
        {
            Participants = new HashSet<Participant>();
            AttendanceRecords = new HashSet<AttendanceRecord>();
            ChatMessages = new HashSet<ChatMessage>();
        }

        public ClassSession(
            Guid id,
            string name,
            string description,
            string subject,
            Guid teacherId,
            string teacherName,
            DateTime scheduledStartTime,
            int duration,
            int maxParticipants
        ) : base(id)
        {
            Name = name;
            Description = description;
            Subject = subject;
            TeacherId = teacherId;
            TeacherName = teacherName;
            ScheduledStartTime = scheduledStartTime;
            Duration = duration;
            MaxParticipants = maxParticipants;
            IsActive = false;
            IsScheduled = true;
            ParticipantCount = 0;
            
            Participants = new HashSet<Participant>();
            AttendanceRecords = new HashSet<AttendanceRecord>();
            ChatMessages = new HashSet<ChatMessage>();
        }

        public void StartClass()
        {
            if (IsActive)
                throw new InvalidOperationException("Class is already active");
                
            IsActive = true;
            ActualStartTime = DateTime.UtcNow;
        }

        public void EndClass()
        {
            if (!IsActive)
                throw new InvalidOperationException("Class is not active");
                
            IsActive = false;
            EndTime = DateTime.UtcNow;
        }

        public bool CanJoin()
        {
            var now = DateTime.UtcNow;
            var tenMinutesBefore = ScheduledStartTime.AddMinutes(-10);
            var twoHoursAfter = ScheduledStartTime.AddHours(2);
            
            return now >= tenMinutesBefore && now <= twoHoursAfter && ParticipantCount < MaxParticipants;
        }
    }
}