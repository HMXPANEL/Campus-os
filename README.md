# CampusOS — AI-Powered Smart Campus
> *"One campus. One AI. Everything you need."*

CampusOS is a responsive, production-quality operating system for university campuses, featuring a unified reactive data architecture and an autonomous AI companion.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Demo credentials are configured in `.env`:
```env
VITE_DEMO_STUDENT_EMAIL=aditya.sharma@campus.edu
VITE_DEMO_STUDENT_PASSWORD=CampusOS@2026
VITE_DEMO_STUDENT_ID=CS23045
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## Demo Credentials
- **Student Email / ID:** `aditya.sharma@campus.edu` or `CS23045`
- **Password:** `CampusOS@2026`
*(Or click the "Fill Credentials" button on the login screen!)*

---

## 5 Primary Student Sections
1. **Dashboard:** Greeting, Next Class (DBMS Room 204), Attendance Overview (with alert on <75%), Upcoming Deadlines, Events, and Quick AI input.
2. **CampusOS AI:** Context-aware companion with interactive **Action Confirmation Cards** (ticket creation), personalized decision making ("2 hours before class"), and transparent data provenance badges.
3. **Student Data:** Exactly 3 tabs: **Timetable** (Day timeline & Week matrix), **Grades & Performance** (visual analytics), and **Deadlines** (unified tracker).
4. **Events:** Campus hackathons, fests, and workshops with real registration toggles and celebratory confetti.
5. **Helpdesk:** Real issue reporting with validation and student ticket audit timeline (*Created* $\rightarrow$ *Assigned* $\rightarrow$ *In Progress* $\rightarrow$ *Resolved*).

*Header features: Global Search (`Ctrl+K`), Live Notification Drawer, and Student Profile ID Card.*
