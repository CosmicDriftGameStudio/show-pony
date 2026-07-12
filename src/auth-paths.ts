/** Frontend routes for auth screens (mounted via admin SPA on apex). */
export const AUTH_PATHS = {
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  signupComplete: "/signup/complete",
  inviteAccept: "/invite/accept",
} as const;

export const LOGIN_PATH = "/login";

export function shouldRedirectAuthedLogin(authed: boolean, pathname: string): boolean {
  return authed && pathname === LOGIN_PATH;
}
