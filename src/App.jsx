import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarDays,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronDown,
  MapPin,
  Clock3,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  X,
  Sparkles,
  MoreHorizontal,
  SlidersHorizontal,
  GraduationCap,
  Target,
  TrendingUp,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { generateClient } from "aws-amplify/data";
import { signOut } from "aws-amplify/auth";
import ApplicationsPage from "./pages/ApplicationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import "./App.css";
import SettingsPage from "./pages/SettingsPage";

const client = generateClient();

const getGreeting = (date = new Date()) => {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
};

const getTodayLabel = (date = new Date()) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatUpcomingDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
};

const logoColors = ["orange", "blue", "green", "purple", "pink"];

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
};

const toUiApplication = (app, index = 0) => ({
  id: app.id,

  company: app.company || "Unknown Company",
  role: app.role || "Internship",
  location: app.location || "Not specified",
  status: app.status || "Applied",

  date: formatDate(app.applicationDate),
  deadline: formatDate(app.deadline),

  logo:
    app.companyLogo ||
    app.company?.charAt(0)?.toUpperCase() ||
    "?",

  color: logoColors[index % logoColors.length],

  // Original AWS values
  applicationDate: app.applicationDate || "",
  deadlineValue: app.deadline || "",

  // Workflow dates
  assessmentDate: app.assessmentDate || "",
  interviewDate: app.interviewDate || "",
  followUpDate: app.followUpDate || "",

  // Additional application information
  skills: Array.isArray(app.skills)
    ? app.skills
    : [],

  documents: Array.isArray(app.documents)
    ? app.documents
    : [],

  jobDescription:
    app.jobDescription || "",

  notes:
    app.notes || "",

  source:
    app.source || "Not specified",

  companyLogo:
    app.companyLogo ||
    app.company?.charAt(0)?.toUpperCase() ||
    "?",
});

const workflowStages = [
  "Applied",
  "Assessment",
  "Interview",
  "Follow-up",
  "Offer",
];

const getWorkflowStage = (status) => {
  const index = workflowStages.indexOf(status);

  return index === -1 ? 0 : index;
};

const getApplicationWorkflow = (application) => {
  const status = application.status || "Applied";
  const currentIndex = getWorkflowStage(status);

  if (status === "Rejected") {
    return {
      progress: 100,
      headline: "Application closed",
      description:
        "This application has been marked as rejected. No further action is required unless you want to record the outcome for future reference.",
      nextAction: "Review outcome",
      stages: workflowStages.map((stage, index) => ({
        stage,
        state: index < currentIndex ? "done" : "closed",
      })),
    };
  }

  if (status === "Offer") {
    return {
      progress: 100,
      headline: "Offer received",
      description:
        "This application has reached the offer stage. Review the offer details and record your decision or next communication.",
      nextAction: "Review offer",
      stages: workflowStages.map((stage) => ({
        stage,
        state: "done",
      })),
    };
  }

  const nextStage =
    workflowStages[currentIndex + 1] || "Complete";

  const descriptions = {
    Applied:
      "Your application has been submitted and is currently awaiting the employer's response.",
    Assessment:
      "The application has moved to the assessment stage. Complete the assessment and record the result before moving to the interview stage.",
    Interview:
      "Your application is currently at the interview stage. Prepare for the interview and record the outcome afterward.",
    "Follow-up":
      "The interview/application process has progressed to follow-up. Send or record the follow-up communication and wait for the employer's response.",
  };

  const nextActions = {
    Applied: "Watch for assessment or interview updates",
    Assessment: "Complete the assessment",
    Interview: "Prepare for the interview",
    "Follow-up": "Follow up with the recruiter",
  };

  return {
    progress: Math.round(
      ((currentIndex + 1) / workflowStages.length) * 100
    ),

    headline:
      status === "Applied"
        ? "Application submitted"
        : `${status} stage in progress`,

    description:
      descriptions[status] ||
      "Continue tracking the application and update its status when something changes.",

    nextAction:
      nextActions[status] ||
      `Move to ${nextStage}`,

    stages: workflowStages.map((stage, index) => {
      if (index < currentIndex) {
        return {
          stage,
          state: "done",
        };
      }

      if (index === currentIndex) {
        return {
          stage,
          state: "current",
        };
      }

      return {
        stage,
        state: "upcoming",
      };
    }),
  };
};

const getApplicationTimeline = (application) => {
  if (!application) return [];

  const stages = [
    {
      key: "Applied",
      label: "Application submitted",
      date: application.applicationDate,
    },
    {
      key: "Assessment",
      label: "Assessment",
      date: application.assessmentDate,
    },
    {
      key: "Interview",
      label: "Interview",
      date: application.interviewDate,
    },
    {
      key: "Follow-up",
      label: "Follow-up",
      date: application.followUpDate,
    },
    {
      key: "Offer",
      label: "Offer",
      date: "",
    },
  ];

  const currentStatus = application.status || "Applied";

  const currentIndex = workflowStages.indexOf(currentStatus);

  return stages.map((stage, index) => {
    let state = "upcoming";

    if (currentStatus === "Rejected") {
      state = "closed";
    } else if (currentStatus === "Offer") {
      state = "completed";
    } else if (index < currentIndex) {
      state = "completed";
    } else if (index === currentIndex) {
      state = "current";
    }

    return {
      ...stage,
      state,
      formattedDate: stage.date
        ? formatNotificationDate(stage.date)
        : "",
    };
  });
};


const statusConfig = {
  Applied: {
    className: "status-applied",
    icon: CircleDot,
  },
  Assessment: {
    className: "status-assessment",
    icon: Clock3,
  },
  Interview: {
    className: "status-interview",
    icon: CalendarDays,
  },
  "Follow-up": {
    className: "status-followup",
    icon: CircleAlert,
  },
  Offer: {
    className: "status-offer",
    icon: CheckCircle2,
  },
  Rejected: {
    className: "status-rejected",
    icon: X,
  },
};

// Notification date formatter
const formatNotificationDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const [calendarMonth, setCalendarMonth] = useState(
  new Date().getMonth()
);

const [calendarYear, setCalendarYear] = useState(
  new Date().getFullYear()
);

const previousMonth = () => {
  if (calendarMonth === 0) {
    setCalendarMonth(11);
    setCalendarYear((year) => year - 1);
  } else {
    setCalendarMonth((month) => month - 1);
  }
};

const nextMonth = () => {
  if (calendarMonth === 11) {
    setCalendarMonth(0);
    setCalendarYear((year) => year + 1);
  } else {
    setCalendarMonth((month) => month + 1);
  }
};
  const [applications, setApplications] = useState([]);
  useEffect(() => {
  const savedTheme =
    localStorage.getItem("internflow-theme") || "dark";

  document.documentElement.dataset.theme = savedTheme;
  document.body.dataset.theme = savedTheme;
}, []);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [editingApplication, setEditingApplication] = useState(false);
  const [savingApplication, setSavingApplication] = useState(false);
  const [applicationEditForm, setApplicationEditForm] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [browserNotificationPermission, setBrowserNotificationPermission] =
  useState(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      return window.Notification.permission;
    }

    return "unsupported";
  });
  const [showAIModal, setShowAIModal] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);

  const [form, setForm] = useState({
    company: "",
    role: "",
    location: "",
    deadline: "",
    status: "Applied",
  });

  useEffect(() => {
  let cancelled = false;

  const loadUserProfile = async () => {
    try {
      setProfileLoading(true);

      const { data, errors } = await client.models.UserProfile.list();

      if (errors?.length) {
        throw new Error(
          errors.map((item) => item.message).join("\n")
        );
      }

      if (!cancelled) {
        setUserProfile(data?.[0] || null);
      }
    } catch (err) {
      console.error("InternFlow profile error:", err);

      if (!cancelled) {
        setUserProfile(null);
      }
    } finally {
      if (!cancelled) {
        setProfileLoading(false);
      }
    }
  };

  loadUserProfile();

  return () => {
    cancelled = true;
  };
}, [activePage]);

  useEffect(() => {
    let cancelled = false;

const loadApplications = async () => {
  setLoading(true);
  setError("");

  try {
    const { data, errors } =
      await client.models.InternshipApplication.list();

    if (errors?.length) {
      throw new Error(
        errors.map((item) => item.message).join("\n")
      );
    }

    if (cancelled) return;

    let records = data || [];

        setApplications(records.map((app, index) => toUiApplication(app, index)));
      } catch (err) {
        console.error("InternFlow data error:", err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load applications from AWS."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const monthName = new Date(
  calendarYear,
  calendarMonth,
  1
).toLocaleString("en-US", {
  month: "long",
});

const calendarEvents = applications.flatMap(
  (application) => {
    const events = [];

    const addEvent = (date, type, label) => {
      if (!date) return;

      events.push({
        id: application.id,
        eventType: type,
        date,
        type,
        label,
        company: application.company,
        role: application.role,
        status: application.status,
      });
    };

    addEvent(
      application.applicationDate,
      "application",
      "Application submitted"
    );

    addEvent(
      application.deadlineValue,
      "deadline",
      "Application deadline"
    );

    addEvent(
      application.assessmentDate,
      "assessment",
      "Assessment"
    );

    addEvent(
      application.interviewDate,
      "interview",
      "Interview"
    );

    addEvent(
      application.followUpDate,
      "followup",
      "Follow-up"
    );

    return events;
  }
);

const calendarDays = new Date(
  calendarYear,
  calendarMonth + 1,
  0
).getDate();

const firstDay = new Date(
  calendarYear,
  calendarMonth,
  1
).getDay();

const calendarCells = [];

for (let i = 0; i < firstDay; i++) {
  calendarCells.push(null);
}

for (let day = 1; day <= calendarDays; day++) {
  calendarCells.push(day);
}



  // REAL NOTIFICATIONS
  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDaysFromToday = (dateValue) => {
      if (!dateValue) return null;

      const date = new Date(`${dateValue}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      date.setHours(0, 0, 0, 0);

      return Math.round(
        (date.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    };

    const result = [];

    applications.forEach((application) => {
      // Don't generate reminders for completed/rejected applications.
      if (
        application.status === "Offer" ||
        application.status === "Rejected"
      ) {
        return;
      }

      // FOLLOW-UP
      const followUpDays = getDaysFromToday(
        application.followUpDate
      );

      if (followUpDays !== null && followUpDays <= 0) {
        result.push({
          id: `${application.id}-followup`,
          title:
            followUpDays === 0
              ? "Follow-up due today"
              : "Follow-up overdue",
          description: `${application.company} — ${application.role}`,
          type: "warning",
          priority: 1,
          applicationId: application.id,
date: application.followUpDate,
dateLabel: "Follow-up",
        });
      }

      // INTERVIEW
      const interviewDays = getDaysFromToday(
        application.interviewDate
      );

      if (
        interviewDays !== null &&
        interviewDays >= 0 &&
        interviewDays <= 1
      ) {
        result.push({
          id: `${application.id}-interview`,
          title:
            interviewDays === 0
              ? "Interview today"
              : "Interview tomorrow",
          description: `${application.company} — ${application.role}`,
          type: "success",
          priority: 2,
          applicationId: application.id,
date: application.interviewDate,
dateLabel: "Interview",
        });
      }

      // ASSESSMENT
      const assessmentDays = getDaysFromToday(
        application.assessmentDate
      );

      if (
        assessmentDays !== null &&
        assessmentDays >= 0 &&
        assessmentDays <= 1
      ) {
        result.push({
          id: `${application.id}-assessment`,
          title:
            assessmentDays === 0
              ? "Assessment today"
              : "Assessment tomorrow",
          description: `${application.company} — ${application.role}`,
          type: "info",
          priority: 3,
          applicationId: application.id,
date: application.assessmentDate,
dateLabel: "Assessment",
        });
      }

      // DEADLINE
      const deadlineDays = getDaysFromToday(
        application.deadlineValue
      );

      if (
        deadlineDays !== null &&
        deadlineDays >= 0 &&
        deadlineDays <= 3
      ) {
        let title = "";

        if (deadlineDays === 0) {
          title = "Deadline today";
        } else if (deadlineDays === 1) {
          title = "Deadline tomorrow";
        } else {
          title = `Deadline in ${deadlineDays} days`;
        }

        result.push({
          id: `${application.id}-deadline`,
          title,
          description: `${application.company} — ${application.role}`,
          type: "warning",
          priority: 4,
          applicationId: application.id,
date: application.deadlineValue,
dateLabel: "Deadline",
        });
      }
    });

    return result.sort(
      (a, b) => a.priority - b.priority
    );
  }, [applications]);

useEffect(() => {
  if (!userProfile?.notificationsEnabled) return;

  if (
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    return;
  }

  if (browserNotificationPermission !== "granted") {
    return;
  }

  const shownNotifications = JSON.parse(
    localStorage.getItem(
      "internflow-browser-notifications"
    ) || "{}"
  );

  let hasChanges = false;

  notifications.forEach((notification) => {
    let enabled = true;

    if (notification.id.endsWith("-deadline")) {
      enabled = userProfile.deadlineReminders !== false;
    }

    if (notification.id.endsWith("-interview")) {
      enabled = userProfile.interviewReminders !== false;
    }

    if (notification.id.endsWith("-followup")) {
      enabled = userProfile.followUpReminders !== false;
    }

    if (notification.id.endsWith("-assessment")) {
      enabled = userProfile.notificationsEnabled !== false;
    }

    if (!enabled) return;

    const notificationKey = `${notification.id}-${new Date()
      .toISOString()
      .split("T")[0]}`;

    if (shownNotifications[notificationKey]) {
      return;
    }

    const browserNotification =
      new window.Notification(
        notification.title,
        {
          body: notification.description,
          icon: "/favicon.ico",
          tag: notification.id,
        }
      );

    browserNotification.onclick = () => {
      window.focus();

      const application = applications.find(
        (item) => item.id === notification.applicationId
      );

      if (application) {
        setSelectedApplication(application);
        setShowNotifications(false);
      }

      browserNotification.close();
    };

    shownNotifications[notificationKey] = true;
    hasChanges = true;
  });

  if (hasChanges) {
    localStorage.setItem(
      "internflow-browser-notifications",
      JSON.stringify(shownNotifications)
    );
  }
}, [
  notifications,
  userProfile,
  applications,
  browserNotificationPermission,
]);

  const upcomingDashboardEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = [];

    applications.forEach((application) => {
      if (["Offer", "Rejected"].includes(application.status)) {
        return;
      }

      const addEvent = (date, type, label) => {
        if (!date) return;

        const eventDate = new Date(`${date}T00:00:00`);

        if (Number.isNaN(eventDate.getTime())) return;

        if (eventDate >= today) {
          events.push({
            id: `${application.id}-${type}`,
            applicationId: application.id,
            date,
            type,
            label,
            company: application.company,
            role: application.role,
          });
        }
      };

      addEvent(application.interviewDate, "purple", "Interview");
      addEvent(application.assessmentDate, "blue", "Assessment");
      addEvent(application.followUpDate, "danger", "Follow-up");
      addEvent(application.deadlineValue, "danger", "Deadline");
    });

    return events
      .sort(
        (a, b) =>
          new Date(`${a.date}T00:00:00`) -
          new Date(`${b.date}T00:00:00`)
      )
      .slice(0, 3);
  }, [applications]);

  const applicationsThisWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diff);

    return applications.filter((application) => {
      if (!application.applicationDate) return false;

      const applicationDate = new Date(
        `${application.applicationDate}T00:00:00`
      );

      return (
        !Number.isNaN(applicationDate.getTime()) &&
        applicationDate >= startOfWeek &&
        applicationDate <= today
      );
    }).length;
  }, [applications]);

    // NEEDS YOUR ATTENTION
  const attentionItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDaysFromToday = (dateValue) => {
      if (!dateValue) return null;

      const date = new Date(`${dateValue}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      date.setHours(0, 0, 0, 0);

      return Math.round(
        (date.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    };

    const items = [];

    applications.forEach((application) => {
      // Completed applications don't need attention.
      if (
        application.status === "Offer" ||
        application.status === "Rejected"
      ) {
        return;
      }

      const addAttention = ({
        date,
        type,
        title,
        description,
        priority,
      }) => {
        if (!date) return;

        items.push({
          id: `${application.id}-${type}`,
          applicationId: application.id,
          company: application.company,
          role: application.role,
          date,
          type,
          title,
          description,
          priority,
        });
      };

      // FOLLOW-UP
      const followUpDays = getDaysFromToday(
        application.followUpDate
      );

      if (followUpDays !== null && followUpDays <= 0) {
        addAttention({
          date: application.followUpDate,
          type: "followup",
          title:
            followUpDays === 0
              ? "Follow-up due today"
              : "Follow-up overdue",
          description:
            followUpDays === 0
              ? "Send or record your follow-up."
              : `Overdue by ${Math.abs(followUpDays)} day${
                  Math.abs(followUpDays) === 1 ? "" : "s"
                }.`,
          priority: 1,
        });
      }

      // INTERVIEW
      const interviewDays = getDaysFromToday(
        application.interviewDate
      );

      if (
        interviewDays !== null &&
        interviewDays >= 0 &&
        interviewDays <= 2
      ) {
        addAttention({
          date: application.interviewDate,
          type: "interview",
          title:
            interviewDays === 0
              ? "Interview today"
              : interviewDays === 1
              ? "Interview tomorrow"
              : "Interview in 2 days",
          description: "Prepare for your interview.",
          priority: 2,
        });
      }

      // ASSESSMENT
      const assessmentDays = getDaysFromToday(
        application.assessmentDate
      );

      if (
        assessmentDays !== null &&
        assessmentDays >= 0 &&
        assessmentDays <= 2
      ) {
        addAttention({
          date: application.assessmentDate,
          type: "assessment",
          title:
            assessmentDays === 0
              ? "Assessment today"
              : assessmentDays === 1
              ? "Assessment tomorrow"
              : "Assessment in 2 days",
          description: "Complete the assessment on time.",
          priority: 3,
        });
      }

      // DEADLINE
      const deadlineDays = getDaysFromToday(
        application.deadlineValue
      );

      if (
        deadlineDays !== null &&
        deadlineDays >= 0 &&
        deadlineDays <= 3
      ) {
        addAttention({
          date: application.deadlineValue,
          type: "deadline",
          title:
            deadlineDays === 0
              ? "Application deadline today"
              : deadlineDays === 1
              ? "Application deadline tomorrow"
              : `Application deadline in ${deadlineDays} days`,
          description: "Review the application before the deadline.",
          priority: 4,
        });
      }
    });

    return items
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5);
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        app.company.toLowerCase().includes(search.toLowerCase()) ||
        app.role.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const stats = {
    total: applications.length,
    active: applications.filter(
      (app) => !["Rejected", "Offer"].includes(app.status)
    ).length,
    interviews: applications.filter((app) => app.status === "Interview")
      .length,
    offers: applications.filter((app) => app.status === "Offer").length,
  };

  const addApplication = async (e) => {
    e.preventDefault();

    if (!form.company || !form.role) return;

    setError("");

    try {
      const { data, errors } =
        await client.models.InternshipApplication.create({
          company: form.company.trim(),
          role: form.role.trim(),
          location: form.location.trim() || "Not specified",
          status: form.status,
          applicationDate: new Date().toISOString().split("T")[0],
          deadline: form.deadline || undefined,
          companyLogo: form.company.trim().charAt(0).toUpperCase(),
        });

      if (errors?.length) {
        throw new Error(errors.map((item) => item.message).join("\n"));
      }

      if (!data) {
        throw new Error("AWS did not return the created application.");
      }

      setApplications((prev) => [
        toUiApplication(data, prev.length),
        ...prev,
      ]);

      setForm({
        company: "",
        role: "",
        location: "",
        deadline: "",
        status: "Applied",
      });

      setShowModal(false);
    } catch (err) {
      console.error("Failed to save application:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not save the internship to AWS."
      );
    }
  };

  const startEditingApplication = () => {
  if (!selectedApplication) return;

  setApplicationEditForm({
    status: selectedApplication.status || "Applied",
    deadline: selectedApplication.deadlineValue || "",
    assessmentDate:
      selectedApplication.assessmentDate || "",
    interviewDate:
      selectedApplication.interviewDate || "",
    followUpDate:
      selectedApplication.followUpDate || "",
    notes: selectedApplication.notes || "",
  });

  setEditingApplication(true);
};

const saveApplicationChanges = async () => {
  if (!selectedApplication?.id) return;

  setSavingApplication(true);

  try {
    const { data, errors } =
      await client.models.InternshipApplication.update({
        id: selectedApplication.id,

        status:
          applicationEditForm.status || "Applied",

        deadline:
          applicationEditForm.deadline || undefined,

        assessmentDate:
          applicationEditForm.assessmentDate ||
          undefined,

        interviewDate:
          applicationEditForm.interviewDate ||
          undefined,

        followUpDate:
          applicationEditForm.followUpDate ||
          undefined,

        notes:
          applicationEditForm.notes?.trim() || undefined,
      });

    if (errors?.length) {
      throw new Error(
        errors.map((item) => item.message).join("\n")
      );
    }

    if (!data) {
      throw new Error(
        "AWS did not return the updated application."
      );
    }

    const updatedApplication =
      toUiApplication(
        data,
        applications.findIndex(
          (item) => item.id === data.id
        )
      );

    setApplications((previous) =>
      previous.map((item) =>
        item.id === data.id
          ? updatedApplication
          : item
      )
    );

    setSelectedApplication(updatedApplication);

    setEditingApplication(false);
  } catch (error) {
    console.error(
      "Failed to update application:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Unable to update application."
    );
  } finally {
    setSavingApplication(false);
  }
};


const analyzeJobDescription = async () => {
  if (!jobDescription.trim()) {
    setAiError("Please paste a job description first.");
    return;
  }

  setAiLoading(true);
  setAiError("");
  setAiResult(null);

  try {
    const { data, errors } =
      await client.mutations.analyzeJobDescription({
        jobDescription: jobDescription.trim(),
      });

    if (errors?.length) {
      throw new Error(
        errors.map((item) => item.message).join("\n")
      );
    }

    if (!data) {
      throw new Error("AI did not return any result.");
    }

    const parsedResult =
      typeof data === "string"
        ? JSON.parse(data)
        : data;

    setAiResult({
      company: parsedResult.company || "",
      role: parsedResult.role || "",
      location: parsedResult.location || "",
      deadline: parsedResult.deadline || "",
      skills: Array.isArray(parsedResult.skills)
        ? parsedResult.skills
        : [],
      documents: Array.isArray(parsedResult.documents)
        ? parsedResult.documents
        : [],
    });
  } catch (err) {
    console.error("AI analysis error:", err);

    setAiError(
      err instanceof Error
        ? err.message
        : "Unable to analyze the job description."
    );
  } finally {
    setAiLoading(false);
  }
};

const addAIApplication = async () => {
  if (!aiResult) {
    setAiError("Please analyze a job description first.");
    return;
  }

  setAiLoading(true);
  setAiError("");

  try {
    // Convert AI deadline such as:
    // "September 30, 2026"
    // into AWS date format:
    // "2026-09-30"

    let deadlineValue;

    if (aiResult.deadline) {
      const match = aiResult.deadline.match(
        /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/
      );

      if (match) {
        const [, monthName, day, year] = match;

        const monthMap = {
          January: "01",
          February: "02",
          March: "03",
          April: "04",
          May: "05",
          June: "06",
          July: "07",
          August: "08",
          September: "09",
          October: "10",
          November: "11",
          December: "12",
        };

        const month = monthMap[monthName];

        if (month) {
          deadlineValue = `${year}-${month}-${day.padStart(2, "0")}`;
        }
      }
    }

    const { data, errors } =
      await client.models.InternshipApplication.create({
        company: aiResult.company || "Unknown Company",
        role: aiResult.role || "Internship",
        location: aiResult.location || "Not specified",
        status: "Applied",

        applicationDate:
          new Date().toISOString().split("T")[0],

        deadline: deadlineValue,

        skills: aiResult.skills || [],
        documents: aiResult.documents || [],
        jobDescription: jobDescription.trim(),

        companyLogo:
          aiResult.company?.charAt(0)?.toUpperCase() || "?",
      });

    if (errors?.length) {
      throw new Error(
        errors.map((item) => item.message).join("\n")
      );
    }

    if (!data) {
      throw new Error(
        "AWS did not return the created application."
      );
    }

    setApplications((prev) => [
      toUiApplication(data, prev.length),
      ...prev,
    ]);

    setShowAIModal(false);
    setJobDescription("");
    setAiResult(null);
    setAiError("");

  } catch (err) {
    console.error(
      "Failed to save AI application:",
      err
    );

    setAiError(
      err instanceof Error
        ? err.message
        : "Could not save the AI application to AWS."
    );
  } finally {
    setAiLoading(false);
  }
};

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Target size={22} />
          </div>

          <div>
            <h1>InternFlow</h1>
            <span>From application to offer</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-label">Workspace</p>

          <SidebarItem
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
            active={activePage === "Dashboard"}
            onClick={() => setActivePage("Dashboard")}
          />

          <SidebarItem
            icon={<BriefcaseBusiness size={19} />}
            label="Applications"
            active={activePage === "Applications"}
            onClick={() => setActivePage("Applications")}
            badge={applications.length}
          />

          <SidebarItem
            icon={<CalendarDays size={19} />}
            label="Calendar"
            active={activePage === "Calendar"}
            onClick={() => setActivePage("Calendar")}
          />

          <SidebarItem
            icon={<BarChart3 size={19} />}
            label="Analytics"
            active={activePage === "Analytics"}
            onClick={() => setActivePage("Analytics")}
          />
        </div>

        <div className="sidebar-section">
          <p className="section-label">Manage</p>

          <SidebarItem
            icon={<Settings size={19} />}
            label="Settings"
            active={activePage === "Settings"}
            onClick={() => setActivePage("Settings")}
          />
        </div>

       <div className="sidebar-bottom">

  <button
    type="button"
    className="upgrade-card"
    onClick={() => {
      setShowAIModal(true);
      setAiError("");
      setAiResult(null);
    }}
  >
    <div className="upgrade-icon">
      <Sparkles size={18} />
    </div>

    <div>
      <strong>AI Assistant</strong>
      <p>Let AI organize your internship applications</p>
    </div>
  </button>

 <div className="profile-wrapper">
  <button
    type="button"
    className="profile"
    onClick={() => setShowProfileMenu((value) => !value)}
    title="Open profile menu"
  >
    <div className="profile-avatar">
      {profileLoading
        ? "..."
        : (userProfile?.fullName || "V").charAt(0).toUpperCase()}
    </div>

    <div className="profile-info">
      <strong>
        {profileLoading
          ? "Loading..."
          : userProfile?.fullName || "Complete profile"}
      </strong>

      <span>
        {profileLoading
          ? "Please wait"
          : userProfile?.headline || "Student"}
      </span>
    </div>

    <ChevronDown
      size={16}
      className={showProfileMenu ? "profile-chevron-open" : ""}
    />
  </button>

  {showProfileMenu && (
    <div className="profile-menu">

      <div className="profile-menu-header">
        <div className="profile-menu-avatar">
          {(userProfile?.fullName || "V")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>
          <strong>
            {userProfile?.fullName || "Complete profile"}
          </strong>

          <span>
            {userProfile?.headline || "Student"}
          </span>
        </div>
      </div>

      <div className="profile-menu-divider" />

      <div className="profile-details">
        <div className="profile-detail">
          <span>University</span>
          <strong>
            {userProfile?.university || "Not added"}
          </strong>
        </div>

        <div className="profile-detail">
          <span>Degree</span>
          <strong>
            {userProfile?.degree || "Not added"}
          </strong>
        </div>

        <div className="profile-detail">
          <span>Graduation</span>
          <strong>
            {userProfile?.graduationYear || "Not added"}
          </strong>
        </div>
      </div>

      <div className="profile-menu-divider" />

      <button
        type="button"
        className="profile-menu-item"
        onClick={() => {
          setShowProfileMenu(false);
          setActivePage("Settings");
        }}
      >
        <Settings size={17} />
        <span>Profile settings</span>
      </button>

      <button
        type="button"
        className="profile-menu-item profile-logout"
        onClick={async () => {
          try {
            await signOut();
            window.location.reload();
          } catch (error) {
            console.error("Logout failed:", error);
          }
        }}
      >
        <LogOut size={17} />
        <span>Log out</span>
      </button>

    </div>
  )}
</div>
</div>
      </aside>
  

      {/* MAIN */}
      <main className="main-content">
        {/* TOP BAR */}
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-dot">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="search-shortcut">⌘ K</span>
            </div>

            <div className="notification-wrapper">
              <button
                className="icon-button"
               onClick={async () => {
  if (
    typeof window !== "undefined" &&
    "Notification" in window
  ) {
    let permission = window.Notification.permission;

    if (permission === "default") {
      try {
        permission = await window.Notification.requestPermission();

        setBrowserNotificationPermission(permission);
      } catch (error) {
        console.error(
          "Browser notification permission failed:",
          error
        );
      }
    } else {
      setBrowserNotificationPermission(permission);
    }
  }

  setShowNotifications((value) => !value);
}}
              >
                <Bell size={19} />
                {notifications.length > 0 && (
  <span className="notification-dot"></span>
)}
              </button>

              {showNotifications && (
  <div className="notification-panel">
    <div className="notification-header">
      <strong>Notifications</strong>

      <span>
        {notifications.length === 0
          ? "All caught up"
          : `${notifications.length} ${
              notifications.length === 1
                ? "notification"
                : "notifications"
            }`}
      </span>
    </div>

    {notifications.length === 0 ? (
      <div className="notification-empty">
        <div className="notification-empty-icon">
          <Bell size={18} />
        </div>

        <strong>No upcoming actions</strong>

        <span>
          You're all caught up. We'll show reminders
          here when an application needs your attention.
        </span>
      </div>
    ) : (
      notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          className="notification-item-button"
          onClick={() => {
            const application = applications.find(
              (item) =>
                item.id === notification.applicationId
            );

            if (application) {
              setSelectedApplication(application);
              setShowNotifications(false);
            }
          }}
        >
          <NotificationItem
  title={notification.title}
  description={notification.description}
  type={notification.type}
  date={notification.date}
  dateLabel={notification.dateLabel}
/>
        </button>
      ))
    )}
  </div>
)}
            </div>

            <button
              className="add-button"
              onClick={() => setShowModal(true)}
            >
              <Plus size={18} />
              Add Internship
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="page-content">
  {activePage === "Applications" ? (
    <ApplicationsPage
      applications={applications}
      search={search}
      setSearch={setSearch}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      onAddApplication={() => setShowModal(true)}
      onOpenApplication={(application) =>
        setSelectedApplication(application)
      }
    />
  ) : activePage === "Analytics" ? (
  <AnalyticsPage
    applications={applications}
    onOpenApplication={(application) =>
      setSelectedApplication(application)
    }
  />
) : activePage === "Calendar" ? (
    <div className="calendar-page">
            <div className="calendar-page-header">
        <div>
          <p className="eyebrow">APPLICATION TIMELINE</p>

          <h2>Calendar</h2>

          <p className="welcome-text">
            Keep track of deadlines, assessments, interviews
            and follow-ups from your applications.
          </p>
        </div>

        <div className="calendar-controls">
          <button
            type="button"
            className="calendar-nav-button"
            onClick={previousMonth}
          >
            ‹
          </button>

          <div className="calendar-month-title">
            {monthName} {calendarYear}
          </div>

          <button
            type="button"
            className="calendar-nav-button"
            onClick={nextMonth}
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-layout">

        {/* MONTH CALENDAR */}
        <section className="calendar-card">

          <div className="calendar-weekdays">
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (
              <div key={day}>
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">

            {calendarCells.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="calendar-day empty"
                  />
                );
              }

              const dateString = `${calendarYear}-${String(
                calendarMonth + 1
              ).padStart(2, "0")}-${String(day).padStart(
                2,
                "0"
              )}`;

              const dayEvents = calendarEvents.filter(
                (event) =>
                  event.date?.startsWith(dateString)
              );

              const isToday =
                new Date().getFullYear() === calendarYear &&
                new Date().getMonth() === calendarMonth &&
                new Date().getDate() === day;

              return (
                <div
                  key={dateString}
                  className={`calendar-day ${
                    isToday ? "today" : ""
                  }`}
                >
                  <div className="calendar-day-number">
                    {day}
                  </div>
<div className="calendar-day-events">
  {dayEvents.slice(0, 3).map((event) => (
    <button
      type="button"
      key={`${event.id}-${event.eventType}`}
      className={`calendar-event ${event.type}`}
      onClick={() => {
        const application = applications.find(
          (item) => item.id === event.id
        );

        if (application) {
          setSelectedApplication(application);
        }
      }}
      title={`${event.company} — ${event.label}`}
    >
      <span>{event.company}</span>
    </button>
  ))}

  {dayEvents.length > 3 && (
    <span className="calendar-more">
      +{dayEvents.length - 3} more
    </span>
  )}
</div>
</div>
);
})}          </div>
        </section>

        {/* UPCOMING EVENTS */}
        <aside className="calendar-sidebar">

          <div className="calendar-sidebar-card">

            <div className="calendar-sidebar-header">
              <div>
                <p className="eyebrow">UPCOMING</p>
                <h3>Next actions</h3>
              </div>

              <CalendarDays size={20} />
            </div>

            {calendarEvents
              .filter((event) => {
                const eventDate = new Date(event.date);
                return !Number.isNaN(eventDate.getTime());
              })
              .sort(
                (a, b) =>
                  new Date(a.date) -
                  new Date(b.date)
              )
              .slice(0, 8)
              .map((event) => (
                <button
                  type="button"
                  key={event.id}
                  className="upcoming-event"
                  onClick={() => {
                    const application = applications.find(
                      (item) =>
                        item.id ===
                        event.id
                          .split("-")
                          .slice(0, -1)
                          .join("-")
                    );

                    if (application) {
                      setSelectedApplication(application);
                    }
                  }}
                >
                  <div
                    className={`event-icon ${event.type}`}
                  >
                    <CalendarDays size={15} />
                  </div>

                  <div className="upcoming-event-info">
                    <strong>{event.label}</strong>

                    <span>
                      {event.company} · {event.role}
                    </span>

                    <small>
                      {new Date(
                        event.date
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </small>
                  </div>
                </button>
              ))}

            {calendarEvents.length === 0 && (
              <div className="calendar-empty">
                <CalendarDays size={28} />

                <strong>No scheduled events</strong>

                <span>
                  Add deadlines, interviews or assessments
                  to your applications.
                </span>
              </div>
            )}

          </div>

          {/* LEGEND */}
          <div className="calendar-sidebar-card">

            <p className="eyebrow">EVENT TYPES</p>

            <div className="calendar-legend">
              <span>
                <i className="legend-dot application" />
                Application
              </span>

              <span>
                <i className="legend-dot deadline" />
                Deadline
              </span>

              <span>
                <i className="legend-dot assessment" />
                Assessment
              </span>

              <span>
                <i className="legend-dot interview" />
                Interview
              </span>

              <span>
                <i className="legend-dot followup" />
                Follow-up
              </span>
            </div>

          </div>

                </aside>

      </div>
    </div>
    ) : activePage === "Settings" ? (
      <SettingsPage />
    ) : (
      <>

      <div className="welcome-row">
            <div>
              <p className="eyebrow">{getTodayLabel(currentTime)}</p>

              <h2>
                {getGreeting(currentTime)}, {
                  profileLoading
                    ? "..."
                    : userProfile?.fullName || "there"
                }
              </h2>

              <p className="welcome-text">
                Here's what's happening with your internship search.
              </p>
            </div>

            <button
  type="button"
  className="secondary-button"
  onClick={() =>
    setActivePage("Settings")
  }
>
  <SlidersHorizontal size={17} />
  Customize
</button>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: "18px",
                padding: "12px 16px",
                border: "1px solid rgba(248, 113, 113, 0.35)",
                borderRadius: "12px",
                background: "rgba(127, 29, 29, 0.18)",
                color: "#fecaca",
              }}
            >
              {error}
            </div>
          )}

          {/* STAT CARDS */}
          <section className="stats-grid">
  <StatCard
    label="Total Applications"
    value={stats.total}
    change={
      applicationsThisWeek > 0
        ? `+${applicationsThisWeek} this week`
        : "No new applications this week"
    }
    icon={<BriefcaseBusiness size={20} />}
    type="blue"
    onClick={() => {
      setStatusFilter("All");
      setActivePage("Applications");
    }}
  />

  <StatCard
    label="Active Applications"
    value={stats.active}
    change="Currently in pipeline"
    icon={<TrendingUp size={20} />}
    type="purple"
    onClick={() => {
      setStatusFilter("All");
      setActivePage("Applications");
    }}
  />

  <StatCard
    label="Interviews"
    value={stats.interviews}
    change="Coming up"
    icon={<CalendarDays size={20} />}
    type="orange"
    onClick={() => {
      setStatusFilter("Interview");
      setActivePage("Applications");
    }}
  />

  <StatCard
    label="Offers"
    value={stats.offers}
    change="Keep going 🚀"
    icon={<CheckCircle2 size={20} />}
    type="green"
    onClick={() => {
      setStatusFilter("Offer");
      setActivePage("Applications");
    }}
  />
</section>

          {/* NEEDS YOUR ATTENTION */}
          <section className="panel attention-panel">
            <div className="panel-header">
              <div>
                <h3>Needs Your Attention</h3>
                <p>
                  Important actions based on your current applications.
                </p>
              </div>

              <div className="attention-count">
                {attentionItems.length}
              </div>
            </div>

            {attentionItems.length === 0 ? (
              <div className="attention-empty">
                <CheckCircle2 size={26} />

                <div>
                  <strong>You're all caught up</strong>
                  <p>
                    No urgent interviews, assessments,
                    follow-ups or deadlines right now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="attention-list">
                {attentionItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`attention-item attention-${item.type}`}
                    onClick={() => {
                      const application =
                        applications.find(
                          (application) =>
                            application.id === item.applicationId
                        );

                      if (application) {
                        setSelectedApplication(application);
                      }
                    }}
                  >
                    <div className="attention-icon">
                      {item.type === "interview" && (
                        <CalendarDays size={18} />
                      )}

                      {item.type === "assessment" && (
                        <Clock3 size={18} />
                      )}

                      {item.type === "followup" && (
                        <CircleAlert size={18} />
                      )}

                      {item.type === "deadline" && (
                        <Target size={18} />
                      )}
                    </div>

                    <div className="attention-content">
                      <strong>{item.title}</strong>

                      <span>
                        {item.company} • {item.role}
                      </span>

                      <small>{item.description}</small>
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="attention-arrow"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>


          {/* MAIN GRID */}
          <div className="dashboard-grid">
            {/* APPLICATIONS */}
            {selectedApplication && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setSelectedApplication(null);
      }
    }}
  >
    <div className="modal application-details-modal">
      <div className="modal-header">
        <div>
          <span className="modal-eyebrow">
            APPLICATION DETAILS
          </span>

          <h2>
            {selectedApplication.company ||
              "Unknown Company"}
          </h2>

          <p>
            {selectedApplication.role ||
              "Internship"}
          </p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() =>
            setSelectedApplication(null)
          }
        >
          <X size={19} />
        </button>
      </div>

      <div className="application-detail-grid">
        <div className="detail-item">
          <span>Status</span>

          <strong>
            {selectedApplication.status ||
              "Applied"}
          </strong>
        </div>

        <div className="detail-item">
          <span>Location</span>

          <strong>
            {selectedApplication.location ||
              "Not specified"}
          </strong>
        </div>

        <div className="detail-item">
          <span>Application date</span>

          <strong>
            {selectedApplication.applicationDate ||
              "Not recorded"}
          </strong>
        </div>

        <div className="detail-item">
          <span>Deadline</span>

          <strong>
            {selectedApplication.deadline ||
              "No deadline"}
          </strong>
        </div>
      </div>

            {/* APPLICATION TIMELINE */}
      <div className="application-timeline-section">
        <div className="timeline-heading">
          <div>
            <span className="modal-eyebrow">
              APPLICATION JOURNEY
            </span>

            <h3>Application Timeline</h3>
          </div>

          <span className="timeline-status">
            {selectedApplication.status || "Applied"}
          </span>
        </div>

        <div className="application-timeline">
          {getApplicationTimeline(selectedApplication).map(
            (stage, index) => (
              <div
                key={stage.key}
                className={`timeline-step ${stage.state}`}
              >
                <div className="timeline-marker">
                  {stage.state === "completed" ? (
                    <CheckCircle2 size={16} />
                  ) : stage.state === "current" ? (
                    <CircleDot size={16} />
                  ) : stage.state === "closed" ? (
                    <X size={16} />
                  ) : (
                    <CircleDot size={13} />
                  )}
                </div>

                {index <
                  getApplicationTimeline(
                    selectedApplication
                  ).length -
                    1 && (
                  <div className="timeline-line" />
                )}

                <div className="timeline-content">
                  <strong>{stage.key}</strong>

                  <span>{stage.label}</span>

                  {stage.formattedDate ? (
                    <small>
                      {stage.formattedDate}
                    </small>
                  ) : stage.state === "current" ? (
                    <small>In progress</small>
                  ) : stage.state === "closed" ? (
                    <small>Application closed</small>
                  ) : (
                    <small>Upcoming</small>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {selectedApplication.skills?.length > 0 && (
        <div className="detail-section">
          <h3>Required skills</h3>

          <div className="detail-tags">
            {selectedApplication.skills.map(
              (skill) => (
                <span key={skill}>
                  {skill}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {selectedApplication.documents?.length > 0 && (
        <div className="detail-section">
          <h3>Required documents</h3>

          <div className="detail-tags">
            {selectedApplication.documents.map(
              (document) => (
                <span key={document}>
                  {document}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {selectedApplication.jobDescription && (
        <div className="detail-section">
          <h3>Job description</h3>

          <div className="job-description-preview">
            {selectedApplication.jobDescription}
          </div>
        </div>
      )}

      <div className="modal-footer">
        <button
          type="button"
          className="cancel-button"
          onClick={() =>
            setSelectedApplication(null)
          }
        >
          Close
        </button>

        <button
          type="button"
          className="submit-button"
          onClick={() => {
            setSelectedApplication(null);
            setShowModal(true);
          }}
        >
          <Plus size={17} />
          Add another application
        </button>
      </div>
    </div>
  </div>
)}
            <section className="panel applications-panel">
              <div className="panel-header">
                <div>
                  <h3>Recent Applications</h3>
                  <p>Track every opportunity in one place.</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setActivePage("Applications")}
                >
                  View all
                  <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="filter-row">
                {[
                  "All",
                  "Applied",
                  "Assessment",
                  "Interview",
                  "Follow-up",
                ].map((filter) => (
                  <button
                    key={filter}
                    className={`filter-button ${
                      statusFilter === filter ? "active" : ""
                    }`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="applications-list">
                {loading ? (
                  <div className="empty-state">
                    <Clock3 size={30} />
                    <h4>Loading applications...</h4>
                    <p>Connecting to your AWS workspace.</p>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="empty-state">
                    <Search size={30} />
                    <h4>No applications found</h4>
                    <p>Try changing your search or filter.</p>
                  </div>
                ) : (
                  filteredApplications.map((application) => (
  <ApplicationRow
    key={application.id}
    application={application}
    onOpen={(selected) =>
      setSelectedApplication(selected)
    }
  />
))
                )}
              </div>
            </section>

            {/* RIGHT COLUMN */}
            <div className="right-column">
              {/* UPCOMING */}
              <section className="panel">
                <div className="panel-header compact">
                  <div>
                    <h3>Upcoming</h3>
                    <p>Things that need your attention.</p>
                  </div>

                 <button
  type="button"
  className="dashboard-icon-button"
  onClick={() =>
    setActivePage("Calendar")
  }
  title="Open Calendar"
>
  <CalendarDays size={19} />
</button>
                </div>

                <div className="upcoming-list">
                  {upcomingDashboardEvents.length === 0 ? (
                    <div className="empty-state">
                      <CalendarDays size={28} />
                      <h4>No upcoming actions</h4>
                      <p>
                        Your upcoming interviews, assessments, deadlines
                        and follow-ups will appear here.
                      </p>
                    </div>
                  ) : (
                    upcomingDashboardEvents.map((event) => (
                      <UpcomingItem
                        key={event.id}
                        date={formatUpcomingDate(event.date)}
                        title={`${event.label} — ${event.company}`}
                        subtitle={event.role}
                        type={event.type}
                        onClick={() => {
                          const application = applications.find(
                            (item) => item.id === event.applicationId
                          );

                          if (application) {
                            setSelectedApplication(application);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </section>

              {/* PIPELINE */}
              <section className="panel pipeline-panel">
                <div className="panel-header compact">
                  <div>
                    <h3>Application Pipeline</h3>
                    <p>Your current progress.</p>
                  </div>

                  <button
  type="button"
  className="dashboard-icon-button"
  onClick={() =>
    setActivePage("Analytics")
  }
  title="Open Analytics"
>
  <BarChart3 size={19} />
</button>
                </div>

                <PipelineRow
                  label="Applied"
                  value={applications.filter(
                    (a) => a.status === "Applied"
                  ).length}
                  total={applications.length}
                  color="blue"
                />

                <PipelineRow
                  label="Assessment"
                  value={applications.filter(
                    (a) => a.status === "Assessment"
                  ).length}
                  total={applications.length}
                  color="purple"
                />

                <PipelineRow
                  label="Interview"
                  value={applications.filter(
                    (a) => a.status === "Interview"
                  ).length}
                  total={applications.length}
                  color="orange"
                />

                <PipelineRow
                  label="Offer"
                  value={applications.filter(
                    (a) => a.status === "Offer"
                  ).length}
                  total={applications.length}
                  color="green"
                />
              </section>
            </div>
          </div>

          {/* AI SECTION */}
          <section className="ai-banner">
            <div className="ai-banner-icon">
              <Sparkles size={24} />
            </div>

            <div className="ai-banner-content">
              <span className="ai-label">COMING NEXT</span>

              <h3>
                Let AI organize your internship applications
              </h3>

              <p>
                Paste a job description and InternFlow will extract the
                company, role, deadline, skills and required documents
                automatically using Amazon Bedrock.
              </p>
            </div>

            <button
              className="ai-button"
              onClick={() => {
    setShowAIModal(true);
    setAiError("");
    setAiResult(null);
  }}
            >
              <Sparkles size={17} />
              Try it
            </button>
          </section>
          </>
      )}
        </div>
      </main>

      {/* ADD MODAL */}
      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-icon">
                  <Plus size={20} />
                </div>

                <h3>Add Internship</h3>

                <p>
                  Add an opportunity to your application pipeline.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={addApplication}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company *</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon"
                    value={form.company}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer Intern"
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={form.location}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Application deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        deadline: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>Current status</label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                  >
                    <option>Applied</option>
                    <option>Assessment</option>
                    <option>Interview</option>
                    <option>Follow-up</option>
                    <option>Offer</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>

                            <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                >
                  <Plus size={17} />
                  Add Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLICATION DETAIL DRAWER */}
{selectedApplication && (
  <div
    className="application-detail-overlay"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setSelectedApplication(null);
      }
    }}
  >
    <aside className="application-detail-drawer">
      <div className="detail-drawer-header">
        <div className="detail-company-heading">
          <div className="detail-company-logo">
            {selectedApplication.companyLogo ||
              selectedApplication.company
                ?.charAt(0)
                ?.toUpperCase() ||
              "?"}
          </div>

          <div>
            <span className="detail-eyebrow">
              APPLICATION
            </span>

            <h2>
              {selectedApplication.company ||
                "Unknown Company"}
            </h2>

            <p>
              {selectedApplication.role ||
                "Internship"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="detail-close-button"
          onClick={() =>
            setSelectedApplication(null)
          }
        >
          <X size={19} />
        </button>
      </div>

      <div className="detail-drawer-body">
        {(() => {
  const workflow =
    getApplicationWorkflow(
      selectedApplication
    );

  return (
    <>
      <div className="workflow-summary-card">
        <div className="workflow-summary-top">
          <div>
            <span className="workflow-label">
              APPLICATION PROGRESS
            </span>

            <h3>{workflow.headline}</h3>
          </div>

          <strong>
            {workflow.progress}%
          </strong>
        </div>

        <div className="workflow-progress-track">
          <div
            className="workflow-progress-fill"
            style={{
              width: `${workflow.progress}%`,
            }}
          />
        </div>

        <p>
          {workflow.description}
        </p>

        <div className="workflow-next-action">
          <Sparkles size={15} />

          <div>
            <span>NEXT ACTION</span>
            <strong>
              {workflow.nextAction}
            </strong>
          </div>
        </div>
      </div>

      <section className="workflow-section">
        <div className="detail-section-title">
          <Target size={16} />
          <h3>Application journey</h3>
        </div>

        <div className="workflow-stages">
          {workflow.stages.map(
            (item, index) => (
              <div
                key={item.stage}
                className={`workflow-stage ${item.state}`}
              >
                <div className="workflow-stage-marker">
                  {item.state === "done" ? (
                    <CheckCircle2 size={14} />
                  ) : item.state === "current" ? (
                    <CircleDot size={14} />
                  ) : (
                    <CircleDot size={12} />
                  )}
                </div>

                <div className="workflow-stage-content">
                  <strong>
                    {item.stage}
                  </strong>

                  <span>
                    {item.state === "done"
                      ? "Completed"
                      : item.state === "current"
                      ? "In progress"
                      : "Upcoming"}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
})()}

{editingApplication && (
  <section className="workflow-section edit-application-section">
    <div className="detail-section-title">
      <Settings size={16} />
      <h3>Update application</h3>
    </div>

    <div className="detail-edit-grid">

      <label>
        <span>Status</span>

        <select
          value={
            applicationEditForm.status ||
            "Applied"
          }
          onChange={(event) =>
            setApplicationEditForm((previous) => ({
              ...previous,
              status: event.target.value,
            }))
          }
        >
          <option value="Applied">
            Applied
          </option>

          <option value="Assessment">
            Assessment
          </option>

          <option value="Interview">
            Interview
          </option>

          <option value="Follow-up">
            Follow-up
          </option>

          <option value="Offer">
            Offer
          </option>

          <option value="Rejected">
            Rejected
          </option>
        </select>
      </label>

      <label>
        <span>Deadline</span>

        <input
          type="date"
          value={
            applicationEditForm.deadline ||
            ""
          }
          onChange={(event) =>
            setApplicationEditForm((previous) => ({
              ...previous,
              deadline: event.target.value,
            }))
          }
        />
      </label>

      <label>
        <span>Assessment date</span>

        <input
          type="date"
          value={
            applicationEditForm.assessmentDate ||
            ""
          }
          onChange={(event) =>
            setApplicationEditForm((previous) => ({
              ...previous,
              assessmentDate:
                event.target.value,
            }))
          }
        />
      </label>

      <label>
        <span>Interview date</span>

        <input
          type="date"
          value={
            applicationEditForm.interviewDate ||
            ""
          }
          onChange={(event) =>
            setApplicationEditForm((previous) => ({
              ...previous,
              interviewDate:
                event.target.value,
            }))
          }
        />
      </label>

      <label>
        <span>Follow-up date</span>

        <input
          type="date"
          value={
            applicationEditForm.followUpDate ||
            ""
          }
          onChange={(event) =>
            setApplicationEditForm((previous) => ({
              ...previous,
              followUpDate:
                event.target.value,
            }))
          }
        />
      </label>

      <label className="detail-edit-notes">
        <span>Notes</span>

        <textarea
          rows="4"
          placeholder="Add interview notes, recruiter details, next steps..."
          value={
            applicationEditForm.notes || ""
          }
          onChange={(event) =>
            setApplicationEditForm((previous) => ({
              ...previous,
              notes: event.target.value,
            }))
          }
        />
      </label>

    </div>
  </section>
)}

        {/* STATUS */}
        <div className="detail-status-card">
          <div>
            <span>Current status</span>

            <strong>
              {selectedApplication.status ||
                "Applied"}
            </strong>
          </div>

          <div className="detail-status-dot" />
        </div>

        {/* CORE INFORMATION */}
        <section className="detail-information-section">
          <div className="detail-section-title">
            <BriefcaseBusiness size={16} />
            <h3>Application information</h3>
          </div>

          <div className="detail-information-grid">

            <div className="detail-information-item">
              <span>Company</span>
              <strong>
                {selectedApplication.company ||
                  "Not specified"}
              </strong>
            </div>

            <div className="detail-information-item">
              <span>Job role</span>
              <strong>
                {selectedApplication.role ||
                  "Not specified"}
              </strong>
            </div>

            <div className="detail-information-item">
              <span>Location</span>
              <strong>
                {selectedApplication.location ||
                  "Not specified"}
              </strong>
            </div>

            <div className="detail-information-item">
              <span>Source</span>
              <strong>
                {selectedApplication.source ||
                  "Not specified"}
              </strong>
            </div>

          </div>
        </section>

        {/* DATES */}
        <section className="detail-information-section">
          <div className="detail-section-title">
            <CalendarDays size={16} />
            <h3>Important dates</h3>
          </div>

          <div className="detail-timeline">

            <div className="detail-timeline-item">
              <div className="timeline-icon">
                <CheckCircle2 size={15} />
              </div>

              <div>
                <span>Applied</span>
                <strong>
                  {selectedApplication.applicationDate
  ? formatDate(
      selectedApplication.applicationDate
    )
  : "Not recorded"}
                </strong>
              </div>
            </div>

            <div className="detail-timeline-item">
              <div className="timeline-icon deadline">
                <Clock3 size={15} />
              </div>

              <div>
                <span>Application deadline</span>
                <strong>
                  {selectedApplication.deadline ||
                    "No deadline"}
                </strong>
              </div>
            </div>

            <div className="detail-timeline-item">
              <div className="timeline-icon">
                <CalendarDays size={15} />
              </div>

              <div>
                <span>Assessment</span>
                <strong>
                  {selectedApplication.assessmentDate
  ? formatDate(
      selectedApplication.assessmentDate
    )
  : ["Interview", "Follow-up", "Offer"].includes(
      selectedApplication.status
    )
  ? "Completed"
  : "Not scheduled"}
                </strong>
              </div>
            </div>

            <div className="detail-timeline-item">
              <div className="timeline-icon">
                <CalendarDays size={15} />
              </div>

              <div>
                <span>Interview</span>
                <strong>
                  {selectedApplication.interviewDate
  ? formatDate(
      selectedApplication.interviewDate
    )
  : selectedApplication.status === "Interview"
  ? "In progress"
  : ["Follow-up", "Offer"].includes(
      selectedApplication.status
    )
  ? "Completed"
  : "Not scheduled"}
                </strong>
              </div>
            </div>

            <div className="detail-timeline-item">
              <div className="timeline-icon">
                <ArrowUpRight size={15} />
              </div>

              <div>
                <span>Follow-up</span>
                <strong>
                  {selectedApplication.followUpDate
  ? formatDate(
      selectedApplication.followUpDate
    )
  : selectedApplication.status === "Follow-up"
  ? "In progress"
  : selectedApplication.status === "Offer"
  ? "Completed"
  : selectedApplication.status === "Interview"
  ? "Recommended next"
  : "Not scheduled"}
                </strong>
              </div>
            </div>

          </div>
        </section>

        {/* SKILLS */}
        {selectedApplication.skills?.length > 0 && (
          <section className="detail-information-section">
            <div className="detail-section-title">
              <Target size={16} />
              <h3>Required skills</h3>
            </div>

            <div className="detail-tag-list">
              {selectedApplication.skills.map(
                (skill) => (
                  <span key={skill}>
                    {skill}
                  </span>
                )
              )}
            </div>
          </section>
        )}

        {/* DOCUMENTS */}
        {selectedApplication.documents?.length > 0 && (
          <section className="detail-information-section">
            <div className="detail-section-title">
              <FileText size={16} />
              <h3>Required documents</h3>
            </div>

            <div className="detail-tag-list document-tags">
              {selectedApplication.documents.map(
                (document) => (
                  <span key={document}>
                    {document}
                  </span>
                )
              )}
            </div>
          </section>
        )}

        {/* JOB DESCRIPTION */}
        {selectedApplication.jobDescription && (
          <section className="detail-information-section">
            <div className="detail-section-title">
              <FileText size={16} />
              <h3>Job description</h3>
            </div>

            <div className="detail-job-description">
              {selectedApplication.jobDescription}
            </div>
          </section>
        )}

        {/* NOTES */}
        {selectedApplication.notes && (
          <section className="detail-information-section">
            <div className="detail-section-title">
              <FileText size={16} />
              <h3>Notes</h3>
            </div>

            <div className="detail-notes">
              {selectedApplication.notes}
            </div>
          </section>
        )}

      </div>

      <div className="detail-drawer-footer">
  <button
    type="button"
    className="detail-secondary-button"
    onClick={() => {
      setEditingApplication(false);
      setSelectedApplication(null);
    }}
  >
    Close
  </button>

  {!editingApplication ? (
    <button
      type="button"
      className="detail-primary-button"
      onClick={startEditingApplication}
    >
      <Settings size={16} />
      Edit application
    </button>
  ) : (
    <button
      type="button"
      className="detail-primary-button"
      onClick={saveApplicationChanges}
      disabled={savingApplication}
    >
      <CheckCircle2 size={16} />

      {savingApplication
        ? "Saving..."
        : "Save changes"}
    </button>
  )}
</div>
</aside>
</div>
)}

      {/* AI JOB DESCRIPTION MODAL */}
      {showAIModal && (
        <div
          className="modal-backdrop ai-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowAIModal(false);
            }
          }}
        >
          <div
            className="modal ai-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-analyzer-title"
          >
            <div className="modal-header">
              <div>
                <div className="modal-icon">
                  <Sparkles size={20} />
                </div>

                <h3 id="ai-analyzer-title">AI Job Description Analyzer</h3>

                <p>
                  Paste a job description and let AI extract the important details.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAIModal(false)}
              >
                <X size={19} />
              </button>
            </div>
            <div className="form-group">
              <label>Job Description</label>

              <textarea
                rows="9"
                placeholder="Paste the internship or job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {aiError && (
              <div
                role="alert"
                style={{
                  marginTop: "14px",
                  padding: "12px 14px",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                  borderRadius: "12px",
                  background: "rgba(127, 29, 29, 0.18)",
                  color: "#fecaca",
                  whiteSpace: "pre-wrap",
                }}
              >
                {aiError}
              </div>
            )}

            {aiResult && (
              <div className="ai-result">
                <div className="ai-result-header">
                  <div>
                    <span className="ai-label">AI ANALYSIS</span>
                    <h4>Extracted Information</h4>
                  </div>

                  <Sparkles size={18} />
                </div>

                <div className="ai-result-grid">
                  <div className="ai-result-item">
                    <span>Company</span>
                    <strong>{aiResult.company || "Not found"}</strong>
                  </div>

                  <div className="ai-result-item">
                    <span>Role</span>
                    <strong>{aiResult.role || "Not found"}</strong>
                  </div>

                  <div className="ai-result-item">
                    <span>Location</span>
                    <strong>{aiResult.location || "Not found"}</strong>
                  </div>

                  <div className="ai-result-item">
                    <span>Deadline</span>
                    <strong>{aiResult.deadline || "Not found"}</strong>
                  </div>
                </div>

                <div className="ai-result-section">
                  <span>Skills</span>

                  <div className="ai-tags">
                    {(aiResult.skills || []).length > 0 ? (
                      aiResult.skills.map((skill, index) => (
                        <span key={index}>{skill}</span>
                      ))
                    ) : (
                      <small>No skills found</small>
                    )}
                  </div>
                </div>

                <div className="ai-result-section">
                  <span>Required Documents</span>

                  <div className="ai-tags">
                    {(aiResult.documents || []).length > 0 ? (
                      aiResult.documents.map((document, index) => (
                        <span key={index}>{document}</span>
                      ))
                    ) : (
                      <small>No documents found</small>
                    )}
                  </div>
                </div>
              </div>
            )}

                        <div className="modal-footer">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowAIModal(false)}
              >
                Close
              </button>

              {aiResult && (
                <button
                  type="button"
                  className="submit-button"
                  onClick={addAIApplication}
                  disabled={aiLoading}
                >
                  <Plus size={17} />

                  {aiLoading
                    ? "Saving..."
                    : "Add to Applications"}
                </button>
              )}

              <button
                type="button"
                className="submit-button"
                onClick={analyzeJobDescription}
                disabled={aiLoading}
              >
                <Sparkles size={17} />

                {aiLoading
                  ? "Analyzing..."
                  : "Analyze with AI"}
              </button>
            </div>
          </div>
        </div>
      )}
     
    </div>
  );
}
 
function SidebarItem({
  icon,
  label,
  active,
  onClick,
  badge,
}) {
  return (
    <button
      className={`sidebar-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}

      <span>{label}</span>

      {badge !== undefined && (
        <span className="sidebar-badge">{badge}</span>
      )}
    </button>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
  type,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`stat-card ${onClick ? "stat-card-clickable" : ""}`}
      onClick={onClick}
    >
      <div className={`stat-icon ${type}`}>
        {icon}
      </div>

      <div className="stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{change}</small>
      </div>

      <ArrowUpRight
        className="stat-arrow"
        size={17}
      />
    </button>
  );
}

function ApplicationRow({
  application,
  onOpen,
}) {
  const config =
    statusConfig[application.status] ||
    statusConfig.Applied;

  const StatusIcon = config.icon;

  return (
    <div
      className="application-row application-row-clickable"
      onClick={() => onOpen?.(application)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          onOpen?.(application);
        }
      }}
    >
      <div
        className={`company-logo ${application.color}`}
      >
        {application.logo}
      </div>

      <div className="application-main">
        <strong>{application.company}</strong>

        <span>{application.role}</span>

        <div className="application-location">
          <MapPin size={13} />
          {application.location}
        </div>
      </div>

      <div className="application-deadline">
        <span>Deadline</span>
        <strong>{application.deadline}</strong>
      </div>

      <div
        className={`status-pill ${config.className}`}
      >
        <StatusIcon size={14} />
        {application.status}
      </div>

      <button
        type="button"
        className="more-button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen?.(application);
        }}
        aria-label={`Open ${application.company}`}
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}

function UpcomingItem({
  date,
  title,
  subtitle,
  type,
  onClick,
}) {
  return (
    <button
      type="button"
      className="upcoming-item upcoming-item-clickable"
      onClick={onClick}
    >
      <div className={`date-box ${type}`}>
        <strong>
          {date.split(" ")[1]}
        </strong>

        <span>
          {date.split(" ")[0]}
        </span>
      </div>

      <div className="upcoming-content">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <ExternalLink
        size={15}
        className="upcoming-arrow"
      />
    </button>
  );
}

function PipelineRow({
  label,
  value,
  total,
  color,
}) {
  const percentage =
    total === 0 ? 0 : Math.max((value / total) * 100, 5);

  return (
    <div className="pipeline-row">
      <div className="pipeline-top">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="pipeline-bar">
        <div
          className={`pipeline-progress ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function NotificationItem({
  title,
  description,
  type,
  date,
  dateLabel,
}) {
  return (
    <div className="notification-item">
      <div className={`notification-icon ${type}`}>
        <CircleAlert size={15} />
      </div>

      <div className="notification-content">
        <strong>{title}</strong>

        <span>{description}</span>

        {date && (
          <small className="notification-date">
            📅 {dateLabel}: {formatNotificationDate(date)}
          </small>
        )}
      </div>
    </div>
  );
}

export default App;