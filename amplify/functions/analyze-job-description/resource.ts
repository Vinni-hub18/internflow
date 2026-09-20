import { defineFunction, secret } from "@aws-amplify/backend";

export const analyzeJobDescription = defineFunction({
  name: "analyze-job-description",
  entry: "./handler.ts",
  timeoutSeconds: 60,

  environment: {
    BEDROCK_MANTLE_API_KEY: secret("BEDROCK_MANTLE_API_KEY"),
  },
});