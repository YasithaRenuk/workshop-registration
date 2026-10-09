import type { Role } from "./generated/prisma/enums";

export const PERMISSIONS = {
  "user:manage":        ["ADMIN"],
  "workshop:write":     ["MANAGER"],
  "workshop:read":      ["MANAGER", "STAFF"],
  "registration:write": ["MANAGER", "STAFF"],
  "registration:read":  ["MANAGER", "STAFF"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: string | null | undefined, permission: Permission) {
  return (PERMISSIONS[permission] as readonly string[]).includes(role ?? "");
}