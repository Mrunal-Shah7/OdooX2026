import { Link, useNavigate } from "@tanstack/react-router";
import { CircleUserRound } from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { Dropdown } from "../ui/Dropdown";
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
          <Dropdown
            trigger={
              <button
                type="button"
                className="top-nav__profile-link"
                aria-label="Account menu"
                title="Account menu"
                data-walkthrough-id="nav-profile"
              >
                <CircleUserRound className="size-5" aria-hidden="true" />
              </button>
            }
            items={[
              {
                label: "My profile",
                onSelect: () => {
                  void navigate({ to: "/profile" });
                },
              },
              {
                label: "Sign out",
                onSelect: () => {
                  void signOut();
                },
              },
            ]}
          />
        ) : null}
      </div>
    </header>
  );
}
