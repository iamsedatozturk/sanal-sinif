using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using VirtualClassroom.Domain.Entities;
using VirtualClassroom.Application.Contracts.ClassSessions;

namespace VirtualClassroom.Application.Services
{
    [Authorize]
    public class ClassSessionAppService : ApplicationService, IClassSessionAppService
    {
        private readonly IRepository<ClassSession, Guid> _classSessionRepository;
        private readonly IRepository<Participant, Guid> _participantRepository;
        private readonly IRepository<AttendanceRecord, Guid> _attendanceRepository;

        public ClassSessionAppService(
            IRepository<ClassSession, Guid> classSessionRepository,
            IRepository<Participant, Guid> participantRepository,
            IRepository<AttendanceRecord, Guid> attendanceRepository)
        {
            _classSessionRepository = classSessionRepository;
            _participantRepository = participantRepository;
            _attendanceRepository = attendanceRepository;
        }

        public async Task<ClassSessionDto> CreateAsync(CreateClassSessionDto input)
        {
            var classSession = new ClassSession(
                GuidGenerator.Create(),
                input.Name,
                input.Description,
                input.Subject,
                CurrentUser.GetId(),
                CurrentUser.Name,
                input.ScheduledStartTime,
                input.Duration,
                input.MaxParticipants
            );

            await _classSessionRepository.InsertAsync(classSession);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<ClassSession, ClassSessionDto>(classSession);
        }

        public async Task<PagedResultDto<ClassSessionDto>> GetListAsync(GetClassSessionListDto input)
        {
            var query = await _classSessionRepository.GetQueryableAsync();
            
            if (input.IsActive.HasValue)
            {
                query = query.Where(x => x.IsActive == input.IsActive.Value);
            }

            if (input.TeacherId.HasValue)
            {
                query = query.Where(x => x.TeacherId == input.TeacherId.Value);
            }

            var totalCount = query.Count();
            var items = query
                .OrderBy(x => x.ScheduledStartTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToList();

            return new PagedResultDto<ClassSessionDto>(
                totalCount,
                ObjectMapper.Map<List<ClassSession>, List<ClassSessionDto>>(items)
            );
        }

        public async Task<ClassSessionDto> GetAsync(Guid id)
        {
            var classSession = await _classSessionRepository.GetAsync(id);
            return ObjectMapper.Map<ClassSession, ClassSessionDto>(classSession);
        }

        public async Task<ClassSessionDto> UpdateAsync(Guid id, UpdateClassSessionDto input)
        {
            var classSession = await _classSessionRepository.GetAsync(id);

            if (classSession.TeacherId != CurrentUser.GetId())
            {
                throw new UnauthorizedAccessException("Only the teacher can update this class");
            }

            if (classSession.IsActive)
            {
                throw new InvalidOperationException("Cannot update an active class");
            }

            classSession.Name = input.Name;
            classSession.Description = input.Description;
            classSession.Subject = input.Subject;
            classSession.ScheduledStartTime = input.ScheduledStartTime;
            classSession.Duration = input.Duration;
            classSession.MaxParticipants = input.MaxParticipants;

            await _classSessionRepository.UpdateAsync(classSession);
            return ObjectMapper.Map<ClassSession, ClassSessionDto>(classSession);
        }

        public async Task DeleteAsync(Guid id)
        {
            var classSession = await _classSessionRepository.GetAsync(id);

            if (classSession.TeacherId != CurrentUser.GetId())
            {
                throw new UnauthorizedAccessException("Only the teacher can delete this class");
            }

            if (classSession.IsActive)
            {
                throw new InvalidOperationException("Cannot delete an active class");
            }

            await _classSessionRepository.DeleteAsync(id);
        }

        public async Task<ClassSessionDto> StartClassAsync(Guid id)
        {
            var classSession = await _classSessionRepository.GetAsync(id);

            if (classSession.TeacherId != CurrentUser.GetId())
            {
                throw new UnauthorizedAccessException("Only the teacher can start this class");
            }

            if (!classSession.CanJoin())
            {
                throw new InvalidOperationException("Class cannot be started at this time");
            }

            classSession.StartClass();
            await _classSessionRepository.UpdateAsync(classSession);

            return ObjectMapper.Map<ClassSession, ClassSessionDto>(classSession);
        }

        public async Task EndClassAsync(Guid id)
        {
            var classSession = await _classSessionRepository.GetAsync(id);

            if (classSession.TeacherId != CurrentUser.GetId())
            {
                throw new UnauthorizedAccessException("Only the teacher can end this class");
            }

            classSession.EndClass();
            await _classSessionRepository.UpdateAsync(classSession);

            // Update attendance records
            var activeAttendances = await _attendanceRepository.GetListAsync(
                x => x.SessionId == id && x.LeaveTime == null
            );

            foreach (var attendance in activeAttendances)
            {
                attendance.LeaveTime = DateTime.UtcNow;
                attendance.CalculateDuration();
                await _attendanceRepository.UpdateAsync(attendance);
            }
        }

        public async Task<ClassSessionDto> JoinClassAsync(Guid id)
        {
            var classSession = await _classSessionRepository.GetAsync(id);

            if (!classSession.CanJoin())
            {
                throw new InvalidOperationException("Cannot join this class at this time");
            }

            if (classSession.ParticipantCount >= classSession.MaxParticipants)
            {
                throw new InvalidOperationException("Class is full");
            }

            // Check if user is already in the class
            var existingParticipant = await _participantRepository.FirstOrDefaultAsync(
                x => x.SessionId == id && x.UserId == CurrentUser.GetId()
            );

            if (existingParticipant == null)
            {
                // Add participant
                var participant = new Participant(
                    GuidGenerator.Create(),
                    id,
                    CurrentUser.GetId(),
                    CurrentUser.Name,
                    CurrentUser.Email,
                    false // isTeacher
                );

                await _participantRepository.InsertAsync(participant);

                // Create attendance record
                var attendance = new AttendanceRecord(
                    GuidGenerator.Create(),
                    id,
                    CurrentUser.GetId(),
                    CurrentUser.Name,
                    DateTime.UtcNow
                );

                await _attendanceRepository.InsertAsync(attendance);

                // Update participant count
                classSession.ParticipantCount++;
                await _classSessionRepository.UpdateAsync(classSession);
            }

            return ObjectMapper.Map<ClassSession, ClassSessionDto>(classSession);
        }

        public async Task LeaveClassAsync(Guid id)
        {
            var participant = await _participantRepository.FirstOrDefaultAsync(
                x => x.SessionId == id && x.UserId == CurrentUser.GetId()
            );

            if (participant != null)
            {
                await _participantRepository.DeleteAsync(participant);

                // Update attendance record
                var attendance = await _attendanceRepository.FirstOrDefaultAsync(
                    x => x.SessionId == id && x.StudentId == CurrentUser.GetId() && x.LeaveTime == null
                );

                if (attendance != null)
                {
                    attendance.LeaveTime = DateTime.UtcNow;
                    attendance.CalculateDuration();
                    await _attendanceRepository.UpdateAsync(attendance);
                }

                // Update participant count
                var classSession = await _classSessionRepository.GetAsync(id);
                classSession.ParticipantCount = Math.Max(0, classSession.ParticipantCount - 1);
                await _classSessionRepository.UpdateAsync(classSession);
            }
        }

        public async Task<List<AttendanceRecordDto>> GetAttendanceAsync(Guid sessionId)
        {
            var classSession = await _classSessionRepository.GetAsync(sessionId);

            if (classSession.TeacherId != CurrentUser.GetId())
            {
                throw new UnauthorizedAccessException("Only the teacher can view attendance");
            }

            var attendanceRecords = await _attendanceRepository.GetListAsync(
                x => x.SessionId == sessionId
            );

            return ObjectMapper.Map<List<AttendanceRecord>, List<AttendanceRecordDto>>(attendanceRecords);
        }
    }
}