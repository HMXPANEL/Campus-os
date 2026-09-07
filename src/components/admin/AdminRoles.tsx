import { ShieldCheck, Check, Minus, Info } from 'lucide-react';

interface RoleCapability {
  module: string;
  admin: boolean;
  vice_principal: boolean;
  faculty: boolean;
  staff: boolean;
  maintenance: boolean;
  student: boolean;
}

const MATRIX: RoleCapability[] = [
  { module: 'Executive Dashboard & Metrics', admin: true, vice_principal: true, faculty: false, staff: false, maintenance: false, student: false },
  { module: 'Student Academic Directory (All)', admin: true, vice_principal: true, faculty: false, staff: false, maintenance: false, student: false },
  { module: 'Teacher Course Assignments', admin: true, vice_principal: true, faculty: false, staff: false, maintenance: false, student: false },
  { module: 'Departments & Subjects CRUD', admin: true, vice_principal: true, faculty: false, staff: false, maintenance: false, student: false },
  { module: 'Timetable Scheduling & Conflict Check', admin: true, vice_principal: true, faculty: false, staff: false, maintenance: false, student: false },
  { module: 'Attendance Monitoring & Marking', admin: true, vice_principal: true, faculty: true, staff: false, maintenance: false, student: false },
  { module: 'Grades Entry & Examination Marks', admin: true, vice_principal: false, faculty: true, staff: false, maintenance: false, student: false },
  { module: 'Campus Events Creation & Publishing', admin: true, vice_principal: true, faculty: false, staff: true, maintenance: false, student: false },
  { module: 'Facilities & Seat Management', admin: true, vice_principal: true, faculty: false, staff: true, maintenance: true, student: false },
  { module: 'Library Catalog & Loan Processing', admin: true, vice_principal: false, faculty: false, staff: true, maintenance: false, student: false },
  { module: 'Transport Dispatch & Live ETA', admin: true, vice_principal: false, faculty: false, staff: true, maintenance: false, student: false },
  { module: 'Canteen Stock & Wait Time Metrics', admin: true, vice_principal: false, faculty: false, staff: true, maintenance: false, student: false },
  { module: 'Helpdesk Full Triage & Assignment', admin: true, vice_principal: true, faculty: false, staff: true, maintenance: true, student: false },
  { module: 'Targeted Notice Broadcasts', admin: true, vice_principal: true, faculty: false, staff: true, maintenance: false, student: false },
  { module: 'User Role Assignment & Privileges', admin: true, vice_principal: false, faculty: false, staff: false, maintenance: false, student: false },
  { module: 'Activity Audit Trail Inspection', admin: true, vice_principal: false, faculty: false, staff: false, maintenance: false, student: false },
  { module: 'Campus Intelligence (Admin AI)', admin: true, vice_principal: true, faculty: true, staff: true, maintenance: true, student: false },
];

export const AdminRoles: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Security Governance</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Role Permission Matrix</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Granular access control policies enforced across the user interface and Supabase RLS.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2.5">
        <Info className="w-4 h-4 shrink-0" />
        <span>
          Every permission listed below is enforced at the database layer via PostgreSQL Row-Level Security (RLS).
          Unauthorized direct queries are rejected by the backend.
        </span>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-semibold">System Capability</th>
                <th className="p-3.5 font-semibold text-center">Admin</th>
                <th className="p-3.5 font-semibold text-center">Vice Principal</th>
                <th className="p-3.5 font-semibold text-center">Teacher</th>
                <th className="p-3.5 font-semibold text-center">Staff</th>
                <th className="p-3.5 font-semibold text-center">Maintenance</th>
                <th className="p-3.5 font-semibold text-center">Student</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {MATRIX.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-medium text-white">{row.module}</td>
                  <td className="p-3.5 text-center">
                    {row.admin ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.vice_principal ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.faculty ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.staff ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.maintenance ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.student ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
