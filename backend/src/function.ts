import { onRequest } from "firebase-functions/v2/https";
import { app } from "./index.ts";

export const api = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  app,
);
