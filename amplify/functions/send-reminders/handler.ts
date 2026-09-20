import type { EventBridgeHandler } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/send-reminders";

import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const ses = new SESClient({
  region: "ap-south-1",
});

const formatDate = (dateValue: string | null | undefined) => {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isToday = (dateValue: string | null | undefined) => {
  if (!dateValue) return false;

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return dateValue === todayString;
};

export const handler: EventBridgeHandler<
  "Scheduled Event",
  null,
  void
> = async () => {
  console.log("InternFlow reminder job started");

  const [
    { data: applications, errors: applicationErrors },
    { data: profiles, errors: profileErrors },
  ] = await Promise.all([
    client.models.InternshipApplication.list(),
    client.models.UserProfile.list(),
  ]);

  if (applicationErrors?.length) {
    console.error("Application errors:", applicationErrors);
    throw new Error("Could not load applications");
  }

  if (profileErrors?.length) {
    console.error("Profile errors:", profileErrors);
    throw new Error("Could not load user profile");
  }

  const profile = profiles?.[0];

  if (!profile) {
    console.log("No user profile found.");
    return;
  }

  if (profile.notificationsEnabled === false) {
    console.log("Notifications disabled in InternFlow settings.");
    return;
  }

  const reminders: string[] = [];

  for (const application of applications ?? []) {
    if (
      application.status === "Offer" ||
      application.status === "Rejected"
    ) {
      continue;
    }

    if (
      profile.deadlineReminders !== false &&
      isToday(application.deadline)
    ) {
      reminders.push(
        `⚠️ ${application.company}\n` +
          `${application.role}\n` +
          `Deadline: ${formatDate(application.deadline)}`
      );
    }

    if (
      profile.followUpReminders !== false &&
      isToday(application.followUpDate)
    ) {
      reminders.push(
        `🔁 ${application.company}\n` +
          `${application.role}\n` +
          `Follow-up: ${formatDate(application.followUpDate)}`
      );
    }

    if (
      profile.interviewReminders !== false &&
      isToday(application.interviewDate)
    ) {
      reminders.push(
        `🎯 ${application.company}\n` +
          `${application.role}\n` +
          `Interview: ${formatDate(application.interviewDate)}`
      );
    }

    if (isToday(application.assessmentDate)) {
      reminders.push(
        `📝 ${application.company}\n` +
          `${application.role}\n` +
          `Assessment: ${formatDate(application.assessmentDate)}`
      );
    }
  }

  if (reminders.length === 0) {
    console.log("No reminders due today.");
    return;
  }

  const body = [
    `Good morning ${profile.fullName || "there"}!`,
    "",
    `You have ${reminders.length} application ${
      reminders.length === 1 ? "action" : "actions"
    } today.`,
    "",
    ...reminders.flatMap((item) => [item, ""]),
    "Open InternFlow to review your applications.",
    "",
    "— InternFlow",
  ].join("\n");

  const htmlReminders = reminders
    .map((item) =>
      item
        .split("\n")
        .map((line) => `<div>${line}</div>`)
        .join("")
    )
    .map(
      (item) =>
        `<div style="margin-bottom:18px;padding:14px;border:1px solid #ddd;border-radius:10px;">${item}</div>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2>InternFlow Reminder</h2>

      <p>
        Good morning ${profile.fullName || "there"}!
      </p>

      <p>
        You have <strong>${reminders.length}</strong>
        application ${
          reminders.length === 1 ? "action" : "actions"
        } today.
      </p>

      ${htmlReminders}

      <p>
        Open InternFlow to review your applications.
      </p>

      <p>— InternFlow</p>
    </div>
  `;

  const command = new SendEmailCommand({
    Source: env.SES_FROM_EMAIL,

    Destination: {
      ToAddresses: [env.REMINDER_EMAIL],
    },

    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: "InternFlow Reminder — Action Needed Today",
      },

      Body: {
        Text: {
          Charset: "UTF-8",
          Data: body,
        },

        Html: {
          Charset: "UTF-8",
          Data: html,
        },
      },
    },
  });

  await ses.send(command);

  console.log(
    `Reminder email sent to ${env.REMINDER_EMAIL}`
  );
};