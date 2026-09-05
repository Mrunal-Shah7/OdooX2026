import { NavTabs } from './NavTabs';

/** Navigation shown on the signed-in user's profile only. */
export function ProfileNavTabs() {
  return <NavTabs tabs={[{ label: 'My profile', to: '/profile', isExact: true }]} />;
}
