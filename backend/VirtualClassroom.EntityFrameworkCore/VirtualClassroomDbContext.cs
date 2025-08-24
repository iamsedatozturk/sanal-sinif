using Microsoft.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.EntityFrameworkCore;
using VirtualClassroom.Domain.Entities;

namespace VirtualClassroom.EntityFrameworkCore
{
    [ConnectionStringName("Default")]
    public class VirtualClassroomDbContext : AbpDbContext<VirtualClassroomDbContext>
    {
        public DbSet<ClassSession> ClassSessions { get; set; }
        public DbSet<Participant> Participants { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        public VirtualClassroomDbContext(DbContextOptions<VirtualClassroomDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.ConfigureVirtualClassroom();
        }
    }
}