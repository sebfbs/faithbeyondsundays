import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const queryClient = useQueryClient();

  const { data: church, isLoading } = useQuery({
    queryKey: ["admin", "church-settings", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .eq("id", churchId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "",
    city: "",
    state: "",
    website_url: "",
    instagram_handle: "",
    giving_url: "",
  });

  useEffect(() => {
    if (church) {
      setForm({
        name: church.name || "",
        city: church.city || "",
        state: church.state || "",
        website_url: church.website_url || "",
        instagram_handle: church.instagram_handle || "",
        giving_url: church.giving_url || "",
      });
    }
  }, [church]);

  const updateChurch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("churches")
        .update({
          name: form.name,
          city: form.city || null,
          state: form.state || null,
          website_url: form.website_url || null,
          instagram_handle: form.instagram_handle || null,
          giving_url: form.giving_url || null,
        })
        .eq("id", churchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "church-settings"] });
      toast.success("Church settings saved");
    },
    onError: () => toast.error("Failed to save"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Church Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your church profile</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Church Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Instagram Handle</Label>
            <Input value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} placeholder="@yourchurch" />
          </div>
          <div className="space-y-2">
            <Label>Giving URL</Label>
            <Input value={form.giving_url} onChange={(e) => setForm({ ...form, giving_url: e.target.value })} placeholder="https://..." />
          </div>
          <Button onClick={() => updateChurch.mutate()} disabled={updateChurch.isPending}>
            {updateChurch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
