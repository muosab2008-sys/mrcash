"use client";

import { useState } from "react";
import { Save, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("Mr. Cash");
  const [referralBonus, setReferralBonus] = useState("0");
  const [referralCommission, setReferralCommission] = useState("5");
  const [adminEmails, setAdminEmails] = useState([
    "admin@mrcash.app",
    "support@mrcash.app",
  ]);
  const [newEmail, setNewEmail] = useState("");

  const handleAddEmail = () => {
    if (newEmail && !adminEmails.includes(newEmail)) {
      setAdminEmails([...adminEmails, newEmail]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setAdminEmails(adminEmails.filter((e) => e !== email));
  };

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure platform settings
        </p>
      </div>

      {/* General Settings */}
      <Card className="border-border bg-card p-6">
        <h2 className="mb-4 font-bold text-foreground">General Settings</h2>
        <FieldGroup>
          <Field>
            <FieldLabel>Site Name</FieldLabel>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="max-w-md bg-input"
            />
          </Field>
        </FieldGroup>
      </Card>

      {/* Referral Settings */}
      <Card className="border-border bg-card p-6">
        <h2 className="mb-4 font-bold text-foreground">Referral Settings</h2>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Referral Bonus (Points)</FieldLabel>
              <Input
                type="number"
                value={referralBonus}
                onChange={(e) => setReferralBonus(e.target.value)}
                className="bg-input"
                placeholder="Points given to new users on signup"
              />
              <p className="text-xs text-muted-foreground">
                Points given to new users who sign up with a referral link
              </p>
            </Field>
            <Field>
              <FieldLabel>Referral Commission (%)</FieldLabel>
              <Input
                type="number"
                value={referralCommission}
                onChange={(e) => setReferralCommission(e.target.value)}
                className="bg-input"
                placeholder="Commission percentage"
              />
              <p className="text-xs text-muted-foreground">
                Percentage of referred user earnings given to referrer
              </p>
            </Field>
          </div>
        </FieldGroup>
      </Card>

      {/* Admin Emails */}
      <Card className="border-border bg-card p-6">
        <h2 className="mb-4 font-bold text-foreground">Admin Email Whitelist</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Users with these email addresses will have access to the admin panel
        </p>

        {/* Current Admin Emails */}
        <div className="mb-4 flex flex-wrap gap-2">
          {adminEmails.map((email) => (
            <Badge
              key={email}
              variant="outline"
              className="gap-1 px-3 py-1.5"
            >
              {email}
              <button
                onClick={() => handleRemoveEmail(email)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Add New Email */}
        <div className="flex gap-2">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter email address"
            className="max-w-md bg-input"
            onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
          />
          <Button variant="outline" onClick={handleAddEmail}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
