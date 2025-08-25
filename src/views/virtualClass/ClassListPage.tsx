import React from 'react'
import { ClassList } from '../../components/VirtualClass/ClassList'

const ClassListPage: React.FC = () => {
  return (
      <ClassList
        currentUser={{ id: "", name: "", email: "", role: "student" }}
        onCreateClass={() => {}}
        onJoinClass={() => {}}
        onEditClass={() => {}}
        onDeleteClass={() => {}}
      />
  )
}

export default ClassListPage
