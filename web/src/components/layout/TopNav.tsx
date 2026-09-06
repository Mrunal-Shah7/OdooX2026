import { Link, useNavigate } from "@tanstack/react-router";
import { CircleUserRound, Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "../BrandLogo";
import { Dropdown } from "../ui/Dropdown";
import { NavMenu } from "./NavMenu";
import { NotificationBell } from "./NotificationBell";
import { apiClient } from "../../lib/apiClient";
import { useSession } from "../../lib/session";

export function TopNav() {
  const navigate = useNavigate();
  const { user, clearSession } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

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
      <NavMenu open={menuOpen} onNavigate={() => setMenuOpen(false)} />
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
        <button
          type="button"
          className="top-nav__menu-toggle"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
