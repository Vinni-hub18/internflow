import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import {
  Settings,
  GraduationCap,
  Bell,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

const client = generateClient();

const DEFAULT_PROFILE = {
  fullName: "",
  headline: "",
  university: "",
  degree: "",
  graduationYear: "",
  bio: "",
  skills: "",
  targetRoles: "",
  preferredLocations: "",

  notificationsEnabled: true,
  deadlineReminders: true,
  interviewReminders: true,
  followUpReminders: true,

  reminderDays: 3,
  defaultStatus: "Applied",

  theme: "dark",

  aiJobAnalysis: true,
  aiSkillInsights: true,
};

const profileToForm = (profile) => ({
  fullName: profile?.fullName || "",
  headline: profile?.headline || "",
  university: profile?.university || "",
  degree: profile?.degree || "",
  graduationYear: profile?.graduationYear || "",
  bio: profile?.bio || "",

  skills: Array.isArray(profile?.skills)
    ? profile.skills.join(", ")
    : "",

  targetRoles: Array.isArray(profile?.targetRoles)
    ? profile.targetRoles.join(", ")
    : "",

  preferredLocations: Array.isArray(profile?.preferredLocations)
    ? profile.preferredLocations.join(", ")
    : "",

  notificationsEnabled:
    profile?.notificationsEnabled ?? true,

  deadlineReminders:
    profile?.deadlineReminders ?? true,

  interviewReminders:
    profile?.interviewReminders ?? true,

  followUpReminders:
    profile?.followUpReminders ?? true,

  reminderDays:
    profile?.reminderDays ?? 3,

  defaultStatus:
    profile?.defaultStatus || "Applied",

  theme:
    profile?.theme || "dark",

  aiJobAnalysis:
    profile?.aiJobAnalysis ?? true,

  aiSkillInsights:
    profile?.aiSkillInsights ?? true,
});

const splitList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function SettingsPage() {
  const initialTheme =
  localStorage.getItem("internflow-theme") || "dark";

const [form, setForm] = useState({
  ...DEFAULT_PROFILE,
  theme: initialTheme,
});

const [savedForm, setSavedForm] = useState({
  ...DEFAULT_PROFILE,
  theme: initialTheme,
});

  const [profileId, setProfileId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const { data, errors } =
          await client.models.UserProfile.list();

        if (errors?.length) {
          throw new Error(
            errors.map((item) => item.message).join("\n")
          );
        }

        if (cancelled) return;

        const existingProfile = data?.[0];

        if (existingProfile) {
          const nextForm =
            profileToForm(existingProfile);

          setProfileId(existingProfile.id);
          setForm(nextForm);
          setSavedForm(nextForm);
        } else {
          setForm(DEFAULT_PROFILE);
          setSavedForm(DEFAULT_PROFILE);
        }
      } catch (err) {
        console.error(
          "Failed to load user profile:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your settings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
  const theme = form.theme || "dark";

  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  localStorage.setItem("internflow-theme", theme);
}, [form.theme]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSuccess(false);
  };

  const toggleField = (field) => {
    setForm((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));

    setSuccess(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        headline: form.headline.trim(),
        university: form.university.trim(),
        degree: form.degree.trim(),
        graduationYear:
          form.graduationYear.trim(),

        bio: form.bio.trim(),

        skills: splitList(form.skills),
        targetRoles: splitList(form.targetRoles),
        preferredLocations:
          splitList(form.preferredLocations),

        notificationsEnabled:
          form.notificationsEnabled,

        deadlineReminders:
          form.deadlineReminders,

        interviewReminders:
          form.interviewReminders,

        followUpReminders:
          form.followUpReminders,

        reminderDays:
          Number(form.reminderDays) || 3,

        defaultStatus:
          form.defaultStatus,

        theme:
          form.theme,

        aiJobAnalysis:
          form.aiJobAnalysis,

        aiSkillInsights:
          form.aiSkillInsights,
      };

      let result;

      if (profileId) {
        result =
          await client.models.UserProfile.update({
            id: profileId,
            ...payload,
          });
      } else {
        result =
          await client.models.UserProfile.create(
            payload
          );
      }

      if (result.errors?.length) {
        throw new Error(
          result.errors
            .map((item) => item.message)
            .join("\n")
        );
      }

      if (!result.data) {
        throw new Error(
          "AWS did not return the saved profile."
        );
      }

      setProfileId(result.data.id);

      const normalizedForm =
        profileToForm(result.data);

      setForm(normalizedForm);
      setSavedForm(normalizedForm);

      setSuccess(true);
    } catch (err) {
      console.error(
        "Failed to save settings:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setForm(savedForm);
    setError("");
    setSuccess(false);
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="settings-loading-spinner" />
          <span>Loading your workspace settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* HEADER */}
      <div className="settings-page-header">
        <div>
          <p className="eyebrow">WORKSPACE SETTINGS</p>

          <h2>Settings</h2>

          <p className="welcome-text">
            Personalize your internship workspace,
            reminders and AI experience.
          </p>
        </div>

        <div className="settings-header-icon">
          <Settings size={22} />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="settings-alert settings-alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="settings-alert settings-alert-success">
          <CheckCircle2 size={17} />

          <span>
            Settings saved successfully to AWS.
          </span>
        </div>
      )}

      <div className="settings-grid">
        {/* PROFILE */}
        <section className="settings-card settings-card-wide">
          <div className="settings-card-header">
            <div className="settings-section-icon purple">
              <GraduationCap size={19} />
            </div>

            <div>
              <h3>Profile & identity</h3>
              <p>
                Keep your student profile ready for
                application and AI insights.
              </p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label>Full name</label>

              <input
                value={form.fullName}
                onChange={(e) =>
                  updateField(
                    "fullName",
                    e.target.value
                  )
                }
                placeholder="Your full name"
              />
            </div>

            <div className="settings-field">
              <label>Professional headline</label>

              <input
                value={form.headline}
                onChange={(e) =>
                  updateField(
                    "headline",
                    e.target.value
                  )
                }
                placeholder="e.g. CSE Student • Full Stack Developer"
              />
            </div>

            <div className="settings-field">
              <label>University</label>

              <input
                value={form.university}
                onChange={(e) =>
                  updateField(
                    "university",
                    e.target.value
                  )
                }
                placeholder="University / College"
              />
            </div>

            <div className="settings-field">
              <label>Degree</label>

              <input
                value={form.degree}
                onChange={(e) =>
                  updateField(
                    "degree",
                    e.target.value
                  )
                }
                placeholder="e.g. B.E. Computer Science"
              />
            </div>

            <div className="settings-field">
              <label>Graduation year</label>

              <input
                value={form.graduationYear}
                onChange={(e) =>
                  updateField(
                    "graduationYear",
                    e.target.value
                  )
                }
                placeholder="e.g. 2028"
              />
            </div>

            <div className="settings-field settings-field-full">
              <label>About you</label>

              <textarea
                rows="4"
                value={form.bio}
                onChange={(e) =>
                  updateField(
                    "bio",
                    e.target.value
                  )
                }
                placeholder="Tell InternFlow about your interests, career goals and background..."
              />
            </div>

            <div className="settings-field settings-field-full">
              <label>Skills</label>

              <input
                value={form.skills}
                onChange={(e) =>
                  updateField(
                    "skills",
                    e.target.value
                  )
                }
                placeholder="React, JavaScript, Python, AWS, SQL"
              />

              <small>
                Separate skills using commas.
              </small>
            </div>

            <div className="settings-field">
              <label>Target roles</label>

              <input
                value={form.targetRoles}
                onChange={(e) =>
                  updateField(
                    "targetRoles",
                    e.target.value
                  )
                }
                placeholder="Frontend Intern, SDE Intern"
              />
            </div>

            <div className="settings-field">
              <label>Preferred locations</label>

              <input
                value={form.preferredLocations}
                onChange={(e) =>
                  updateField(
                    "preferredLocations",
                    e.target.value
                  )
                }
                placeholder="Bangalore, Hyderabad, Remote"
              />
            </div>
          </div>
        </section>

        {/* APPLICATION PREFERENCES */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-icon blue">
              <Settings size={19} />
            </div>

            <div>
              <h3>Application preferences</h3>
              <p>
                Control how new applications behave.
              </p>
            </div>
          </div>

          <div className="settings-option-list">
            <div className="settings-select-row">
              <div>
                <strong>Default status</strong>
                <span>
                  Status used when adding an application.
                </span>
              </div>

              <select
                value={form.defaultStatus}
                onChange={(e) =>
                  updateField(
                    "defaultStatus",
                    e.target.value
                  )
                }
              >
                <option>Applied</option>
                <option>Assessment</option>
                <option>Interview</option>
                <option>Follow-up</option>
              </select>
            </div>

            <div className="settings-select-row">
              <div>
                <strong>Deadline reminder</strong>
                <span>
                  How early InternFlow should remind you.
                </span>
              </div>

              <select
                value={form.reminderDays}
                onChange={(e) =>
                  updateField(
                    "reminderDays",
                    Number(e.target.value)
                  )
                }
              >
                <option value={1}>1 day</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>7 days</option>
              </select>
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-icon orange">
              <Bell size={19} />
            </div>

            <div>
              <h3>Notifications</h3>
              <p>
                Decide what deserves your attention.
              </p>
            </div>
          </div>

          <div className="settings-option-list">
            <SettingsToggle
              title="Notifications"
              description="Enable InternFlow reminders."
              enabled={form.notificationsEnabled}
              onToggle={() =>
                toggleField("notificationsEnabled")
              }
            />

            <SettingsToggle
              title="Deadline reminders"
              description="Get reminded before application deadlines."
              enabled={
                form.deadlineReminders
              }
              disabled={
                !form.notificationsEnabled
              }
              onToggle={() =>
                toggleField("deadlineReminders")
              }
            />

            <SettingsToggle
              title="Interview reminders"
              description="Keep upcoming interviews visible."
              enabled={
                form.interviewReminders
              }
              disabled={
                !form.notificationsEnabled
              }
              onToggle={() =>
                toggleField("interviewReminders")
              }
            />

            <SettingsToggle
              title="Follow-up reminders"
              description="Remember recruiter follow-ups."
              enabled={
                form.followUpReminders
              }
              disabled={
                !form.notificationsEnabled
              }
              onToggle={() =>
                toggleField("followUpReminders")
              }
            />
          </div>
        </section>

        {/* AI */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-icon purple">
              <Sparkles size={19} />
            </div>

            <div>
              <h3>AI preferences</h3>
              <p>
                Control the intelligent features of InternFlow.
              </p>
            </div>
          </div>

          <div className="settings-option-list">
            <SettingsToggle
              title="AI job analysis"
              description="Allow AI to extract structured job details."
              enabled={form.aiJobAnalysis}
              onToggle={() =>
                toggleField("aiJobAnalysis")
              }
            />

            <SettingsToggle
              title="AI skill insights"
              description="Use your profile skills for future skill-gap analysis."
              enabled={form.aiSkillInsights}
              onToggle={() =>
                toggleField("aiSkillInsights")
              }
            />
          </div>

          <div className="settings-ai-note">
            <Sparkles size={15} />

            <span>
              InternFlow uses Amazon Bedrock-powered AI
              features for job analysis.
            </span>
          </div>
        </section>

        {/* APPEARANCE */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-icon slate">
              <Settings size={19} />
            </div>

            <div>
              <h3>Appearance</h3>
              <p>
                Choose your workspace appearance.
              </p>
            </div>
          </div>

          <div className="settings-theme-grid">
            <button
              type="button"
              className={`settings-theme-option ${
                form.theme === "dark"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                updateField("theme", "dark")
              }
            >
              <div className="theme-preview dark">
                <span />
                <span />
                <span />
              </div>

              <strong>Dark</strong>
              <small>Current interface</small>
            </button>

           <button
  type="button"
  className={`settings-theme-option ${
    form.theme === "light" ? "active" : ""
  }`}
  onClick={() =>
    setForm((previous) => ({
      ...previous,
      theme: "light",
    }))
  }
>
              <div className="theme-preview light">
                <span />
                <span />
                <span />
              </div>

              <strong>Light</strong>
              <small>Light interface</small>
            </button>
          </div>
        </section>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="settings-save-bar">
        <div>
          <strong>Workspace settings</strong>

          <span>
            Your preferences are stored in your
            private AWS profile.
          </span>
        </div>

        <div className="settings-save-actions">
          <button
            type="button"
            className="settings-reset-button"
            onClick={resetChanges}
            disabled={saving}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="button"
            className="settings-save-button"
            onClick={saveSettings}
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsToggle({
  title,
  description,
  enabled,
  disabled = false,
  onToggle,
}) {
  return (
    <div
      className={`settings-toggle-row ${
        disabled ? "disabled" : ""
      }`}
    >
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        className={`settings-switch ${
          enabled ? "active" : ""
        }`}
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={enabled}
      >
        <span />
      </button>
    </div>
  );
}