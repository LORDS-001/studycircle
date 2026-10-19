"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/app/app-shell";
import { signOutAndLeave } from "@/components/app/sign-out";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, Switch } from "@/components/ui/controls";
import { Field, Input, Label } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlays";
import { Panel } from "@/components/ui/surface";
import { useMe } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";

type PrefKey = keyof User["emailPrefs"];

const PREFS: { key: PrefKey; title: string; description: string; essential?: boolean }[] = [
  {
    key: "reminders",
    title: "Session reminders",
    description:
      "24 hours and 1 hour before each session you're going to. You can turn these off, but they're how most people stay on track.",
    essential: true,
  },
  {
    key: "groupActivity",
    title: "Group activity",
    description: "When someone joins your group, and when a session is added or changed.",
  },
  {
    key: "retros",
    title: "Retro prompts",
    description: "A two-minute check-in after each session, so the group keeps getting better.",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const leave = (action: "logout" | "delete") => signOutAndLeave(router, { reset: action === "delete" });

  return (
    <Page className="max-w-[960px]">
      <PageHeader title="Settings" description="Your profile, emails and how StudyCircle looks." />

      <div className="stagger">
        <Section
          id="profile"
          title="Profile"
          description="What your groups see next to your questions, notes and RSVPs."
        >
          <ProfileForm />
        </Section>

        <Section id="email" title="Email" description="Choose what lands in your inbox.">
          <EmailPrefs />
        </Section>

        <Section id="appearance" title="Appearance" description="Auto follows your device's light or dark setting.">
          <Appearance />
        </Section>

        <Section id="account" title="Account">
          <Panel className="divide-y divide-border">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold">Log out</h3>
                <p className="text-sm text-muted-foreground">You&rsquo;ll need a new sign-in link to get back in.</p>
              </div>
              <Button variant="outline" onClick={() => leave("logout")} className="self-start sm:self-auto">
                <LogOut />
                Log out
              </Button>
            </div>
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-destructive">Delete account</h3>
                <p className="text-sm text-muted-foreground">
                  Removes your profile and takes you out of every group. This can&rsquo;t be undone.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="self-start sm:self-auto">
                Delete account
              </Button>
            </div>
          </Panel>
        </Section>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete your account?"
        description="Your profile, memberships and RSVPs will be removed, and your groups will carry on without you. In this demo, it resets the demo data and signs you out."
        confirmLabel="Delete account"
        destructive
        onConfirm={() => leave("delete")}
      />
    </Page>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`settings-${id}`}
      className="grid gap-4 border-t border-border py-8 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:gap-10"
    >
      <div>
        <h2 id={`settings-${id}`} className="text-h3">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ProfileForm() {
  const me = useMe();
  const updateProfile = useStore((s) => s.updateProfile);
  const [name, setName] = React.useState(me.name);
  const [school, setSchool] = React.useState(me.school);
  const [errors, setErrors] = React.useState<{ name?: string; school?: string }>({});
  const dirty = name.trim() !== me.name || school.trim() !== me.school;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Add your name so your group knows who you are.";
    if (!school.trim()) next.school = "Add your school so we can show you its courses.";
    setErrors(next);
    if (Object.keys(next).length) return;
    updateProfile({ name: name.trim(), school: school.trim() });
    setName(name.trim());
    setSchool(school.trim());
    toast.success("Profile saved");
  };

  return (
    <Panel className="p-5 sm:p-6">
      <form noValidate onSubmit={save}>
        <div className="mb-6 flex items-center gap-4">
          <Avatar user={{ ...me, name: name.trim() || me.name }} size="xl" />
          <div className="min-w-0">
            <div className="truncate text-h3">{name.trim() || me.name}</div>
            <p className="text-sm text-muted-foreground">Your avatar is made from your initials.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="set-name" error={errors.name}>
            <Input
              id="set-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field label="School" htmlFor="set-school" error={errors.school}>
            <Input
              id="set-school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              autoComplete="organization"
              aria-invalid={!!errors.school}
            />
          </Field>
          <Field label="Email" htmlFor="set-email" hint="You sign in with this address." className="sm:col-span-2">
            <Input
              id="set-email"
              value={me.email}
              readOnly
              aria-readonly
              className="bg-surface-2 text-muted-foreground"
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setName(me.name);
                setSchool(me.school);
                setErrors({});
              }}
            >
              Discard changes
            </Button>
          )}
          <Button type="submit" disabled={!dirty}>
            Save profile
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function EmailPrefs() {
  const me = useMe();
  const updateProfile = useStore((s) => s.updateProfile);
  const toggle = (key: PrefKey, value: boolean) => updateProfile({ emailPrefs: { ...me.emailPrefs, [key]: value } });

  return (
    <Panel className="divide-y divide-border">
      {PREFS.map((p) => {
        const id = `pref-${p.key}`;
        const on = me.emailPrefs[p.key];
        return (
          <div key={p.key} className="flex items-start gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor={id} className="text-[0.9375rem] font-bold">
                  {p.title}
                </Label>
                {p.essential && <Badge variant="teal">Essential</Badge>}
              </div>
              <p id={`${id}-desc`} className="mt-0.5 text-sm leading-5 text-muted-foreground">
                {p.description}
              </p>
              {p.essential && !on && (
                <p className="mt-2 text-sm font-medium text-foreground">
                  Reminders are off. Sessions will still show on your dashboard.
                </p>
              )}
            </div>
            <Switch
              id={id}
              checked={on}
              onCheckedChange={(v) => toggle(p.key, v)}
              aria-describedby={`${id}-desc`}
              className="relative mt-0.5 after:absolute after:-inset-2"
            />
          </div>
        );
      })}
    </Panel>
  );
}

function Appearance() {
  const { theme, setTheme } = useTheme();
  const value = (theme === "light" || theme === "dark" ? theme : "system") as "light" | "dark" | "system";
  return (
    <Segmented
      aria-label="Theme"
      value={value}
      onValueChange={setTheme}
      className="w-full sm:w-auto"
      options={[
        { value: "light", label: "Light", icon: <Sun /> },
        { value: "dark", label: "Dark", icon: <Moon /> },
        { value: "system", label: "Auto", icon: <Monitor /> },
      ]}
    />
  );
}
