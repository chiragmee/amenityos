export const sidebarNav = [
  { href: "/", label: "Home" },
  { href: "/assistant", label: "AI Assistant" },
  { href: "/amenities", label: "Amenities" },
  { href: "/bookings", label: "My Bookings" },
  { rule: true as const },
  { href: "/credits", label: "Credits" },
  { rule: true as const },
  { href: "/admin", label: "Admin" },
];

export const mobileTabs = [
  { href: "/", label: "Home" },
  { href: "/amenities", label: "Amenities" },
  { href: "/bookings", label: "Bookings" },
  { href: "/profile", label: "Profile" },
];

const crumbs: Record<string, string> = {
  "/": "Home",
  "/assistant": "AI Assistant",
  "/amenities": "Amenities",
  "/bookings": "My Bookings",
  "/credits": "Credits",
  "/admin": "Admin",
  "/pass": "My Bookings / Access pass",
  "/profile": "Profile",
};

export function crumbFor(pathname: string): string {
  return crumbs[pathname] ?? "Home";
}

/** Which sidebar/tab item should read as "active" for a given pathname. */
export function activeRootFor(pathname: string): string {
  if (pathname === "/pass") return "/bookings";
  return pathname;
}
