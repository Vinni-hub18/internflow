import {
  type ClientSchema,
  a,
  defineData,
} from "@aws-amplify/backend";

import { analyzeJobDescription } from "../functions/analyze-job-description/resource";
import { sendReminders } from "../functions/send-reminders/resource";

const schema = a.schema({
  // ==========================================
  // INTERNSHIP APPLICATION DATABASE
  // ==========================================
  InternshipApplication: a
    .model({
      company: a.string().required(),
      role: a.string().required(),

      location: a.string(),

      status: a.string().required(),

      applicationDate: a.date(),
      deadline: a.date(),
      assessmentDate: a.date(),
      interviewDate: a.date(),
      followUpDate: a.date(),

      skills: a.string().array(),
      documents: a.string().array(),

      jobDescription: a.string(),
      notes: a.string(),
      source: a.string(),
      companyLogo: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

    UserProfile: a
  .model({
    fullName: a.string(),
    headline: a.string(),
    university: a.string(),
    degree: a.string(),
    graduationYear: a.string(),

    bio: a.string(),

    skills: a.string().array(),
    targetRoles: a.string().array(),
    preferredLocations: a.string().array(),

    notificationsEnabled: a.boolean(),
    deadlineReminders: a.boolean(),
    interviewReminders: a.boolean(),
    followUpReminders: a.boolean(),

    reminderDays: a.integer(),
    defaultStatus: a.string(),

    theme: a.string(),

    aiJobAnalysis: a.boolean(),
    aiSkillInsights: a.boolean(),
  })
  .authorization((allow) => [allow.owner()]),


  // ==========================================
  // AI JOB ANALYZER
  // ==========================================
  analyzeJobDescription: a
    .mutation()
    .arguments({
      jobDescription: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(analyzeJobDescription)),
}).authorization((allow) => [
  allow.resource(sendReminders).to(["query"]),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});