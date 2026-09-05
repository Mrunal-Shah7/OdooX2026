import { Link, useNavigate } from "@tanstack/react-router";
import { NavMenu } from "./NavMenu";
import { AttendanceWidget } from "./AttendanceWidget";
import { NotificationBell } from "./NotificationBell";
import { apiClient } from "../../lib/apiClient";
import { useSession } from "../../lib/session";
import { Dropdown } from "../ui/Dropdown";

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
    <header className="sticky top-0 z-nav flex h-[var(--nav-height)] items-center gap-5 bg-primary px-5 text-on-primary">
      <Link
        to="/"
        className="text-h3 font-semibold tracking-tight text-on-primary no-underline hover:opacity-95"
      >
        PeoplePay360
      </Link>
      <NavMenu />
      <div className="ml-auto flex items-center gap-4 text-label">
        <AttendanceWidget />
        <NotificationBell />
        {user ? (
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 rounded px-2 py-1 text-label font-medium text-on-primary opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring">
                <span className="size-2 rounded-full bg-success" />
                <span>
                  {user.employee
                    ? `${user.employee.firstName} ${user.employee.lastName}`
                    : user.email}
                </span>
              </button>
            }
            items={[{ label: "Sign out", onSelect: () => void signOut() }]}
          />
        ) : null}
      </div>
    </header>
  );
}
