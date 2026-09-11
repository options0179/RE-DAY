export interface AuthenticatedUser {
  userId: string;
  tokenIssuedAt: number;
}

export interface SessionOwnership {
  sessionId: string;
  ownerId: string;
}

export function authorizeSession(
  user: AuthenticatedUser,
  session: SessionOwnership,
): void {
  if (user.userId !== session.ownerId) {
    throw new Error("FORBIDDEN: session does not belong to the user");
  }
}
