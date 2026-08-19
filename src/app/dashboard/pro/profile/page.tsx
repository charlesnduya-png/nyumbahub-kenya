import { ProfileSettingsForm } from "@/components/professional/profile-settings-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Add your photo or agency logo and keep your public details up to date.
        </p>
      </div>

      <ProfileSettingsForm />
    </div>
  );
}
