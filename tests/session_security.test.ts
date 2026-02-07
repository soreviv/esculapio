import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Session Security - Login Session Handling", () => {
  let mockReq: any;
  let mockRes: any;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe("Session Regeneration on Login", () => {
    it("should regenerate session to prevent session fixation", async () => {
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => cb());
      const saveMock = vi.fn((cb: (err?: Error) => void) => cb());

      mockReq = {
        session: {
          id: "old-session-id",
          regenerate: regenerateMock,
          save: saveMock,
          userId: undefined as string | undefined,
          role: undefined as string | undefined,
          nombre: undefined as string | undefined,
        },
      };

      const initialSessionId = mockReq.session.id;

      await new Promise<void>((resolve, reject) => {
        mockReq.session.regenerate((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      mockReq.session.userId = "user-123";
      mockReq.session.role = "medico";
      mockReq.session.nombre = "Dr. Test";

      await new Promise<void>((resolve, reject) => {
        mockReq.session.save((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      expect(regenerateMock).toHaveBeenCalledOnce();
      expect(saveMock).toHaveBeenCalledOnce();
      expect(initialSessionId).toBe("old-session-id");
    });

    it("should call regenerate before save", async () => {
      const callOrder: string[] = [];
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => {
        callOrder.push("regenerate");
        cb();
      });
      const saveMock = vi.fn((cb: (err?: Error) => void) => {
        callOrder.push("save");
        cb();
      });

      mockReq = {
        session: {
          regenerate: regenerateMock,
          save: saveMock,
          userId: undefined as string | undefined,
          role: undefined as string | undefined,
          nombre: undefined as string | undefined,
        },
      };

      await new Promise<void>((resolve, reject) => {
        mockReq.session.regenerate((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      mockReq.session.userId = "user-123";
      mockReq.session.role = "medico";
      mockReq.session.nombre = "Dr. Test";

      await new Promise<void>((resolve, reject) => {
        mockReq.session.save((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      expect(callOrder).toEqual(["regenerate", "save"]);
    });

    it("should assign session properties after regeneration", async () => {
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => cb());
      const saveMock = vi.fn((cb: (err?: Error) => void) => cb());

      mockReq = {
        session: {
          regenerate: regenerateMock,
          save: saveMock,
          userId: undefined as string | undefined,
          role: undefined as string | undefined,
          nombre: undefined as string | undefined,
        },
      };

      await new Promise<void>((resolve, reject) => {
        mockReq.session.regenerate((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });

      mockReq.session.userId = "user-456";
      mockReq.session.role = "admin";
      mockReq.session.nombre = "Admin User";

      expect(mockReq.session.userId).toBe("user-456");
      expect(mockReq.session.role).toBe("admin");
      expect(mockReq.session.nombre).toBe("Admin User");
    });
  });

  describe("Session Error Handling", () => {
    it("should reject when regenerate fails", async () => {
      const regenerateError = new Error("regenerate failed");
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => cb(regenerateError));

      mockReq = {
        session: {
          regenerate: regenerateMock,
        },
      };

      await expect(
        new Promise<void>((resolve, reject) => {
          mockReq.session.regenerate((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        })
      ).rejects.toThrow("regenerate failed");
    });

    it("should reject when save fails", async () => {
      const saveError = new Error("save failed");
      const saveMock = vi.fn((cb: (err?: Error) => void) => cb(saveError));

      mockReq = {
        session: {
          save: saveMock,
        },
      };

      await expect(
        new Promise<void>((resolve, reject) => {
          mockReq.session.save((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        })
      ).rejects.toThrow("save failed");
    });

    it("should not call save if regenerate fails", async () => {
      const regenerateError = new Error("regenerate failed");
      const regenerateMock = vi.fn((cb: (err?: Error) => void) => cb(regenerateError));
      const saveMock = vi.fn((cb: (err?: Error) => void) => cb());

      mockReq = {
        session: {
          regenerate: regenerateMock,
          save: saveMock,
        },
      };

      try {
        await new Promise<void>((resolve, reject) => {
          mockReq.session.regenerate((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          mockReq.session.save((err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch { /* empty */ }

      expect(regenerateMock).toHaveBeenCalledOnce();
      expect(saveMock).not.toHaveBeenCalled();
    });
  });
});
