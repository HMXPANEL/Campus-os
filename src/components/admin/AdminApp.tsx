import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminSessionProvider } from './AdminSessionContext';
import { AdminGuard } from './AdminGuard';
import { AdminShell } from './AdminShell';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminStudents } from './AdminStudents';
import { AdminFaculty } from './AdminFaculty';
import { AdminDepartments } from './AdminDepartments';
import { AdminSubjects } from './AdminSubjects';
import { AdminTimetable } from './AdminTimetable';
import { AdminAttendance } from './AdminAttendance';
import { AdminGrades } from './AdminGrades';
import { AdminDeadlines } from './AdminDeadlines';
import { AdminEvents } from './AdminEvents';
import { AdminFacilities } from './AdminFacilities';
import { AdminLibrary } from './AdminLibrary';
import { AdminTransport } from './AdminTransport';
import { AdminCanteen } from './AdminCanteen';
import { AdminHelpdesk } from './AdminHelpdesk';
import { AdminNotifications } from './AdminNotifications';
import { AdminNotices } from './AdminNotices';
import { AdminUsers } from './AdminUsers';
import { AdminRoles } from './AdminRoles';
import { AdminActivity } from './AdminActivity';
import { AdminAI } from './AdminAI';

/**
 * Isolated /admin branch. Protected with AdminGuard and role-level verification.
 * Student routes (/*) are declared separately in App.tsx and never intersect with these.
 */
export const AdminApp: React.FC = () => {
  return (
    <AdminSessionProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route element={<AdminShell />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="faculty" element={<AdminFaculty />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="timetable" element={<AdminTimetable />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="grades" element={<AdminGrades />} />
            <Route path="deadlines" element={<AdminDeadlines />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="facilities" element={<AdminFacilities />} />
            <Route path="library" element={<AdminLibrary />} />
            <Route path="transport" element={<AdminTransport />} />
            <Route path="canteen" element={<AdminCanteen />} />
            <Route path="helpdesk" element={<AdminHelpdesk />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="ai" element={<AdminAI />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </AdminSessionProvider>
  );
};
