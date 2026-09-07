export type NavSection = 'dashboard' | 'ai' | 'student-data' | 'events' | 'helpdesk';

export interface AttendanceHistoryItem {
  date: string;
  day: string;
  status: 'Present' | 'Absent';
  topic: string;
}

export interface AttendanceRecord {
  id: string;
  subjectCode: string;
  subjectName: string;
  attendedClasses: number;
  missedClasses: number;
  totalClasses: number;
  percentage: number;
  isLow: boolean; // below 75%
  status: 'Healthy' | 'At Risk' | 'Needs Attention';
  requiredClassesToReach75: number;
  lastUpdated: string;
  trend: string;
  recentHistory: AttendanceHistoryItem[];
}

export interface Student {
  id: string; // e.g. "CS23045"
  name: string; // e.g. "Aditya Sharma"
  email: string;
  department: string; // "Computer Science"
  year: string; // "3rd Year"
  semester: string; // "Semester 5"
  section: string; // "A"
  cgpa: number; // 8.4
  overallAttendance: number; // 78
  attendanceMonthlyChange: string; // "+2.1% this month"
  totalClassesAttended: number; // 94
  totalClassesMissed: number; // 26
  totalClassesHeld: number; // 120
  atRiskSubjectsCount: number; // 2
  avatarUrl: string;
  phone?: string;
  mentor?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:00"
  subjectCode: string;
  subjectName: string;
  room: string;
  faculty: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  type: 'Lecture' | 'Lab' | 'Tutorial';
  startsIn?: string; // e.g. "in 1h 10m"
}

export interface GradeItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  internalMarks: {
    score: number;
    max: number;
  };
  examMarks: {
    score: number;
    max: number;
  };
  overallGrade: string; // "A+", "A", "B+", etc.
  gradePoints: number; // 10, 9, 8, etc.
  remarks?: string;
}

export interface DeadlineItem {
  id: string;
  uuid?: string; // database row id (UI id may be a legacy display id)
  title: string;
  category: 'Assignment' | 'Book' | 'Form' | 'Event';
  dueDate: string; // YYYY-MM-DD or readable
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  courseCode?: string;
  description?: string;
}

export interface EventItem {
  id: string;
  uuid?: string; // database row id (UI id may be a legacy display id)
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: 'Technical' | 'Cultural' | 'Sports' | 'Workshop' | 'Competition' | 'Seminar';
  isRegistered: boolean;
  registrationDeadline: string;
  maxSeats: number;
  registeredCount: number;
  bannerImage: string;
  tags: string[];
  isPast?: boolean;
}

export interface CanteenMenuItem {
  id: string;
  canteenName: string;
  name: string;
  price: number;
  category: 'Meals' | 'Snacks' | 'Beverages';
  isAvailable: boolean;
  preparationTimeMin: number;
  calories?: number;
}

export interface CanteenStatus {
  canteenName: string;
  crowdLevel: 'Low' | 'Moderate' | 'High';
  estimatedWaitMinutes: number;
  isOpen: boolean;
  openingHours: string;
}

export interface FacilityItem {
  id: string;
  name: string;
  type: 'Library' | 'Study Room' | 'Lab' | 'Classroom' | 'Auditorium' | 'Sports';
  location: string;
  capacity: number;
  availableSeats: number;
  occupancyPercentage: number;
  openingHours: string;
  amenities: string[];
  walkTimeFromRoom204Min: number;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  isAvailable: boolean;
  totalCopies: number;
  availableCopies: number;
  category: string;
  borrowedByStudent?: {
    borrowedDate: string;
    returnDate: string;
    isOverdue: boolean;
  };
}

export interface LibrarySeatAvailability {
  totalSeats: number;
  occupiedSeats: number;
  availablePercentage: number;
  quietZoneAvailability: number;
  discussionRoomAvailability: number;
}

export interface TransportRoute {
  id: string;
  routeNumber: string; // e.g. "Campus Shuttle 2"
  name: string; // "CSE Block to Main Gate"
  currentStatus: string; // "On Schedule"
  stops: string[];
  nextBusArrivalMinutes: number; // e.g. 8
  departureTime: string;
  frequencyMinutes: number;
}

export type TicketCategory = 
  | 'Maintenance'
  | 'Electrical'
  | 'Water'
  | 'Cleaning'
  | 'Classroom Equipment'
  | 'Wi-Fi / IT'
  | 'Other';

export type TicketPriority = 'Low' | 'Medium' | 'High';

export type TicketStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface TicketTimelineStep {
  step: 'Created' | 'Assigned' | 'In Progress' | 'Resolved';
  timestamp: string;
  note?: string;
}

export interface HelpdeskTicket {
  id: string; // e.g. "HD-1042"
  uuid?: string; // database row id
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  location: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  timeline: TicketTimelineStep[];
}

export interface NotificationItem {
  id: string;
  uuid?: string; // database row id
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'attendance' | 'deadline' | 'ticket' | 'event' | 'transport' | 'general';
  actionLink?: {
    view: NavSection;
    tab?: string;
    id?: string;
  };
}

export interface ActionRecommendation {
  title: string;
  description: string;
  reason: string;
  category: string;
  badge?: string;
  actionText?: string;
  actionTarget?: {
    view: NavSection;
    tab?: string;
  };
}

export interface TicketDraft {
  title: string;
  description: string;
  location: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  dataSources?: string[]; // e.g. ["Timetable", "Facilities", "Deadlines"]
  recommendations?: ActionRecommendation[];
  actionCard?: {
    type: 'create_ticket';
    draft: TicketDraft;
    status: 'pending_confirmation' | 'confirmed' | 'cancelled';
    createdTicketId?: string;
  };
}
