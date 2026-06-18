import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Settings = {
  phone: string | null; address: string | null;
  notify_email: boolean; notify_sms: boolean; notify_push: boolean; notify_marketing: boolean;
  two_factor_enabled: boolean; login_alerts: boolean;
  language: string; currency: string; theme: string;
};

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Central Bank of India" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("user_settings" as never).select("*").eq("user_id", user!.id).maybeSingle();
      return data as Settings | null;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<Settings>({
    phone: "", address: "", notify_email: true, notify_sms: true, notify_push: false, notify_marketing: false,
    two_factor_enabled: false, login_alerts: true, language: "en", currency: "INR", theme: "light",
  });
  const [fullName, setFullName] = useState("");

  useEffect(() => { if (settings) setForm({ ...form, ...settings }); /* eslint-disable-next-line */ }, [settings]);
  useEffect(() => { if (profile?.full_name) setFullName(profile.full_name); }, [profile]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error: e1 } = await supabase.from("user_settings" as never).upsert({ user_id: user!.id, ...form } as never, { onConflict: "user_id" });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
      if (e2) throw e2;
    },
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings", user?.id] }); qc.invalidateQueries({ queryKey: ["profile", user?.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Password management removed: this build has no auth provider (local demo gate only).

  if (isLoading) return <><Skeleton className="h-96 w-full max-w-4xl mx-auto" /></>;

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
              <Field label="Email"><Input value={user?.email ?? ""} disabled /></Field>
              <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" /></Field>
              <Field label="Address"><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <Toggle label="Email notifications" checked={form.notify_email} onChange={(v) => setForm({ ...form, notify_email: v })} />
              <Toggle label="SMS notifications" checked={form.notify_sms} onChange={(v) => setForm({ ...form, notify_sms: v })} />
              <Toggle label="Push notifications" checked={form.notify_push} onChange={(v) => setForm({ ...form, notify_push: v })} />
              <Toggle label="Marketing offers" checked={form.notify_marketing} onChange={(v) => setForm({ ...form, notify_marketing: v })} />
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <Toggle label="Login alerts" desc="Email me when a new device signs in" checked={form.login_alerts} onChange={(v) => setForm({ ...form, login_alerts: v })} />
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <Field label="Language">
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                    <SelectItem value="ta">தமிழ்</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Currency">
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
            <Save className="w-4 h-4 mr-2" /> {saveMut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6 mt-4 space-y-4">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1">{children}</div></div>;
}
function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0">
      <div><div className="font-medium text-sm">{label}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
