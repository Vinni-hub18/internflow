import { defineFunction, secret } from "@aws-amplify/backend";

export const sendReminders = defineFunction({
  name: "send-reminders",
  schedule: "every day",
  timeoutSeconds: 30,

  environment: {
    SES_FROM_EMAIL: secret("SES_FROM_EMAIL"),
    REMINDER_EMAIL: secret("REMINDER_EMAIL"),
  },
});