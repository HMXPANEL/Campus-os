import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminSessionProvider } from './AdminSessionContext';
import { AdminGuard } from './AdminGuard';
import { AdminShell } from './AdminShell';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminPlaceholder } from './AdminPlaceholder';
import { ROUTE_PHASES } from '../../services/adminPermissions';

function phaseOf(path: string): number {
  return ROUTE_PHASES[path] ?? 2;
}

function placeholder(path: string, title: string, description?: string): React.ReactElement {
  return <AdminPlaceholder title={title} phase={phaseOf(path)} description={description} />;
}

/**
 * Isolated /admin branch. Student routes (`/*`) are declared separately in
 * App.tsx and never intersect with these.
 */
export const AdminApp: React.FC = () => {
  return (
    <AdminSessionProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route element={<AdminShell />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={placeholder('/admin/students', 'Students', 'Directory, profiles, attendance, grades and tickets per student.')} />
            <Route path="faculty" element={placeholder('/admin/faculty', 'Faculty', 'Faculty directory, departments, subjects and assignments.')} />
            <Route path="departments" element={placeholder('/admin/departments', 'Departments')} />
            <Route path="subjects" element={placeholder('/admin/subjects', 'Subjects')} />
            <Route path="timetable" element={placeholder('/admin/timetable', 'Timetable', 'Slot CRUD with faculty, room and conflict detection.')} />
            <Route path="attendance" element={placeholder('/admin/attendance', 'Attendance', 'Risk views, trends and teacher-scoped management.')} />
            <Route path="grades" element={placeholder('/admin/grades', 'Grades', 'Distributions and teacher-scoped entry.')} />
            <Route path="deadlines" element={placeholder('/admin/deadlines', 'Deadlines')} />
            <Route path="events" element={placeholder('/admin/events', 'Events', 'Publishing, capacity, banners and registrations.')} />
            <Route path="facilities" element={placeholder('/admin/facilities', 'Facilities')} />
            <Route path="library" element={placeholder('/admin/library', 'Library', 'Catalog, loans, returns and seat status.')} />
            <Route path="transport" element={placeholder('/admin/transport', 'Transport')} />
            <Route path="canteen" element={placeholder('/admin/canteen', 'Canteen', 'Menus, prices, availability and crowd status.')} />
            <Route path="helpdesk" element={placeholder('/admin/helpdesk', 'Helpdesk', 'Triage, assignment, status workflow and audit trail.')} />
            <Route path="notifications" element={placeholder('/admin/notifications', 'Notifications')} />
            <Route path="notices" element={placeholder('/admin/notices', 'Notices', 'Targeted publishing with scheduling and expiry.')} />
            <Route path="users" element={placeholder('/admin/users', 'Admin Users', 'Provisioning and role assignment.')} />
            <Route path="roles" element={placeholder('/admin/roles', 'Roles & Permissions', 'Permission matrix management.')} />
            <Route path="activity" element={placeholder('/admin/activity', 'Activity Log', 'Administrative audit trail.')} />
            <Route path="ai" element={placeholder('/admin/ai', 'Admin AI', 'Analytics assistant over role-scoped data.')} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </AdminSessionProvider>
  );
};
