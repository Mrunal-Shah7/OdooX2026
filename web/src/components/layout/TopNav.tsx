import { Link, useNavigate } from "@tanstack/react-router";
import { CircleUserRound } from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { NavMenu } from "./NavMenu";
import { NotificationBell } from "./NotificationBell";
import { apiClient } from "../../lib/apiClient";
import { useSession } from "../../lib/session";

export function TopNav() {
  const navigate = useNavigate();
  const { user, clearSession } = useSession();

  async function signOut() {
    try {
      await apiClient.logout();
    } catch {
      /* ignore — clear local session anyway */
    }
    clearSession();
    await navigate({ to: "/login" });
  }

  return (
    <header className="top-nav">
      <Link
        to="/"
        className="top-nav__brand"
        aria-label="PeoplePay360 home"
      >
        <BrandLogo variant="compact" />
      </Link>
      <NavMenu />
      <div className="top-nav__actions">
        <NotificationBell />
        {user ? (
          <div className="top-nav__account-actions">
            <Link
              to="/profile"
              className="top-nav__profile-link"
              aria-label="Open my profile"
              title="My profile"
              data-walkthrough-id="nav-profile"
            >
              <CircleUserRound className="size-5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="top-nav__sign-out"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
