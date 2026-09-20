import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const STATUS_ORDER = [
  "Applied",
  "Assessment",
  "Interview",
  "Follow-up",
  "Offer",
  "Rejected",
];

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(value) {
  if (!value) return null;

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export default function AnalyticsPage({
  applications = [],
  onOpenApplication,
}) {
  const total = applications.length;

  const activeApplications = applications.filter(
    (application) =>
      !["Offer", "Rejected"].includes(
        application.status
      )
  ).length;

  const interviews = applications.filter(
    (application) =>
      application.status === "Interview"
  ).length;

  const assessments = applications.filter(
    (application) =>
      application.status === "Assessment"
  ).length;

  const followUps = applications.filter(
    (application) =>
      application.status === "Follow-up"
  ).length;

  const offers = applications.filter(
    (application) =>
      application.status === "Offer"
  ).length;

  const rejected = applications.filter(
    (application) =>
      application.status === "Rejected"
  ).length;

  const statusCounts = STATUS_ORDER.map(
    (status) => ({
      status,
      count: applications.filter(
        (application) =>
          application.status === status
      ).length,
    })
  );

  const maxStatusCount = Math.max(
    ...statusCounts.map((item) => item.count),
    1
  );

  const skillCounts = {};

  applications.forEach((application) => {
    if (!Array.isArray(application.skills)) {
      return;
    }

    application.skills.forEach((skill) => {
      if (!skill) return;

      const cleanSkill = String(skill).trim();

      if (!cleanSkill) return;

      skillCounts[cleanSkill] =
        (skillCounts[cleanSkill] || 0) + 1;
    });
  });

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const applicationsWithDeadlines =
    applications
      .map((application) => ({
        ...application,
        deadlineDays: daysUntil(
          application.deadline
        ),
      }))
      .filter(
        (application) =>
          application.deadlineDays !== null
      )
      .sort(
        (a, b) =>
          a.deadlineDays - b.deadlineDays
      );

  const overdueApplications =
    applicationsWithDeadlines.filter(
      (application) =>
        application.deadlineDays < 0 &&
        !["Offer", "Rejected"].includes(
          application.status
        )
    );

  const upcomingDeadlines =
    applicationsWithDeadlines.filter(
      (application) =>
        application.deadlineDays >= 0 &&
        application.deadlineDays <= 7 &&
        !["Offer", "Rejected"].includes(
          application.status
        )
    );

  const attentionApplications = [
    ...overdueApplications,
    ...upcomingDeadlines,
  ].slice(0, 5);

  const interviewRate =
    total > 0
      ? Math.round((interviews / total) * 100)
      : 0;

  const assessmentRate =
    total > 0
      ? Math.round((assessments / total) * 100)
      : 0;

  const offerRate =
    total > 0
      ? Math.round((offers / total) * 100)
      : 0;

  const progressRate =
    total > 0
      ? Math.round(
          ((interviews +
            followUps +
            offers) /
            total) *
            100
        )
      : 0;

  const recentApplications = [...applications]
    .filter(
      (application) =>
        application.applicationDate
    )
    .sort(
      (a, b) =>
        new Date(b.applicationDate) -
        new Date(a.applicationDate)
    )
    .slice(0, 6);

  return (
    <div className="analytics-page">
      {/* HEADER */}
      <div className="analytics-page-header">
        <div>
          <p className="eyebrow">
            APPLICATION INTELLIGENCE
          </p>

          <h2>Analytics</h2>

          <p className="welcome-text">
            Understand your internship search using
            the applications you've actually tracked.
          </p>
        </div>

        <div className="analytics-live-badge">
          <span className="analytics-live-dot" />
          Live data
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <section className="analytics-summary-grid">
        <div className="analytics-summary-card">
          <div className="analytics-summary-icon blue">
            <BriefcaseBusiness size={20} />
          </div>

          <div>
            <span>Total applications</span>
            <strong>{total}</strong>
            <small>Tracked in InternFlow</small>
          </div>
        </div>

        <div className="analytics-summary-card">
          <div className="analytics-summary-icon purple">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>Active pipeline</span>
            <strong>{activeApplications}</strong>
            <small>Still in progress</small>
          </div>
        </div>

        <div className="analytics-summary-card">
          <div className="analytics-summary-icon orange">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>Interviews</span>
            <strong>{interviews}</strong>
            <small>{interviewRate}% of applications</small>
          </div>
        </div>

        <div className="analytics-summary-card">
          <div className="analytics-summary-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Offers</span>
            <strong>{offers}</strong>
            <small>{offerRate}% of applications</small>
          </div>
        </div>
      </section>

      {/* MAIN ANALYTICS GRID */}
      <div className="analytics-main-grid">
        {/* PIPELINE */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <p className="eyebrow">
                PIPELINE
              </p>

              <h3>Application funnel</h3>
            </div>

            <BarChart3 size={20} />
          </div>

          <div className="analytics-funnel">
            {statusCounts.map(
              ({ status, count }) => {
                const percentage =
                  Math.round(
                    (count /
                      maxStatusCount) *
                      100
                  );

                const totalPercentage =
                  total > 0
                    ? Math.round(
                        (count / total) *
                          100
                      )
                    : 0;

                return (
                  <div
                    className="analytics-funnel-row"
                    key={status}
                  >
                    <div className="analytics-funnel-label">
                      <span>{status}</span>
                      <strong>{count}</strong>
                    </div>

                    <div className="analytics-bar-track">
                      <div
                        className={`analytics-bar ${status
                          .toLowerCase()
                          .replace("-", "")}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <small>
                      {totalPercentage}%
                    </small>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* SEARCH PROGRESS */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <p className="eyebrow">
                PROGRESS
              </p>

              <h3>Search health</h3>
            </div>

            <Target size={20} />
          </div>

          <div className="analytics-health">
            <div className="analytics-health-ring">
              <div>
                <strong>
                  {progressRate}%
                </strong>

                <span>progressed</span>
              </div>
            </div>

            <div className="analytics-health-items">
              <div>
                <span>Assessments</span>
                <strong>
                  {assessments}
                </strong>
              </div>

              <div>
                <span>Interviews</span>
                <strong>
                  {interviews}
                </strong>
              </div>

              <div>
                <span>Follow-ups</span>
                <strong>
                  {followUps}
                </strong>
              </div>

              <div>
                <span>Rejected</span>
                <strong>{rejected}</strong>
              </div>
            </div>
          </div>

          <div className="analytics-rate-list">
            <div>
              <span>Assessment rate</span>
              <strong>
                {assessmentRate}%
              </strong>
            </div>

            <div>
              <span>Interview rate</span>
              <strong>
                {interviewRate}%
              </strong>
            </div>

            <div>
              <span>Offer rate</span>
              <strong>
                {offerRate}%
              </strong>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <p className="eyebrow">
                DEMAND SIGNAL
              </p>

              <h3>Most requested skills</h3>
            </div>
          </div>

          {topSkills.length > 0 ? (
            <div className="analytics-skills">
              {topSkills.map(
                ([skill, count]) => {
                  const maxSkillCount =
                    topSkills[0][1];

                  const width =
                    Math.round(
                      (count /
                        maxSkillCount) *
                        100
                    );

                  return (
                    <div
                      className="analytics-skill-row"
                      key={skill}
                    >
                      <div>
                        <span>{skill}</span>
                        <strong>
                          {count}
                        </strong>
                      </div>

                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar skill"
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="analytics-empty">
              <BarChart3 size={28} />
              <strong>
                No skill data yet
              </strong>
              <span>
                Add applications with required
                skills to see demand signals.
              </span>
            </div>
          )}
        </section>

        {/* DEADLINE INTELLIGENCE */}
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <p className="eyebrow">
                ATTENTION
              </p>

              <h3>Deadline intelligence</h3>
            </div>

            <Clock3 size={20} />
          </div>

          <div className="deadline-summary">
            <div className="deadline-summary-item danger">
              <AlertTriangle size={18} />

              <div>
                <strong>
                  {overdueApplications.length}
                </strong>

                <span>
                  overdue
                </span>
              </div>
            </div>

            <div className="deadline-summary-item warning">
              <Clock3 size={18} />

              <div>
                <strong>
                  {upcomingDeadlines.length}
                </strong>

                <span>
                  due within 7 days
                </span>
              </div>
            </div>
          </div>

          {attentionApplications.length >
          0 ? (
            <div className="deadline-list">
              {attentionApplications.map(
                (application) => {
                  const overdue =
                    application.deadlineDays <
                    0;

                  return (
                    <button
                      type="button"
                      className="deadline-item"
                      key={application.id}
                      onClick={() =>
                        onOpenApplication?.(
                          application
                        )
                      }
                    >
                      <div>
                        <strong>
                          {application.company}
                        </strong>

                        <span>
                          {application.role}
                        </span>
                      </div>

                      <small
                        className={
                          overdue
                            ? "danger-text"
                            : "warning-text"
                        }
                      >
                        {overdue
                          ? `${Math.abs(
                              application.deadlineDays
                            )}d overdue`
                          : application.deadlineDays ===
                            0
                          ? "Due today"
                          : `${application.deadlineDays}d left`}
                      </small>
                    </button>
                  );
                }
              )}
            </div>
          ) : (
            <div className="analytics-empty compact">
              <CheckCircle2 size={25} />

              <strong>
                No urgent deadlines
              </strong>

              <span>
                Your tracked deadlines look clear.
              </span>
            </div>
          )}
        </section>
      </div>

      {/* RECENT ACTIVITY */}
      <section className="analytics-card analytics-recent-card">
        <div className="analytics-card-header">
          <div>
            <p className="eyebrow">
              ACTIVITY
            </p>

            <h3>Recent applications</h3>
          </div>

          <span className="analytics-count">
            {recentApplications.length}
          </span>
        </div>

        {recentApplications.length > 0 ? (
          <div className="analytics-recent-list">
            {recentApplications.map(
              (application) => (
                <button
                  type="button"
                  className="analytics-recent-item"
                  key={application.id}
                  onClick={() =>
                    onOpenApplication?.(
                      application
                    )
                  }
                >
                  <div className="analytics-company-avatar">
                    {(
                      application.company ||
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="analytics-recent-info">
                    <strong>
                      {application.company}
                    </strong>

                    <span>
                      {application.role}
                    </span>
                  </div>

                  <div className="analytics-recent-status">
                    <span>
                      {application.status}
                    </span>

                    <small>
                      {formatDate(
                        application.applicationDate
                      )}
                    </small>
                  </div>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="analytics-empty">
            <BriefcaseBusiness size={28} />

            <strong>
              No applications yet
            </strong>

            <span>
              Start tracking applications to build
              your analytics.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}