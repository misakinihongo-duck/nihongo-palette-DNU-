import type { Role } from "@/lib/types";

export function getRole(value: string | string[] | undefined): Role {
  return value === "student" ? "student" : "teacher";
}

export function roleLabel(role: Role): string {
  return role === "teacher" ? "講師View" : "生徒View";
}
