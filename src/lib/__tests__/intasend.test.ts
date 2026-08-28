import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  isIntaSendConfigured,
  validateIntaSendWebhookChallenge,
} from "@/lib/intasend";

describe("intasend", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("is configured when both keys are set", () => {
    process.env.INTASEND_PUBLIC_KEY = "ISPubKey_live_test";
    process.env.INTASEND_SECRET_KEY = "ISSecretKey_live_test";
    expect(isIntaSendConfigured()).toBe(true);
  });

  it("validates webhook challenge when configured", () => {
    process.env.INTASEND_WEBHOOK_CHALLENGE = "yourhome-prod";
    expect(validateIntaSendWebhookChallenge("yourhome-prod")).toBe(true);
    expect(validateIntaSendWebhookChallenge("wrong")).toBe(false);
  });

  it("allows webhooks when challenge env is unset", () => {
    delete process.env.INTASEND_WEBHOOK_CHALLENGE;
    expect(validateIntaSendWebhookChallenge(undefined)).toBe(true);
  });
});
