import {
  Search,
  Plus,
  MapPin,
  CalendarDays,
  Clock3,
  ChevronRight,
  MoreHorizontal,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  CircleDot,
} from "lucide-react";

const STATUS_OPTIONS = [
  "All",
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
  "Rejected",
];

function getStatusClass(status) {
  const value = status?.toLowerCase();

  if (value === "offer") return "status-offer";
  if (value === "interview") return "status-interview";
  if (value === "assessment") return "status-assessment";
  if (value === "rejected") return "status-rejected";

  return "status-applied";
}

function getStatusIcon(status) {
  const value = status?.toLowerCase();

  if (value === "offer") {
    return <CheckCircle2 size={15} />;
  }

  if (value === "rejected") {
    return <CircleAlert size={15} />;
  }

  if (value === "interview" || value === "assessment") {
    return <Clock3 size={15} />;
  }

  return <CircleDot size={15} />;
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDeadlineState(deadline) {
  if (!deadline) {
    return {
      label: "No deadline",
      className: "",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const difference =
    Math.ceil(
      (deadlineDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  if (difference < 0) {
    return {
      label: "Deadline passed",
      className: "deadline-danger",
    };
  }

  if (difference <= 3) {
    return {
      label:
        difference === 0
          ? "Due today"
          : `${difference}d left`,
      className: "deadline-warning",
    };
  }

  return {
    label: `${difference}d left`,
    className: "",
  };
}

export default function ApplicationsPage({
  applications,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onAddApplication,
  onOpenApplication,
}) {
  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      !search.trim() ||
      application.company
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      application.role
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      application.location
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = STATUS_OPTIONS.reduce(
    (counts, status) => {
      if (status === "All") {
        counts[status] = applications.length;
      } else {
        counts[status] = applications.filter(
          (application) =>
            application.status === status
        ).length;
      }

      return counts;
    },
    {}
  );

  return (
    <div className="applications-page">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">
            INTERNSHIP PIPELINE
          </div>

          <h1>Applications</h1>

          <p>
            Manage every internship from application to
            offer.
          </p>
        </div>

        <button
          className="primary-action"
          onClick={onAddApplication}
        >
          <Plus size={17} />
          Add Internship
        </button>
      </div>

      <div className="application-summary-grid">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            className={`application-summary-card ${
              statusFilter === status
                ? "selected"
                : ""
            }`}
            onClick={() => setStatusFilter(status)}
          >
            <div className="summary-card-top">
              <span>
                {status === "All"
                  ? "All applications"
                  : status}
              </span>

              <span className="summary-card-count">
                {statusCounts[status]}
              </span>
            </div>

            <div className="summary-card-line">
              <span />
            </div>
          </button>
        ))}
      </div>

      <div className="applications-toolbar">
        <div className="application-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search company, role or location..."
          />
        </div>

        <div className="application-filter-group">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              className={
                statusFilter === status
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() =>
                setStatusFilter(status)
              }
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="applications-panel">
        <div className="applications-panel-header">
          <div>
            <h2>Your applications</h2>

            <span>
              {filteredApplications.length}{" "}
              {filteredApplications.length === 1
                ? "application"
                : "applications"}
            </span>
          </div>

          <div className="pipeline-label">
            <BriefcaseBusiness size={16} />
            Live pipeline
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="applications-empty">
            <div className="empty-icon">
              <BriefcaseBusiness size={24} />
            </div>

            <h3>No applications found</h3>

            <p>
              Try another search or add a new internship
              application.
            </p>

            <button
              className="primary-action"
              onClick={onAddApplication}
            >
              <Plus size={17} />
              Add Internship
            </button>
          </div>
        ) : (
          <div className="applications-table">
            <div className="applications-table-header">
              <span>Company & role</span>
              <span>Status</span>
              <span>Applied</span>
              <span>Deadline</span>
              <span />
            </div>

            {filteredApplications.map(
              (application) => {
                const deadlineState =
                  getDeadlineState(
                    application.deadline
                  );

                return (
                  <button
                    key={application.id}
                    className="application-table-row"
                    onClick={() =>
                      onOpenApplication(application)
                    }
                  >
                    <div className="application-company-cell">
                      <div className="company-logo">
                        {application.companyLogo ||
                          application.company
                            ?.charAt(0)
                            ?.toUpperCase() ||
                          "?"}
                      </div>

                      <div className="company-info">
                        <strong>
                          {application.company ||
                            "Unknown Company"}
                        </strong>

                        <span>
                          {application.role ||
                            "Internship"}
                        </span>

                        {application.location && (
                          <small>
                            <MapPin size={12} />
                            {application.location}
                          </small>
                        )}
                      </div>
                    </div>

                    <div>
                      <span
                        className={`application-status ${getStatusClass(
                          application.status
                        )}`}
                      >
                        {getStatusIcon(
                          application.status
                        )}

                        {application.status ||
                          "Applied"}
                      </span>
                    </div>

                    <div className="application-date">
                      <CalendarDays size={14} />
                      {formatDate(
                        application.applicationDate
                      )}
                    </div>

                    <div
                      className={`application-deadline ${deadlineState.className}`}
                    >
                      <span>
                        {formatDate(
                          application.deadline
                        )}
                      </span>

                      <small>
                        {deadlineState.label}
                      </small>
                    </div>

                    <div className="application-row-action">
                      <ChevronRight size={18} />
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}