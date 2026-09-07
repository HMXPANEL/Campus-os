import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthService } from './services/authService';
import { campusStore } from './services/campusStore';
import { AdminApp } from './components/admin/AdminApp';
import { NavSection } from './types';
import { PortalSelect } from './components/auth/PortalSelect';
import { StudentLogin } from './components/auth/StudentLogin';
import { StudentShell } from './components/layout/StudentShell';
import { DashboardView } from './components/dashboard/DashboardView';
import { CampusOSAIView } from './components/ai/CampusOSAIView';
import { StudentDataView } from './components/student-data/StudentDataView';
import { EventsView } from './components/events/EventsView';
import { HelpdeskView } from './components/helpdesk/HelpdeskView';

type AppFlowState = 'portal-select' | 'student-login' | 'student-app';

const StudentApp: React.FC = () => {
  const navigate = useNavigate();
  const [flowState, setFlowState] = useState<AppFlowState>(() => {
    return AuthService.isAuthenticated() ? 'student-app' : 'portal-select';
  });

  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [navigationMeta, setNavigationMeta] = useState<{
    tab?: string;
    id?: string;
    initialPrompt?: string;
  }>({});

  // Protect student routes & sync session state
  useEffect(() => {
    const isAuthed = AuthService.isAuthenticated();
    if (!isAuthed && flowState === 'student-app') {
      setFlowState('portal-select');
    }
  }, [flowState]);

  // Hydrate offline-first store from Supabase (public catalog; owner rows after Auth).
  useEffect(() => {
    let cancelled = false;
    if (AuthService.isAuthenticated()) {
      void campusStore.hydrateFromSupabase().then((res) => {
        if (!cancelled && import.meta.env.DEV && res.applied.length > 0) {
          console.info('[CampusOS] Supabase hydrate applied:', res.applied.join(', '));
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [flowState]);

  const handleNavigate = (
    section: NavSection,
    meta?: { tab?: string; id?: string; initialPrompt?: string }
  ) => {
    setCurrentSection(section);
    if (meta) {
      setNavigationMeta(meta);
    } else {
      setNavigationMeta({});
    }
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    AuthService.logout();
    setFlowState('portal-select');
    setCurrentSection('dashboard');
    setNavigationMeta({});
  };

  // 1. Initial Portal Selection View
  if (flowState === 'portal-select') {
    return (
      <PortalSelect
        onSelectStudent={() => setFlowState('student-login')}
        onSelectAdmin={() => navigate('/admin/login')}
      />
    );
  }

  // 2. Student Authentication View
  if (flowState === 'student-login') {
    return (
      <StudentLogin
        onBack={() => setFlowState('portal-select')}
        onLoginSuccess={() => setFlowState('student-app')}
      />
    );
  }

  // 3. Authenticated Student Application
  return (
    <StudentShell
      currentSection={currentSection}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {currentSection === 'dashboard' && (
        <DashboardView onNavigate={handleNavigate} />
      )}

      {currentSection === 'ai' && (
        <CampusOSAIView
          initialPrompt={navigationMeta.initialPrompt}
          onNavigate={handleNavigate}
        />
      )}

      {currentSection === 'student-data' && (
        <StudentDataView
          initialTab={navigationMeta.tab as any}
        />
      )}

      {currentSection === 'events' && (
        <EventsView
          initialEventId={navigationMeta.id}
        />
      )}

      {currentSection === 'helpdesk' && (
        <HelpdeskView
          initialTab={navigationMeta.tab as any}
          initialTicketId={navigationMeta.id}
        />
      )}
    </StudentShell>
  );
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<StudentApp />} />
    </Routes>
  );
};

export default App;
