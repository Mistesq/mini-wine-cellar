import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Test } from "@nestjs/testing";
import { UsersService } from "../users/users.service";
import { type GqlContext, UserIdGuard } from "./user-id.guard";

const ANNA = { id: "00000000-0000-4000-8000-000000000001", name: "Anna" };

describe("UserIdGuard", () => {
  let guard: UserIdGuard;
  const users = { findById: jest.fn() };

  function contextWith(headers: Record<string, string>): GqlContext {
    const ctx = { req: { headers } } as unknown as GqlContext;
    jest.spyOn(GqlExecutionContext, "create").mockReturnValue({
      getContext: () => ctx,
    } as unknown as GqlExecutionContext);
    return ctx;
  }

  const executionContext = {} as ExecutionContext;

  beforeEach(async () => {
    jest.restoreAllMocks();
    users.findById.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [UserIdGuard, { provide: UsersService, useValue: users }],
    }).compile();
    guard = moduleRef.get(UserIdGuard);
  });

  it("rejects a request without the header", async () => {
    contextWith({});

    await expect(guard.canActivate(executionContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(users.findById).not.toHaveBeenCalled();
  });

  it("rejects a non-uuid header without querying the database", async () => {
    contextWith({ "x-user-id": "abc" });

    await expect(guard.canActivate(executionContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(users.findById).not.toHaveBeenCalled();
  });

  it("rejects an unknown user", async () => {
    contextWith({ "x-user-id": ANNA.id });
    users.findById.mockResolvedValue(null);

    await expect(guard.canActivate(executionContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(users.findById).toHaveBeenCalledWith(ANNA.id);
  });

  it("puts a known user into the GraphQL context", async () => {
    const ctx = contextWith({ "x-user-id": ANNA.id });
    users.findById.mockResolvedValue(ANNA);

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);
    expect(ctx.user).toBe(ANNA);
  });
});
