using AutoMapper;
using VirtualClassroom.Application.Contracts.ClassSessions;
using VirtualClassroom.Domain.Entities;

namespace VirtualClassroom.Application
{
    public class VirtualClassroomApplicationAutoMapperProfile : Profile
    {
        public VirtualClassroomApplicationAutoMapperProfile()
        {
            CreateMap<ClassSession, ClassSessionDto>()
                .ForMember(dest => dest.CanJoin, opt => opt.MapFrom(src => src.CanJoin()));

            CreateMap<CreateClassSessionDto, ClassSession>();
            CreateMap<UpdateClassSessionDto, ClassSession>();

            CreateMap<AttendanceRecord, AttendanceRecordDto>();
            CreateMap<Participant, ParticipantDto>();
            CreateMap<ChatMessage, ChatMessageDto>();
        }
    }

    public class ParticipantDto
    {
        public Guid Id { get; set; }
        public Guid SessionId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public bool IsTeacher { get; set; }
        public bool IsAudioMuted { get; set; }
        public bool IsVideoMuted { get; set; }
        public DateTime JoinTime { get; set; }
    }

    public class ChatMessageDto
    {
        public Guid Id { get; set; }
        public Guid SessionId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsTeacher { get; set; }
    }
}