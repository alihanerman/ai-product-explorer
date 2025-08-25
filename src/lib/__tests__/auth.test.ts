import { signToken, verifyToken, getAuthUser } from "../auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

describe("auth utilities", () => {
  const testPayload = {
    userId: "user123",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signToken", () => {
    it("should create a valid JWT token", () => {
      const token = signToken(testPayload);
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should create different tokens for different payloads", () => {
      const token1 = signToken(testPayload);
      const token2 = signToken({ ...testPayload, userId: "user456" });
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = signToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded).toMatchObject(testPayload);
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
    });

    it("should return null for invalid token", () => {
      const result = verifyToken("invalid-token");
      expect(result).toBeNull();
    });

    it("should return null for expired token", () => {
      // Create a token with very short expiry
      const expiredToken = jwt.sign(testPayload, process.env.JWT_SECRET!, {
        expiresIn: "-1s",
      });

      const result = verifyToken(expiredToken);
      expect(result).toBeNull();
    });

    it("should return null for malformed token", () => {
      expect(verifyToken("")).toBeNull();
      expect(verifyToken("not.a.token")).toBeNull();
      expect(verifyToken("header.payload")).toBeNull();
    });
  });

  describe("getAuthUser", () => {
    it("should return user data when valid token exists in cookies", async () => {
      const token = signToken(testPayload);
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: token }),
      };
      mockCookies.mockResolvedValue(
        mockCookieStore as unknown as ReturnType<typeof cookies>
      );

      const result = await getAuthUser();

      expect(result).toMatchObject(testPayload);
      expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    });

    it("should return null when no token in cookies", async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      };
      mockCookies.mockResolvedValue(
        mockCookieStore as unknown as ReturnType<typeof cookies>
      );

      const result = await getAuthUser();

      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    });

    it("should return null when invalid token in cookies", async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: "invalid-token" }),
      };
      mockCookies.mockResolvedValue(
        mockCookieStore as unknown as ReturnType<typeof cookies>
      );

      const result = await getAuthUser();

      expect(result).toBeNull();
    });
  });
});
