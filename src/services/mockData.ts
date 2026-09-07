import { 
  Student, 
  TimetableSlot, 
  AttendanceRecord, 
  GradeItem, 
  DeadlineItem, 
  EventItem, 
  CanteenMenuItem, 
  CanteenStatus, 
  FacilityItem, 
  LibraryBook, 
  LibrarySeatAvailability, 
  TransportRoute, 
  HelpdeskTicket, 
  NotificationItem 
} from '../types';

export const INITIAL_STUDENT: Student = {
  id: 'CS23045',
  name: 'Aditya Sharma',
  email: import.meta.env.VITE_DEMO_STUDENT_EMAIL || 'aditya.sharma@campus.edu',
  department: 'Computer Science & Engineering',
  year: '3rd Year',
  semester: 'Semester 5',
  section: 'A',
  cgpa: 8.4,
  overallAttendance: 78,
  attendanceMonthlyChange: '+2.1% this month',
  totalClassesAttended: 94,
  totalClassesMissed: 26,
  totalClassesHeld: 120,
  atRiskSubjectsCount: 2,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  phone: '+91 98765 43210',
  mentor: 'Dr. Anand Verma'
};

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { 
    id: 'att-1', 
    subjectCode: 'CS301', 
    subjectName: 'Data Structures', 
    attendedClasses: 46, 
    missedClasses: 4, 
    totalClasses: 50, 
    percentage: 92, 
    isLow: false, 
    status: 'Healthy', 
    requiredClassesToReach75: 0, 
    trend: '+1.8%',
    lastUpdated: 'Yesterday',
    recentHistory: [
      { date: 'Sep 06', day: 'Friday', status: 'Present', topic: 'Graph Traversal (BFS & DFS)' },
      { date: 'Sep 04', day: 'Wednesday', status: 'Present', topic: 'Shortest Path Algorithms (Dijkstra)' },
      { date: 'Sep 02', day: 'Monday', status: 'Present', topic: 'Minimum Spanning Trees (Kruskal)' },
      { date: 'Aug 30', day: 'Friday', status: 'Absent', topic: 'Heap Sort & Priority Queues' },
      { date: 'Aug 28', day: 'Wednesday', status: 'Present', topic: 'Binary Search Trees & AVL' }
    ]
  },
  { 
    id: 'att-2', 
    subjectCode: 'CS302', 
    subjectName: 'DBMS', 
    attendedClasses: 34, 
    missedClasses: 16, 
    totalClasses: 50, 
    percentage: 68, 
    isLow: true, 
    status: 'At Risk', 
    requiredClassesToReach75: 3, 
    trend: '-3.2%',
    lastUpdated: 'Today',
    recentHistory: [
      { date: 'Sep 05', day: 'Thursday', status: 'Present', topic: 'Normalization (3NF & BCNF)' },
      { date: 'Sep 04', day: 'Wednesday', status: 'Absent', topic: 'Query Optimization & Indexes' },
      { date: 'Sep 02', day: 'Monday', status: 'Present', topic: 'Relational Calculus' },
      { date: 'Aug 30', day: 'Friday', status: 'Absent', topic: 'Relational Algebra & Joins' },
      { date: 'Aug 28', day: 'Wednesday', status: 'Present', topic: 'SQL Constraints & Triggers' }
    ]
  },
  { 
    id: 'att-3', 
    subjectCode: 'CS303', 
    subjectName: 'OOP with Java', 
    attendedClasses: 40, 
    missedClasses: 10, 
    totalClasses: 50, 
    percentage: 80, 
    isLow: false, 
    status: 'Healthy', 
    requiredClassesToReach75: 0, 
    trend: '+0.5%',
    lastUpdated: 'Yesterday',
    recentHistory: [
      { date: 'Sep 05', day: 'Thursday', status: 'Present', topic: 'Java Multithreading & Concurrency' },
      { date: 'Sep 03', day: 'Tuesday', status: 'Present', topic: 'Generics & Collection Framework' },
      { date: 'Sep 01', day: 'Sunday', status: 'Present', topic: 'Exception Handling in Java' },
      { date: 'Aug 29', day: 'Thursday', status: 'Absent', topic: 'Polymorphism & Abstract Classes' },
      { date: 'Aug 27', day: 'Tuesday', status: 'Present', topic: 'Interfaces & Packages' }
    ]
  },
  { 
    id: 'att-4', 
    subjectCode: 'CS304', 
    subjectName: 'Web Development', 
    attendedClasses: 36, 
    missedClasses: 14, 
    totalClasses: 50, 
    percentage: 72, 
    isLow: true, 
    status: 'At Risk', 
    requiredClassesToReach75: 2, 
    trend: '-1.5%',
    lastUpdated: '2 days ago',
    recentHistory: [
      { date: 'Sep 04', day: 'Wednesday', status: 'Absent', topic: 'React Hooks & State Architecture' },
      { date: 'Sep 02', day: 'Monday', status: 'Present', topic: 'Tailwind CSS & Responsive Grid' },
      { date: 'Aug 28', day: 'Wednesday', status: 'Present', topic: 'Async JavaScript & Promises' },
      { date: 'Aug 26', day: 'Monday', status: 'Absent', topic: 'DOM Manipulation' },
      { date: 'Aug 21', day: 'Wednesday', status: 'Present', topic: 'ES6+ Syntax' }
    ]
  },
  { 
    id: 'att-5', 
    subjectCode: 'CS305', 
    subjectName: 'Operating Systems', 
    attendedClasses: 42, 
    missedClasses: 8, 
    totalClasses: 50, 
    percentage: 84, 
    isLow: false, 
    status: 'Healthy', 
    requiredClassesToReach75: 0, 
    trend: '+2.4%',
    lastUpdated: '3 days ago',
    recentHistory: [
      { date: 'Sep 06', day: 'Friday', status: 'Present', topic: 'Virtual Memory & Page Replacement' },
      { date: 'Sep 03', day: 'Tuesday', status: 'Present', topic: 'Deadlock Detection & Banker Algorithm' },
      { date: 'Aug 30', day: 'Friday', status: 'Present', topic: 'CPU Scheduling Algorithms' },
      { date: 'Aug 27', day: 'Tuesday', status: 'Present', topic: 'Process Synchronization & Semaphores' },
      { date: 'Aug 23', day: 'Friday', status: 'Absent', topic: 'System Calls & OS Kernel Structures' }
    ]
  }
];

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  // Monday (Today)
  { id: 'tt-mon-1', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', subjectCode: 'CS301', subjectName: 'Data Structures', room: 'Room 101', faculty: 'Dr. Sharma', type: 'Lecture', status: 'Completed' },
  { id: 'tt-mon-2', dayOfWeek: 'Monday', startTime: '10:30', endTime: '11:30', subjectCode: 'CS302', subjectName: 'DBMS', room: 'Room 204', faculty: 'Prof. Verma', type: 'Lecture', status: 'Upcoming', startsIn: 'in 1h 10m' },
  { id: 'tt-mon-3', dayOfWeek: 'Monday', startTime: '11:30', endTime: '12:30', subjectCode: 'CS303', subjectName: 'OOP with Java', room: 'Room 303', faculty: 'Dr. Iyer', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-mon-4', dayOfWeek: 'Monday', startTime: '14:00', endTime: '15:00', subjectCode: 'CS304', subjectName: 'Web Development', room: 'Lab 1', faculty: 'Prof. Khan', type: 'Lab', status: 'Upcoming' },

  // Tuesday
  { id: 'tt-tue-1', dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '10:00', subjectCode: 'CS305', subjectName: 'Operating Systems', room: 'Room 202', faculty: 'Dr. Nair', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-tue-2', dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '11:00', subjectCode: 'CS301', subjectName: 'Data Structures', room: 'Room 101', faculty: 'Dr. Sharma', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-tue-3', dayOfWeek: 'Tuesday', startTime: '11:30', endTime: '13:30', subjectCode: 'CS302', subjectName: 'DBMS Practical', room: 'Database Lab', faculty: 'Prof. Verma', type: 'Lab', status: 'Upcoming' },
  { id: 'tt-tue-4', dayOfWeek: 'Tuesday', startTime: '14:30', endTime: '15:30', subjectCode: 'CS303', subjectName: 'OOP with Java', room: 'Room 303', faculty: 'Dr. Iyer', type: 'Lecture', status: 'Upcoming' },

  // Wednesday
  { id: 'tt-wed-1', dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '10:00', subjectCode: 'CS304', subjectName: 'Web Development', room: 'Room 205', faculty: 'Prof. Khan', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-wed-2', dayOfWeek: 'Wednesday', startTime: '10:30', endTime: '11:30', subjectCode: 'CS302', subjectName: 'DBMS', room: 'Room 204', faculty: 'Prof. Verma', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-wed-3', dayOfWeek: 'Wednesday', startTime: '11:30', endTime: '12:30', subjectCode: 'CS305', subjectName: 'Operating Systems', room: 'Room 202', faculty: 'Dr. Nair', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-wed-4', dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '16:00', subjectCode: 'CS306', subjectName: 'Cloud Computing Workshop', room: 'Innovation Lab', faculty: 'Industry Mentor', type: 'Tutorial', status: 'Upcoming' },

  // Thursday
  { id: 'tt-thu-1', dayOfWeek: 'Thursday', startTime: '09:00', endTime: '10:00', subjectCode: 'CS301', subjectName: 'Data Structures', room: 'Room 101', faculty: 'Dr. Sharma', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-thu-2', dayOfWeek: 'Thursday', startTime: '10:30', endTime: '11:30', subjectCode: 'CS303', subjectName: 'OOP with Java', room: 'Room 303', faculty: 'Dr. Iyer', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-thu-3', dayOfWeek: 'Thursday', startTime: '13:00', endTime: '15:00', subjectCode: 'CS304', subjectName: 'Web Dev Fullstack Project', room: 'Lab 1', faculty: 'Prof. Khan', type: 'Lab', status: 'Upcoming' },

  // Friday
  { id: 'tt-fri-1', dayOfWeek: 'Friday', startTime: '09:30', endTime: '10:30', subjectCode: 'CS305', subjectName: 'Operating Systems', room: 'Room 202', faculty: 'Dr. Nair', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-fri-2', dayOfWeek: 'Friday', startTime: '11:00', endTime: '12:00', subjectCode: 'CS302', subjectName: 'DBMS', room: 'Room 204', faculty: 'Prof. Verma', type: 'Lecture', status: 'Upcoming' },
  { id: 'tt-fri-3', dayOfWeek: 'Friday', startTime: '14:00', endTime: '15:30', subjectCode: 'CS307', subjectName: 'Technical Seminar', room: 'Auditorium 2', faculty: 'Dept Faculty', type: 'Lecture', status: 'Upcoming' }
];

export const INITIAL_GRADES: GradeItem[] = [
  { id: 'grd-1', subjectCode: 'CS301', subjectName: 'Data Structures', credits: 4, internalMarks: { score: 38, max: 40 }, examMarks: { score: 84, max: 100 }, overallGrade: 'A+', gradePoints: 10, remarks: 'Outstanding performance in algorithms.' },
  { id: 'grd-2', subjectCode: 'CS302', subjectName: 'DBMS', credits: 4, internalMarks: { score: 32, max: 40 }, examMarks: { score: 78, max: 100 }, overallGrade: 'A', gradePoints: 9, remarks: 'Strong query optimization skills.' },
  { id: 'grd-3', subjectCode: 'CS303', subjectName: 'OOP with Java', credits: 3, internalMarks: { score: 35, max: 40 }, examMarks: { score: 80, max: 100 }, overallGrade: 'A', gradePoints: 9, remarks: 'Well-structured object modeling.' },
  { id: 'grd-4', subjectCode: 'CS304', subjectName: 'Web Development', credits: 3, internalMarks: { score: 36, max: 40 }, examMarks: { score: 82, max: 100 }, overallGrade: 'A', gradePoints: 9, remarks: 'Excellent project portfolio.' },
  { id: 'grd-5', subjectCode: 'CS305', subjectName: 'Operating Systems', credits: 3, internalMarks: { score: 34, max: 40 }, examMarks: { score: 76, max: 100 }, overallGrade: 'B+', gradePoints: 8, remarks: 'Solid understanding of process scheduling.' }
];

export const INITIAL_DEADLINES: DeadlineItem[] = [
  { id: 'dl-1', title: 'DBMS Assignment 3 (Relational Algebra)', category: 'Assignment', dueDate: 'Due tomorrow, 11:59 PM', priority: 'High', status: 'Pending', courseCode: 'CS302', description: 'Submit SQL queries & relational normalization schemas.' },
  { id: 'dl-2', title: 'Data Structures Book Return', category: 'Book', dueDate: 'Due Sep 10, 2026', priority: 'Medium', status: 'Pending', description: 'Return Goodrich textbook to Central Library 2nd Floor.' },
  { id: 'dl-3', title: 'National Merit Scholarship Application', category: 'Form', dueDate: 'Due Sep 12, 2026', priority: 'High', status: 'Pending', description: 'Submit attested grade transcript to Registrar Desk 4.' },
  { id: 'dl-4', title: 'Tech Fest 2026 Registration', category: 'Event', dueDate: 'Due Sep 15, 2026', priority: 'Medium', status: 'Pending', description: 'Early bird registration closes for university teams.' }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'Tech Fest 2026 — Future In Sync',
    description: 'Annual technology symposium with 24+ competitions, robotics arena, and keynotes from technology leaders.',
    date: 'Sep 15 – 17, 2026',
    time: '10:00 AM – 06:00 PM',
    location: 'Main Auditorium',
    organizer: 'Campus Tech Society',
    category: 'Technical',
    isRegistered: false,
    registrationDeadline: 'Sep 14, 2026',
    maxSeats: 500,
    registeredCount: 382,
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    tags: ['Tech', 'Keynotes', 'Robotics']
  },
  {
    id: 'evt-2',
    title: 'AI & Autonomous Agents Workshop',
    description: 'Intense practical session building autonomous LLM agents and multi-agent systems for smart universities.',
    date: 'Sep 10, 2026',
    time: '02:00 PM – 05:30 PM',
    location: 'CSE Block, Lab 3',
    organizer: 'AI Research Club & IEEE',
    category: 'Workshop',
    isRegistered: false,
    registrationDeadline: 'Sep 09, 2026',
    maxSeats: 80,
    registeredCount: 50,
    bannerImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    tags: ['AI', 'Hands-on', 'Workshop']
  },
  {
    id: 'evt-3',
    title: 'Spandan — Annual Cultural Gala',
    description: 'Vibrant celebration of music, theatre, and choreography with inter-college battle of the bands.',
    date: 'Sep 24 – 25, 2026',
    time: '05:30 PM – 10:00 PM',
    location: 'Open Air Amphitheatre',
    organizer: 'Cultural Council',
    category: 'Cultural',
    isRegistered: false,
    registrationDeadline: 'Sep 22, 2026',
    maxSeats: 1200,
    registeredCount: 840,
    bannerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    tags: ['Music', 'Dance', 'Fest']
  }
];

export const INITIAL_CANTEEN_STATUS: CanteenStatus = {
  canteenName: 'North Canteen',
  crowdLevel: 'Moderate',
  estimatedWaitMinutes: 12,
  isOpen: true,
  openingHours: '08:00 AM – 08:30 PM'
};

export const INITIAL_CANTEEN_MENU: CanteenMenuItem[] = [
  { id: 'c-1', canteenName: 'North Canteen', name: 'Paneer Bowl with Jeera Rice', price: 80, category: 'Meals', isAvailable: true, preparationTimeMin: 8, calories: 420 },
  { id: 'c-2', canteenName: 'North Canteen', name: 'Homestyle Chicken Meal', price: 100, category: 'Meals', isAvailable: true, preparationTimeMin: 10, calories: 560 },
  { id: 'c-3', canteenName: 'North Canteen', name: 'Special Deluxe Veg Thali', price: 70, category: 'Meals', isAvailable: true, preparationTimeMin: 6, calories: 480 },
  { id: 'c-4', canteenName: 'North Canteen', name: 'Crispy Butter Masala Dosa', price: 50, category: 'Snacks', isAvailable: true, preparationTimeMin: 7, calories: 310 },
  { id: 'c-5', canteenName: 'North Canteen', name: 'Iced Cold Coffee with Ice Cream', price: 40, category: 'Beverages', isAvailable: true, preparationTimeMin: 4, calories: 190 }
];

export const INITIAL_FACILITIES: FacilityItem[] = [
  {
    id: 'fac-1',
    name: 'Central Library — 2nd Floor Quiet Wing',
    type: 'Library',
    location: 'Central Library Block, Floor 2',
    capacity: 250,
    availableSeats: 150,
    occupancyPercentage: 40,
    openingHours: '08:00 AM – 10:00 PM',
    amenities: ['Silent Zone', 'High-Speed Wi-Fi', 'Power Ports'],
    walkTimeFromRoom204Min: 5
  },
  {
    id: 'fac-2',
    name: 'CS Block Quiet Study Lounge',
    type: 'Study Room',
    location: 'Computer Science Block, Room 215',
    capacity: 40,
    availableSeats: 34,
    occupancyPercentage: 15,
    openingHours: 'Open 24/7 for CS Students',
    amenities: ['Whiteboards', 'Air Conditioned', 'Monitors'],
    walkTimeFromRoom204Min: 1
  }
];

export const INITIAL_LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: 'bk-1',
    title: 'Data Structures and Algorithms in Java',
    author: 'Michael T. Goodrich & Roberto Tamassia',
    isbn: '978-1118771334',
    isAvailable: false,
    totalCopies: 12,
    availableCopies: 0,
    category: 'Computer Science',
    borrowedByStudent: {
      borrowedDate: '2026-08-25',
      returnDate: '2026-09-10',
      isOverdue: false
    }
  },
  {
    id: 'bk-2',
    title: 'Fundamentals of Database Systems',
    author: 'Ramez Elmasri & Shamkant B. Navathe',
    isbn: '978-0133970777',
    isAvailable: true,
    totalCopies: 15,
    availableCopies: 9,
    category: 'Computer Science'
  }
];

export const INITIAL_LIBRARY_AVAILABILITY: LibrarySeatAvailability = {
  totalSeats: 250,
  occupiedSeats: 100,
  availablePercentage: 60,
  quietZoneAvailability: 68,
  discussionRoomAvailability: 45
};

export const INITIAL_TRANSPORT: TransportRoute[] = [
  {
    id: 'tr-1',
    routeNumber: 'Campus Shuttle 2',
    name: 'CSE Block ➔ Central Library ➔ Main Gate',
    currentStatus: 'On Schedule',
    stops: ['CSE Block', 'Central Library', 'Sports Complex', 'Main Gate'],
    nextBusArrivalMinutes: 8,
    departureTime: '11:05 AM',
    frequencyMinutes: 15
  }
];

export const INITIAL_HELPDESK_TICKETS: HelpdeskTicket[] = [
  {
    id: 'HD-1042',
    studentId: 'CS23045',
    studentName: 'Aditya Sharma',
    title: 'AC not working / cooling failure',
    description: 'AC unit in Room 204 is blowing ambient air and making rattling noise.',
    location: 'Room 204 (CS Block)',
    category: 'Maintenance',
    priority: 'Medium',
    status: 'Pending',
    createdAt: '2026-09-07T08:30:00Z',
    updatedAt: '2026-09-07T08:30:00Z',
    timeline: [
      { step: 'Created', timestamp: 'Today, 08:30 AM', note: 'Logged via CampusOS AI' }
    ]
  },
  {
    id: 'HD-1041',
    studentId: 'CS23045',
    studentName: 'Aditya Sharma',
    title: 'Classroom projector display issue',
    description: 'HDMI cable signal keeps dropping every 5 minutes in Room 101.',
    location: 'Room 101',
    category: 'Classroom Equipment',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2026-09-05T14:10:00Z',
    updatedAt: '2026-09-06T10:00:00Z',
    timeline: [
      { step: 'Created', timestamp: 'Sep 05, 02:10 PM', note: 'Ticket logged' },
      { step: 'Assigned', timestamp: 'Sep 05, 04:00 PM', note: 'Assigned to AV technician' },
      { step: 'In Progress', timestamp: 'Sep 06, 10:00 AM', note: 'Technician testing replacement transmitter' }
    ]
  },
  {
    id: 'HD-1038',
    studentId: 'CS23045',
    studentName: 'Aditya Sharma',
    title: 'Wi-Fi connection drop in quiet wing',
    description: 'Wi-Fi keeps authenticating and disconnecting on 2nd floor library.',
    location: 'Central Library Floor 2',
    category: 'Wi-Fi / IT',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2026-09-01T09:20:00Z',
    updatedAt: '2026-09-02T11:45:00Z',
    timeline: [
      { step: 'Created', timestamp: 'Sep 01, 09:20 AM', note: 'Logged by student' },
      { step: 'Assigned', timestamp: 'Sep 01, 11:00 AM', note: 'IT infrastructure team' },
      { step: 'In Progress', timestamp: 'Sep 01, 03:00 PM', note: 'Access point rebooted and firmware patched' },
      { step: 'Resolved', timestamp: 'Sep 02, 11:45 AM', note: 'SSID signal verified stable at 150 Mbps' }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'DBMS Assignment 3 is due',
    message: 'Due tomorrow at 11:59 PM. Make sure to complete relational queries.',
    timestamp: '15m ago',
    isRead: false,
    type: 'deadline',
    actionLink: { view: 'student-data', tab: 'deadlines' }
  },
  {
    id: 'notif-2',
    title: 'Your DBMS attendance is 68%',
    message: 'Attend next 3 classes to recover above the 75% threshold.',
    timestamp: '2h ago',
    isRead: false,
    type: 'attendance',
    actionLink: { view: 'dashboard' }
  },
  {
    id: 'notif-3',
    title: 'Library book return reminder',
    message: 'Goodrich Data Structures textbook due on Sep 10.',
    timestamp: '1d ago',
    isRead: true,
    type: 'deadline',
    actionLink: { view: 'student-data', tab: 'deadlines' }
  },
  {
    id: 'notif-4',
    title: 'Tech Fest 2026 registration open',
    message: 'Join now to secure your spot for team hackathons.',
    timestamp: '1d ago',
    isRead: true,
    type: 'event',
    actionLink: { view: 'events' }
  }
];
