"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, ClientApiError, errorMessage, type FieldErrors } from "@/lib/client-api";

type U = {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
};

const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-sm text-red-600">{msg}</p> : null;
}

export function UsersManager({
  users,
  currentUserId,
}: {
  users: U[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [pwUser, setPwUser] = useState<U | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function patch(u: U, body: Record<string, unknown>, okMsg: string) {
    setPendingId(u.id);
    try {
      await apiFetch(`/api/users/${u.id}`, { method: "PATCH", body });
      toast.success(okMsg);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Staff accounts. There is no public signup; accounts are created here.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New user</Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const pending = pendingId === u.id;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.name} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <select
                      className={selectClass}
                      value={u.role}
                      disabled={isSelf || pending}
                      onChange={(e) =>
                        patch(u, { role: e.target.value }, `${u.name} is now ${ROLE_LABEL[e.target.value]}`)
                      }
                    >
                      {Object.entries(ROLE_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    {u.disabled ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="outline" size="sm" disabled={pending} onClick={() => setPwUser(u)}>
                      Reset password
                    </Button>
                    {!isSelf && (
                      <Button
                        variant={u.disabled ? "outline" : "destructive"}
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          patch(
                            u,
                            { disabled: !u.disabled },
                            u.disabled ? `${u.name} re-enabled` : `${u.name} disabled`
                          )
                        }
                      >
                        {u.disabled ? "Enable" : "Disable"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>
              Choose a temporary password and share it with them in person.
            </DialogDescription>
          </DialogHeader>
          <CreateUserForm onDone={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              {pwUser?.name} will be signed out everywhere and must use the new password.
            </DialogDescription>
          </DialogHeader>
          {pwUser && <PasswordForm user={pwUser} onDone={() => setPwUser(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErrors({});
    try {
      await apiFetch("/api/users", {
        method: "POST",
        body: {
          name: String(fd.get("name")),
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          role: String(fd.get("role")),
        },
      });
      toast.success("User created");
      onDone();
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="u-name">Name</Label>
        <Input id="u-name" name="name" required />
        <Err msg={errors.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="u-email">Email</Label>
        <Input id="u-email" name="email" type="email" required />
        <Err msg={errors.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="u-password">Temporary password</Label>
        <Input id="u-password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        <Err msg={errors.password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="u-role">Role</Label>
        <select id="u-role" name="role" defaultValue="STAFF" className={selectClass + " w-full"}>
          <option value="STAFF">Staff (front desk)</option>
          <option value="MANAGER">Manager (programme)</option>
          <option value="ADMIN">Admin</option>
        </select>
        <Err msg={errors.role} />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Creating..." : "Create user"}
      </Button>
    </form>
  );
}

function PasswordForm({ user, onDone }: { user: U; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErrors({});
    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        body: { password: String(fd.get("password")) },
      });
      toast.success("Password reset");
      onDone();
    } catch (err) {
      if (err instanceof ClientApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input id="new-password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        <Err msg={errors.password} />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Saving..." : "Reset password"}
      </Button>
    </form>
  );
}