using Microsoft.EntityFrameworkCore;
using Volo.Abp;
using Volo.Abp.EntityFrameworkCore.Modeling;
using VirtualClassroom.Domain.Entities;

namespace VirtualClassroom.EntityFrameworkCore
{
    public static class VirtualClassroomDbContextModelCreatingExtensions
    {
        public static void ConfigureVirtualClassroom(this ModelBuilder builder)
        {
            Check.NotNull(builder, nameof(builder));

            // ClassSession
            builder.Entity<ClassSession>(b =>
            {
                b.ToTable("ClassSessions");
                b.ConfigureByConvention();

                b.Property(x => x.Name).IsRequired().HasMaxLength(200);
                b.Property(x => x.Description).HasMaxLength(1000);
                b.Property(x => x.Subject).HasMaxLength(100);
                b.Property(x => x.TeacherName).IsRequired().HasMaxLength(100);

                b.HasIndex(x => x.TeacherId);
                b.HasIndex(x => x.ScheduledStartTime);
                b.HasIndex(x => x.IsActive);

                // Relationships
                b.HasMany(x => x.Participants)
                    .WithOne(x => x.Session)
                    .HasForeignKey(x => x.SessionId)
                    .OnDelete(DeleteBehavior.Cascade);

                b.HasMany(x => x.AttendanceRecords)
                    .WithOne(x => x.Session)
                    .HasForeignKey(x => x.SessionId)
                    .OnDelete(DeleteBehavior.Cascade);

                b.HasMany(x => x.ChatMessages)
                    .WithOne(x => x.Session)
                    .HasForeignKey(x => x.SessionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Participant
            builder.Entity<Participant>(b =>
            {
                b.ToTable("Participants");
                b.ConfigureByConvention();

                b.Property(x => x.UserName).IsRequired().HasMaxLength(100);
                b.Property(x => x.UserEmail).HasMaxLength(200);
                b.Property(x => x.ConnectionId).HasMaxLength(100);

                b.HasIndex(x => x.SessionId);
                b.HasIndex(x => x.UserId);
                b.HasIndex(x => new { x.SessionId, x.UserId }).IsUnique();
            });

            // AttendanceRecord
            builder.Entity<AttendanceRecord>(b =>
            {
                b.ToTable("AttendanceRecords");
                b.ConfigureByConvention();

                b.Property(x => x.StudentName).IsRequired().HasMaxLength(100);

                b.HasIndex(x => x.SessionId);
                b.HasIndex(x => x.StudentId);
                b.HasIndex(x => x.JoinTime);
            });

            // ChatMessage
            builder.Entity<ChatMessage>(b =>
            {
                b.ToTable("ChatMessages");
                b.ConfigureByConvention();

                b.Property(x => x.SenderName).IsRequired().HasMaxLength(100);
                b.Property(x => x.Message).IsRequired().HasMaxLength(2000);

                b.HasIndex(x => x.SessionId);
                b.HasIndex(x => x.SenderId);
                b.HasIndex(x => x.Timestamp);
            });
        }
    }
}