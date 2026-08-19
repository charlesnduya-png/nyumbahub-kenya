"use client";

import {
  TEAM_ROLE_LABEL,
  TEAM_ROLE_VALUES,
  normalizeTeamRoles,
  type TeamRoleValue,
} from "@/lib/account-team";
import { Checkbox } from "@/components/ui/checkbox";

export function TeamRolePicker({
  value,
  onChange,
  disabled,
}: {
  value: TeamRoleValue[];
  onChange: (roles: TeamRoleValue[]) => void;
  disabled?: boolean;
}) {
  const selected = new Set(value);

  function toggle(role: TeamRoleValue, checked: boolean) {
    let next: TeamRoleValue[];
    if (role === "FULL") {
      next = checked ? ["FULL"] : ["INQUIRIES"];
    } else if (checked) {
      next = normalizeTeamRoles([...value.filter((item) => item !== "FULL"), role]);
    } else {
      next = value.filter((item) => item !== role);
      if (next.length === 0) next = ["INQUIRIES"];
    }
    onChange(next);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {TEAM_ROLE_VALUES.map((role) => (
        <label
          key={role}
          className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <Checkbox
            checked={selected.has(role)}
            disabled={disabled}
            onCheckedChange={(state) => toggle(role, state === true)}
          />
          <span className="cursor-pointer font-normal">{TEAM_ROLE_LABEL[role]}</span>
        </label>
      ))}
    </div>
  );
}
