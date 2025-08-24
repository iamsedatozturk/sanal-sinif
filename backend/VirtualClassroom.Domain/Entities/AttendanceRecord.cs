using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace VirtualClassroom.Domain.Entities
{
    public class AttendanceRecord : FullAuditedAggregateRoot<Guid>
    {
        public Guid SessionId { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; }
        public DateTime JoinTime { get; set; }
        public DateTime? LeaveTime { get; set; }
        public int TotalDurationMinutes { get; set; }

        // Navigation properties
        public virtual ClassSession Session { get; set; }

        protected AttendanceRecord()
        {
        }

        public AttendanceRecord(
            Guid id,
            Guid sessionId,
            Guid studentId,
            string studentName,
            DateTime joinTime
        ) : base(id)
        {
            SessionId = sessionId;
            StudentId = studentId;
            StudentName = studentName;
            JoinTime = joinTime;
            TotalDurationMinutes = 0;
        }

        public void CalculateDuration()
        {
            if (LeaveTime.HasValue)
            {
                var duration = LeaveTime.Value - JoinTime;
                TotalDurationMinutes = (int)duration.TotalMinutes;
            }
            else
            {
                var duration = DateTime.UtcNow - JoinTime;
                TotalDurationMinutes = (int)duration.TotalMinutes;
            }
        }
    }
}