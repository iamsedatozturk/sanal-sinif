using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace VirtualClassroom.Application.Contracts.ClassSessions
{
    public interface IClassSessionAppService : IApplicationService
    {
        Task<ClassSessionDto> CreateAsync(CreateClassSessionDto input);
        Task<PagedResultDto<ClassSessionDto>> GetListAsync(GetClassSessionListDto input);
        Task<ClassSessionDto> GetAsync(Guid id);
        Task<ClassSessionDto> UpdateAsync(Guid id, UpdateClassSessionDto input);
        Task DeleteAsync(Guid id);
        Task<ClassSessionDto> StartClassAsync(Guid id);
        Task EndClassAsync(Guid id);
        Task<ClassSessionDto> JoinClassAsync(Guid id);
        Task LeaveClassAsync(Guid id);
        Task<List<AttendanceRecordDto>> GetAttendanceAsync(Guid sessionId);
    }
}