using System;
using Volo.Abp.Application.Dtos;

namespace VirtualClassroom.Application.Contracts.ClassSessions
{
    public class ClassSessionDto : FullAuditedEntityDto<Guid>
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Subject { get; set; }
        public Guid TeacherId { get; set; }
        public string TeacherName { get; set; }
        public DateTime ScheduledStartTime { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int Duration { get; set; }
        public int MaxParticipants { get; set; }
        public bool IsActive { get; set; }
        public bool IsScheduled { get; set; }
        public int ParticipantCount { get; set; }
        public bool CanJoin { get; set; }
    }

    public class CreateClassSessionDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Subject { get; set; }
        public DateTime ScheduledStartTime { get; set; }
        public int Duration { get; set; } = 60;
        public int MaxParticipants { get; set; } = 30;
    }

    public class UpdateClassSessionDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Subject { get; set; }
        public DateTime ScheduledStartTime { get; set; }
        public int Duration { get; set; }
        public int MaxParticipants { get; set; }
    }

    public class GetClassSessionListDto : PagedAndSortedResultRequestDto
    {
        public bool? IsActive { get; set; }
        public Guid? TeacherId { get; set; }
    }

    public class AttendanceRecordDto : EntityDto<Guid>
    {
        public Guid SessionId { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; }
        public DateTime JoinTime { get; set; }
        public DateTime? LeaveTime { get; set; }
        public int TotalDurationMinutes { get; set; }
    }
}