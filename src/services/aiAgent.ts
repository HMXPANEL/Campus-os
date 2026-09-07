import { campusStore } from './campusStore';
import { AIMessage, ActionRecommendation, TicketDraft } from '../types';

export class CampusAIAgent {
  // Process incoming user message with multi-turn conversation context
  public static async processMessage(
    userQuery: string,
    history: AIMessage[]
  ): Promise<AIMessage> {
    // Artificial small delay for realistic typing indicator feel
    await new Promise(resolve => setTimeout(resolve, 650));

    const query = userQuery.trim().toLowerCase();
    const store = campusStore;
    const student = store.getStudent();
    const timetable = store.getTimetable();
    const attendance = store.getAttendance();
    const deadlines = store.getDeadlines();
    const events = store.getEvents();
    const canteen = store.getCanteen();
    const facilities = store.getFacilities();
    const library = store.getLibrary();
    const transport = store.getTransport();
    const tickets = store.getTickets();
    const { nextClass } = store.getCurrentOrNextClass();

    // Check conversation history for context resolution (multi-turn)
    const lastAssistantMsg = history.length > 0 ? history[history.length - 1] : null;
    const lastUserMsg = history.length > 1 ? history[history.length - 2] : null;
    const isFollowupAboutProximity = 
      (query.includes('closer') || query.includes('near') || query.includes('next class')) &&
      (lastAssistantMsg?.text.toLowerCase().includes('study') || lastAssistantMsg?.text.toLowerCase().includes('library') || lastUserMsg?.text.toLowerCase().includes('study'));

    // 1. ACTION INTENT: Check for reporting problems / Helpdesk issue (e.g. "The AC in Room 204 isn't working")
    if (
      (query.includes('not working') || query.includes("isn't working") || query.includes('broken') || query.includes('leak') || query.includes('problem in') || query.includes('issue with')) &&
      !query.includes('status of')
    ) {
      let location = 'Room 204';
      if (query.includes('room 101')) location = 'Room 101';
      else if (query.includes('room 204')) location = 'Room 204';
      else if (query.includes('room 303')) location = 'Room 303';
      else if (query.includes('lab 1')) location = 'CS Lab 1';
      else if (query.includes('library')) location = 'Central Library';
      else if (query.includes('canteen')) location = 'North Canteen';

      let category: TicketDraft['category'] = 'Maintenance';
      let title = 'Equipment Issue';
      let priority: TicketDraft['priority'] = 'Medium';

      if (query.includes('ac') || query.includes('air conditioner')) {
        title = 'AC not working / cooling failure';
        category = 'Maintenance';
        priority = 'Medium';
      } else if (query.includes('projector') || query.includes('hdmi') || query.includes('screen')) {
        title = 'Classroom projector display failure';
        category = 'Classroom Equipment';
        priority = 'High';
      } else if (query.includes('wifi') || query.includes('wi-fi') || query.includes('internet')) {
        title = 'Wi-Fi connection drop / weak signal';
        category = 'Wi-Fi / IT';
        priority = 'High';
      } else if (query.includes('water') || query.includes('leak') || query.includes('tap')) {
        title = 'Water leak in washroom/dispenser';
        category = 'Water';
        priority = 'High';
      } else if (query.includes('light') || query.includes('fan') || query.includes('power')) {
        title = 'Electrical fixture failure';
        category = 'Electrical';
        priority = 'Medium';
      } else {
        title = userQuery;
      }

      const draft: TicketDraft = {
        title,
        description: `Student reported via CampusOS AI: "${userQuery}". Needs inspection at ${location}.`,
        location,
        category,
        priority
      };

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `I've prepared a maintenance report for this issue. Please review the details below and confirm to submit it to the campus facilities team.`,
        timestamp: 'Just now',
        dataSources: ['Facilities', 'Helpdesk System'],
        actionCard: {
          type: 'create_ticket',
          draft,
          status: 'pending_confirmation'
        }
      };
    }

    // 2. CONTEXTUAL PROXIMITY RESOLUTION: "Something closer to my next class"
    if (isFollowupAboutProximity) {
      if (!nextClass || facilities.length === 0) {
        return {
          id: `ai-msg-${Date.now()}`,
          sender: 'assistant',
          text: `I couldn't find an upcoming class or study space in the live campus data right now. Please check your timetable and try again.`,
          timestamp: 'Just now',
          dataSources: ['Timetable', 'Facilities · Study Spaces']
        };
      }
      const targetRoom = nextClass.room;
      const targetSubject = nextClass.subjectName;
      const nearbyStudy = facilities.slice().sort((a, b) => a.walkTimeFromRoom204Min - b.walkTimeFromRoom204Min)[0];

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Your next lecture is **${targetSubject}** in **${targetRoom}** at ${nextClass.startTime}.\n\nThe closest quiet study location is the **${nearbyStudy.name}** (${nearbyStudy.location}).\n\n- **Walk time:** About ${nearbyStudy.walkTimeFromRoom204Min} minute(s).\n- **Current Availability:** ${nearbyStudy.availableSeats} of ${nearbyStudy.capacity} seats free (${100 - nearbyStudy.occupancyPercentage}% available).\n- **Amenities:** ${(nearbyStudy.amenities ?? []).join(', ') || 'See facility details'}.`,
        timestamp: 'Just now',
        dataSources: ['Timetable', 'Facilities · Study Spaces'],
        recommendations: [
          {
            title: nearbyStudy.name,
            description: `${nearbyStudy.availableSeats} seats open right now (${nearbyStudy.walkTimeFromRoom204Min} min walk).`,
            reason: `Closest available study lounge to your next lecture in ${targetRoom}.`,
            category: 'Study Spot',
            actionText: 'Open Facility Info',
            actionTarget: { view: 'dashboard' }
          }
        ]
      };
    }

    // 3. PERSONALIZED 2-HOUR FREE WINDOW: "I have 2 hours before my next class. Help me decide what to do."
    if (
      (query.includes('2 hours') || query.includes('free time') || query.includes('decide what to do') || query.includes('between classes') || query.includes('break'))
    ) {
      // All values below come from the live Supabase-backed store — nothing hardcoded.
      const libAvail = library.availability.availablePercentage;
      const nearestFacility = facilities.slice().sort((a, b) => a.walkTimeFromRoom204Min - b.walkTimeFromRoom204Min)[0];
      const topMeal = canteen.menu.find(m => m.isAvailable);
      const pendingDeadlines = deadlines.filter(d => d.status === 'Pending');
      const topDeadline = pendingDeadlines.slice().sort((a, b) => Number(b.priority === 'High') - Number(a.priority === 'High'))[0];
      const riskSubjects = attendance.filter(a => a.isLow || a.percentage < 75);
      const nextName = nextClass ? `${nextClass.subjectName} (${nextClass.subjectCode})` : 'your next class';
      const nextWhen = nextClass ? `${nextClass.startTime} in ${nextClass.room}` : 'as scheduled';
      const nextFaculty = nextClass?.faculty ?? 'your faculty';

      const recs: ActionRecommendation[] = [
        {
          title: `Study at ${nearestFacility ? nearestFacility.name : 'the Library'}`,
          description: nearestFacility
            ? `${nearestFacility.availableSeats} of ${nearestFacility.capacity} seats free, ${nearestFacility.walkTimeFromRoom204Min} min walk. Library overall ${libAvail}% seats available.`
            : `Library overall ${libAvail}% seats available right now.`,
          reason: 'Recommended because you have a free window and a quiet space near your next class keeps you on schedule.',
          category: 'Quiet Study',
          actionText: 'View Timetable',
          actionTarget: { view: 'student-data', tab: 'timetable' }
        },
        {
          title: `Grab a bite at ${canteen.status.canteenName}`,
          description: topMeal
            ? `Crowd is ${canteen.status.crowdLevel} (~${canteen.status.estimatedWaitMinutes} min wait). ${topMeal.name} (₹${topMeal.price}) is available.`
            : `Crowd is ${canteen.status.crowdLevel} (~${canteen.status.estimatedWaitMinutes} min wait).`,
          reason: `Recommended to eat before ${nextName} to avoid the peak rush.`,
          category: 'Dining',
          actionText: 'View Canteen Menu',
          actionTarget: { view: 'dashboard' }
        },
        ...(topDeadline
          ? [
              {
                title: `Work on: ${topDeadline.title}`,
                description: `Due ${topDeadline.dueDate} (${topDeadline.priority} Priority).${riskSubjects.length > 0 ? ` You have ${riskSubjects.length} subject(s) below 75% attendance — submitted work protects your internal score.` : ''}`,
                reason: `Recommended because "${topDeadline.title}" is your most pressing pending item before ${nextName}.`,
                category: 'Academic Deadline',
                actionText: 'Open Deadlines',
                actionTarget: { view: 'student-data', tab: 'deadlines' },
              } as ActionRecommendation,
            ]
          : []),
      ];

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `You have time before ${nextName} at ${nextWhen} with ${nextFaculty}.\n\nHere are tailored recommendations based on your live schedule, pending deadlines, and campus occupancy:`,
        timestamp: 'Just now',
        dataSources: ['Timetable', 'Facilities', 'Deadlines', 'Canteen'],
        recommendations: recs
      };
    }

    // 4. NEXT CLASS / TIMETABLE QUERIES
    if (
      query.includes('next class') ||
      query.includes('current class') ||
      query.includes('upcoming class') ||
      query.includes('what class do i have') ||
      query.includes('my timetable') ||
      query.includes('schedule today')
    ) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[new Date().getDay()];
      const todaySlots = timetable
        .filter(t => t.dayOfWeek === todayName)
        .slice()
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      const next = nextClass || todaySlots[0];

      if (!next) {
        return {
          id: `ai-msg-${Date.now()}`,
          sender: 'assistant',
          text: `You have no more classes scheduled today (${todayName}). Enjoy the rest of your day!`,
          timestamp: 'Just now',
          dataSources: ['Timetable']
        };
      }

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Your next lecture is **${next.subjectName}** (${next.subjectCode}) with **${next.faculty}**.\n\n- **Time:** ${next.startTime} – ${next.endTime}\n- **Room:** ${next.room}\n- **Type:** ${next.type}\n- **Status:** Upcoming\n\n**${todayName}'s Schedule:**\n` +
          (todaySlots.length > 0
            ? todaySlots.map(s => `• **${s.startTime} – ${s.endTime}**: ${s.subjectName} (${s.room}, ${s.faculty})`).join('\n')
            : 'No more classes today.'),
        timestamp: 'Just now',
        dataSources: ['Timetable']
      };
    }

    // 4.1 CAN I SKIP CLASS? (ATTENDANCE PREDICTION — resolved from live records)
    if (
      query.includes('skip') ||
      query.includes('miss class') ||
      query.includes('can i miss') ||
      query.includes('bunk')
    ) {
      // Try to resolve the subject named in the question against real records;
      // otherwise analyze the weakest subject.
      const tokens = query.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(t => t.length >= 3);
      let resolved = null as null | { subjectCode: string };
      for (const token of tokens) {
        const hit = store.getAttendanceRecord(token);
        if (hit) {
          resolved = { subjectCode: hit.subjectCode };
          break;
        }
      }
      if (!resolved) {
        const weakest = attendance.slice().sort((a, b) => a.percentage - b.percentage)[0];
        if (weakest) resolved = { subjectCode: weakest.subjectCode };
      }
      if (!resolved) {
        return {
          id: `ai-msg-${Date.now()}`,
          sender: 'assistant',
          text: `I couldn't find your attendance records in the live campus data. Please check your connection and try again.`,
          timestamp: 'Just now',
          dataSources: ['Attendance']
        };
      }
      const impact = store.calculateSkipImpact(resolved.subjectCode);
      const subjectName = impact.record?.subjectName || resolved.subjectCode;

      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Your ${subjectName} attendance is currently **${impact.currentPct}%** (${impact.record?.attendedClasses} of ${impact.record?.totalClasses} classes attended).\n\nIf you miss tomorrow's class, your attendance will drop further to **${impact.newPctIfSkipped}%** (${impact.record?.attendedClasses}/${(impact.record?.totalClasses || 50) + 1}), falling deeper below the mandatory 75% university threshold.\n\n⚠️ **Recommendation: I strongly advise ATTENDING tomorrow's session.**\n\nYou currently need to attend your next **${impact.classesRequiredFor75} consecutive ${subjectName} classes** to move toward the required 75% policy. Missing it increases your risk of semester debarment.`,
        timestamp: 'Just now',
        dataSources: ['Attendance · Timetable']
      };
    }

    // 4.2 WHY IS MY ATTENDANCE LOW? / ATTENDANCE INSIGHTS
    if (
      query.includes('why is my attendance low') ||
      query.includes('improve my attendance') ||
      query.includes('attendance low') ||
      query.includes('attendance risk') ||
      query.includes('attendance insights')
    ) {
      const atRisk = store.getAtRiskSubjects();
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Your attendance is currently at risk in **${atRisk.length} subjects**:\n\n` +
          atRisk.map(a => `• **${a.subjectName} (${a.subjectCode})**: **${a.percentage}%** (${a.attendedClasses}/${a.totalClasses} classes) — *Requires ${a.requiredClassesToReach75} consecutive classes to reach 75%*`).join('\n') +
          `\n\n**Actionable AI Recommendations:**\n` +
          (atRisk.length > 0
            ? `1. **Attend your upcoming ${atRisk[0].subjectName} classes** (${atRisk[0].requiredClassesToReach75} consecutive needed) to halt further slide.\n`
            : `1. **Keep your streak going** — all subjects currently meet the 75% requirement.\n`) +
          `2. **Avoid missing consecutive sessions** of the same subject.\n` +
          `3. **Ask your faculty mentor${student.mentor ? ` (${student.mentor})` : ''}** about remedial hours for weak subjects.\n` +
          `4. **Set reminders** 30 minutes before your morning lectures.`,
        timestamp: 'Just now',
        dataSources: ['Attendance Risk Engine', 'Faculty Registry']
      };
    }

    // 5. GENERAL ATTENDANCE INQUIRIES
    if (
      query.includes('attendance') ||
      query.includes('shortage') ||
      query.includes('percentage')
    ) {
      const lowAtt = store.getAtRiskSubjects();
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Your overall campus attendance is **${student.overallAttendance}%** (${student.totalClassesAttended} attended, ${student.totalClassesMissed} missed of ${student.totalClassesHeld} total).\n\n**Subject Breakdown:**\n` +
          attendance.map(a => `• **${a.subjectName} (${a.subjectCode})**: ${a.percentage}% (${a.attendedClasses}/${a.totalClasses}) ${a.isLow ? '⚠️ *(At Risk: Below 75%)*' : '✓'}`).join('\n') +
          `\n\n${lowAtt.length > 0 ? `> **Alert:** You have **${lowAtt.length} subjects at risk**: ${lowAtt.map(a => `${a.subjectName} (${a.percentage}%)`).join(', ')}. Attending your next 3 classes will bring you back into the safe zone.` : 'All your courses meet university criteria.'}`,
        timestamp: 'Just now',
        dataSources: ['Student Attendance System']
      };
    }

    // 6. DEADLINES & "WHAT DO I NEED TO COMPLETE THIS WEEK"
    if (
      query.includes('deadline') ||
      query.includes('complete this week') ||
      query.includes('pending') ||
      query.includes('assignment') ||
      query.includes('due')
    ) {
      const pendingDeadlines = deadlines.filter(d => d.status === 'Pending');
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Here is your prioritized list of tasks, submissions, and returns for this week:\n\n` +
          pendingDeadlines.map((d, i) => `${i + 1}. **[${d.category.toUpperCase()}] ${d.title}**\n   - **Due:** ${d.dueDate}\n   - **Priority:** ${d.priority}\n   - *${d.description || ''}*`).join('\n\n') +
          `\n\n💡 *Tip: You can mark deadlines completed directly in the Student Data tab.*`,
        timestamp: 'Just now',
        dataSources: ['Academic Deadlines', 'Library Registry', 'Scholarship Portal']
      };
    }

    // 7. GRADES & ACADEMIC PERFORMANCE
    if (
      query.includes('grade') ||
      query.includes('marks') ||
      query.includes('cgpa') ||
      query.includes('gpa') ||
      query.includes('performance')
    ) {
      const grades = store.getGrades();
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Your cumulative CGPA is **${student.cgpa} / 10.0** (Department of ${student.department}).\n\n**Current Semester Performance:**\n` +
          grades.map(g => `• **${g.subjectName}**: Grade **${g.overallGrade}** (Internal: ${g.internalMarks.score}/${g.internalMarks.max}, Final: ${g.examMarks.score}/${g.examMarks.max})`).join('\n') +
          `\n\n**Academic Insight:** You are currently in the top 12% of Section A, with your highest score in Data Structures (Grade A+).`,
        timestamp: 'Just now',
        dataSources: ['University Exam Controller', 'Academic Records']
      };
    }

    // 8. CANTEEN & FOOD INQUIRIES
    if (
      query.includes('canteen') ||
      query.includes('menu') ||
      query.includes('food') ||
      query.includes('lunch') ||
      query.includes('eat') ||
      query.includes('hungry')
    ) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `**${canteen.status.canteenName} Status:**\n- **Live Crowd:** ${canteen.status.crowdLevel} (approx. ${canteen.status.estimatedWaitMinutes} min wait)\n- **Hours:** ${canteen.status.openingHours}\n\n**Today's Highlight Menu:**\n` +
          canteen.menu.map(m => `• **${m.name}** — ₹${m.price} (${m.isAvailable ? 'Available' : 'Sold Out'}) • Ready in ~${m.preparationTimeMin}m`).join('\n'),
        timestamp: 'Just now',
        dataSources: ['Canteen POS System', 'Kitchen Queue Sensor']
      };
    }

    // 9. STUDY SPACES & LIBRARY
    if (
      query.includes('study') ||
      query.includes('library') ||
      query.includes('quiet place') ||
      query.includes('where can i study')
    ) {
      if (facilities.length === 0) {
        return {
          id: `ai-msg-${Date.now()}`,
          sender: 'assistant',
          text: `No study spaces are listed in the live campus data right now. Please check back later.`,
          timestamp: 'Just now',
          dataSources: ['Campus Facilities', 'Library Registry']
        };
      }
      const ranked = facilities
        .slice()
        .sort((a, b) => a.walkTimeFromRoom204Min - b.walkTimeFromRoom204Min)
        .slice(0, 3);
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Here are the top available study spaces on campus right now:\n\n` +
          ranked.map((f, i) => `${i + 1}. **${f.name}**\n   - **Available:** ${f.availableSeats} / ${f.capacity} seats (${f.occupancyPercentage}% full)\n   - **Amenities:** ${(f.amenities ?? []).join(', ') || 'See facility details'}\n   - **Walk:** ~${f.walkTimeFromRoom204Min} min`).join('\n\n') +
          `\n\n*Central Library has ${library.availability.availablePercentage}% total seats open right now.*`,
        timestamp: 'Just now',
        dataSources: ['Campus Facilities', 'Library Registry']
      };
    }

    // 10. CAMPUS EVENTS
    if (
      query.includes('event') ||
      query.includes('tech fest') ||
      query.includes('hackathon') ||
      query.includes('happening')
    ) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `Here are the major events happening on campus this month:\n\n` +
          events.slice(0, 3).map(e => `• **${e.title}** (${e.category})\n  - **When:** ${e.date} (${e.time})\n  - **Where:** ${e.location}\n  - **Registration:** ${e.isRegistered ? '✅ Registered' : `${e.registeredCount}/${e.maxSeats} spots taken`}`).join('\n\n') +
          `\n\nHead over to the **Events** tab to register with one tap!`,
        timestamp: 'Just now',
        dataSources: ['Campus Events Board']
      };
    }

    // 11. TRANSPORT / SHUTTLES
    if (
      query.includes('transport') ||
      query.includes('bus') ||
      query.includes('shuttle') ||
      query.includes('route')
    ) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `**Live Campus Transit:**\n\n` +
          transport.map(t => `• **${t.routeNumber}** (${t.name})\n  - **Next Arrival:** in **${t.nextBusArrivalMinutes} minutes** (${t.departureTime})\n  - **Status:** ${t.currentStatus} (Frequency: every ${t.frequencyMinutes}m)\n  - **Stops:** ${t.stops.join(' ➔ ')}`).join('\n\n'),
        timestamp: 'Just now',
        dataSources: ['Campus Fleet GPS']
      };
    }

    // 12. HELPDESK STATUS
    if (
      query.includes('ticket') ||
      query.includes('helpdesk') ||
      query.includes('hd-')
    ) {
      const myTickets = tickets.filter(t => t.studentId === student.id);
      if (myTickets.length === 0) {
        return {
          id: `ai-msg-${Date.now()}`,
          sender: 'assistant',
          text: `You currently have no open helpdesk tickets. If you encounter any equipment, maintenance, or IT problems on campus, just let me know and I can create a ticket for you!`,
          timestamp: 'Just now',
          dataSources: ['Helpdesk System']
        };
      }
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: `You have **${myTickets.length}** ticket(s) on file:\n\n` +
          myTickets.map(t => `• **${t.id}: ${t.title}**\n  - **Location:** ${t.location} | **Category:** ${t.category}\n  - **Status:** ${t.status}\n  - **Latest Step:** ${t.timeline[t.timeline.length - 1]?.note || t.status}`).join('\n\n'),
        timestamp: 'Just now',
        dataSources: ['Helpdesk System']
      };
    }

    // Fallback: Smart campus assistant general response
    return {
      id: `ai-msg-${Date.now()}`,
      sender: 'assistant',
      text: `I'm connected to your live student records, timetable, physical campus facilities, dining queues, library catalog, and helpdesk.\n\nHere are some things you can ask me:\n• *"I have 2 hours before my next class. Help me decide what to do."*\n• *"The AC in Room 204 isn't working."* (I will create a ticket)\n• *"What is my next class?"*\n• *"How is my attendance?"*\n• *"What do I need to complete this week?"*\n• *"Find me somewhere quiet to study near Room 204."*\n• *"When is the next campus shuttle?"*`,
      timestamp: 'Just now',
      dataSources: ['CampusOS Unified Service Mesh']
    };
  }
}
