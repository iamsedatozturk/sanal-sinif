using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Volo.Abp.AspNetCore.SignalR;
using Volo.Abp.Domain.Repositories;
using VirtualClassroom.Domain.Entities;

namespace VirtualClassroom.SignalR.Hubs
{
    [Authorize]
    [HubRoute("/signalr-hubs/classroom")]
    public class ClassroomHub : AbpHub
    {
        private readonly IRepository<ClassSession, Guid> _classSessionRepository;
        private readonly IRepository<Participant, Guid> _participantRepository;
        private readonly IRepository<ChatMessage, Guid> _chatMessageRepository;

        public ClassroomHub(
            IRepository<ClassSession, Guid> classSessionRepository,
            IRepository<Participant, Guid> participantRepository,
            IRepository<ChatMessage, Guid> chatMessageRepository)
        {
            _classSessionRepository = classSessionRepository;
            _participantRepository = participantRepository;
            _chatMessageRepository = chatMessageRepository;
        }

        public async Task JoinClassAsync(Guid sessionId, string userName)
        {
            var classSession = await _classSessionRepository.GetAsync(sessionId);
            
            if (!classSession.CanJoin())
            {
                await Clients.Caller.SendAsync("Error", "Cannot join this class at this time");
                return;
            }

            // Add to SignalR group
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId.ToString());

            // Update participant connection
            var participant = await _participantRepository.FirstOrDefaultAsync(
                x => x.SessionId == sessionId && x.UserId == Context.UserIdentifier.To<Guid>()
            );

            if (participant != null)
            {
                participant.UpdateConnectionId(Context.ConnectionId);
                await _participantRepository.UpdateAsync(participant);
            }

            // Notify others
            await Clients.Group(sessionId.ToString())
                .SendAsync("ParticipantJoined", Context.UserIdentifier, userName);

            Logger.LogInformation($"User {userName} joined class {sessionId}");
        }

        public async Task LeaveClassAsync(Guid sessionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId.ToString());
            
            await Clients.Group(sessionId.ToString())
                .SendAsync("ParticipantLeft", Context.UserIdentifier);

            Logger.LogInformation($"User {Context.UserIdentifier} left class {sessionId}");
        }

        public async Task SendSignalingMessageAsync(SignalingMessageDto message)
        {
            // Forward WebRTC signaling messages
            await Clients.User(message.ToUserId)
                .SendAsync("ReceiveSignalingMessage", message);

            Logger.LogInformation($"Signaling message sent from {message.FromUserId} to {message.ToUserId}");
        }

        public async Task SendChatMessageAsync(Guid sessionId, string message)
        {
            var userId = Context.UserIdentifier.To<Guid>();
            var userName = Context.User?.Identity?.Name ?? "Unknown";

            // Check if user is teacher
            var participant = await _participantRepository.FirstOrDefaultAsync(
                x => x.SessionId == sessionId && x.UserId == userId
            );

            var isTeacher = participant?.IsTeacher ?? false;

            // Save message to database
            var chatMessage = new ChatMessage(
                GuidGenerator.Create(),
                sessionId,
                userId,
                userName,
                message,
                isTeacher
            );

            await _chatMessageRepository.InsertAsync(chatMessage);

            // Send to all participants
            await Clients.Group(sessionId.ToString())
                .SendAsync("ChatMessage", new
                {
                    Id = chatMessage.Id,
                    SenderId = chatMessage.SenderId,
                    SenderName = chatMessage.SenderName,
                    Message = chatMessage.Message,
                    Timestamp = chatMessage.Timestamp,
                    IsTeacher = chatMessage.IsTeacher
                });
        }

        public async Task MuteParticipantAsync(Guid sessionId, Guid participantId, bool isMuted)
        {
            var teacherParticipant = await _participantRepository.FirstOrDefaultAsync(
                x => x.SessionId == sessionId && x.UserId == Context.UserIdentifier.To<Guid>()
            );

            if (teacherParticipant?.IsTeacher != true)
            {
                await Clients.Caller.SendAsync("Error", "Only teachers can mute participants");
                return;
            }

            var participant = await _participantRepository.FirstOrDefaultAsync(
                x => x.SessionId == sessionId && x.UserId == participantId
            );

            if (participant != null)
            {
                if (isMuted)
                    participant.MuteAudio();
                else
                    participant.UnmuteAudio();

                await _participantRepository.UpdateAsync(participant);

                // Notify the participant and others
                await Clients.Group(sessionId.ToString())
                    .SendAsync("ParticipantMuted", participantId, isMuted);
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Handle cleanup when user disconnects
            var userId = Context.UserIdentifier?.To<Guid>();
            if (userId.HasValue)
            {
                var participants = await _participantRepository.GetListAsync(
                    x => x.UserId == userId.Value && x.ConnectionId == Context.ConnectionId
                );

                foreach (var participant in participants)
                {
                    await Clients.Group(participant.SessionId.ToString())
                        .SendAsync("ParticipantLeft", userId.Value);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }

    public class SignalingMessageDto
    {
        public string Type { get; set; } // offer, answer, ice-candidate
        public string FromUserId { get; set; }
        public string ToUserId { get; set; }
        public object Data { get; set; }
    }
}