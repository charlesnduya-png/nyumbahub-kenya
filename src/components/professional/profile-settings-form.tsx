"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { ProfilePhotoCard } from "@/components/professional/profile-photo-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AgentProfile {
  id: string;
  agencyName: string | null;
  licenseNumber: string | null;
  specialty: string | null;
  website: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  tiktokUrl: string | null;
  county: string | null;
  town: string | null;
  isVerified: boolean;
  verificationStatus: string;
}

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  bio: string | null;
  role: string;
  verificationStatus: string;
  agentProfile: AgentProfile | null;
}

export function ProfileSettingsForm() {
  const { update: updateSession } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [website, setWebsite] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load profile");
        return;
      }

      const data = json.data as ProfileData;
      setProfile(data);
      setName(data.name ?? "");
      setBio(data.bio ?? "");
      setAgencyName(data.agentProfile?.agencyName ?? "");
      setLicenseNumber(data.agentProfile?.licenseNumber ?? "");
      setSpecialty(data.agentProfile?.specialty ?? "");
      setWebsite(data.agentProfile?.website ?? "");
      setFacebookUrl(data.agentProfile?.facebookUrl ?? "");
      setInstagramUrl(data.agentProfile?.instagramUrl ?? "");
      setLinkedinUrl(data.agentProfile?.linkedinUrl ?? "");
      setTwitterUrl(data.agentProfile?.twitterUrl ?? "");
      setTiktokUrl(data.agentProfile?.tiktokUrl ?? "");
      setCounty(data.agentProfile?.county ?? "");
      setTown(data.agentProfile?.town ?? "");
    } catch {
      toast.error("Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        bio: bio.trim() || null,
      };

      if (profile?.role === "AGENT") {
        payload.agencyName = agencyName.trim() || null;
        payload.licenseNumber = licenseNumber.trim() || null;
        payload.specialty = specialty.trim() || null;
        payload.website = website.trim() || null;
        payload.facebookUrl = facebookUrl.trim() || null;
        payload.instagramUrl = instagramUrl.trim() || null;
        payload.linkedinUrl = linkedinUrl.trim() || null;
        payload.twitterUrl = twitterUrl.trim() || null;
        payload.tiktokUrl = tiktokUrl.trim() || null;
        payload.county = county.trim() || null;
        payload.town = town.trim() || null;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Could not save profile");
        return;
      }

      setProfile(json.data as ProfileData);
      await updateSession({
        user: {
          name: json.data.name,
          image: json.data.image,
        },
      });
      toast.success("Profile updated");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profile…
      </div>
    );
  }

  const isAgent = profile?.role === "AGENT";
  const isVerified =
    profile?.agentProfile?.isVerified ||
    profile?.verificationStatus === "VERIFIED";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ProfilePhotoCard />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle>Account details</CardTitle>
          {isVerified ? (
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Display name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or agency brand"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell buyers and tenants about your experience…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={profile?.phone ?? "—"} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {isAgent ? (
        <>
        <Card>
          <CardHeader>
            <CardTitle>Agent / agency details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agency-name">Agency name</Label>
              <Input
                id="agency-name"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Nyumba Realty"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="license">License number</Label>
                <Input
                  id="license"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Residential rentals"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="town">Town</Label>
                <Input
                  id="town"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://youragency.co.ke"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add links to your social profiles. They appear on your public agent
              profile so clients can follow you.
            </p>

            <div className="space-y-2">
              <Label htmlFor="facebook-url">Facebook</Label>
              <Input
                id="facebook-url"
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram-url">Instagram</Label>
              <Input
                id="instagram-url"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin-url">LinkedIn</Label>
              <Input
                id="linkedin-url"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter-url">X (Twitter)</Label>
              <Input
                id="twitter-url"
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/yourhandle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok-url">TikTok</Label>
              <Input
                id="tiktok-url"
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@yourhandle"
              />
            </div>
          </CardContent>
        </Card>
        </>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={saving} onClick={() => void saveProfile()}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save profile
        </Button>
      </div>
    </div>
  );
}
