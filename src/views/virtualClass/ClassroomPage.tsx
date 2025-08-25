import React from "react";
import { Classroom } from "../../components/VirtualClass/Classroom";

const ClassroomPage: React.FC = () => {
  return (
    <Classroom
      classSession={{
        id: "",
        name: "",
        teacherId: "",
        teacherName: "",
        startTime: "",
        scheduledStartTime: "",
        isActive: false,
        isScheduled: false,
        participantCount: 0,
      }}
      currentUser={{ id: "", name: "", role: "student" }}
      onLeaveClass={() => {}}
    />
  );
};

export default ClassroomPage;
