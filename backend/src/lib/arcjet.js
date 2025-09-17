import {ENV} from "../lib/env.js";
import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

const aj = arcjet({
  key: ENV.ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),
    slidingWindow({
        mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
        max: 100, // max 60 requests
        interval: 60, // per 60 seconds
    })
  ],
});

export default aj;