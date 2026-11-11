import type { Response } from "express";
import { sendRateLimitError } from "../response";

describe("sendRateLimitError", () => {
  it("uses the standard error body and Retry-After header", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    sendRateLimitError(res as unknown as Response, 30);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.set).toHaveBeenCalledWith("Retry-After", "30");
    expect(res.json).toHaveBeenCalledWith({
      error: "Too many requests. Please retry after the indicated delay.",
      code: "RATE_LIMIT_EXCEEDED",
    });
  });
});