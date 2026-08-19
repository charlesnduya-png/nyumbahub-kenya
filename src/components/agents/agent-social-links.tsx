import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AgentSocialLinks } from "@/lib/agent-social-url";
import { hasAgentSocialLinks } from "@/lib/agent-social-url";
import { cn } from "@/lib/utils";

type AgentSocialLinksProps = AgentSocialLinks & {
  className?: string;
  size?: "sm" | "default";
};

const SOCIAL_ITEMS = [
  { key: "website", label: "Website", icon: Globe },
  { key: "facebookUrl", label: "Facebook", icon: Facebook },
  { key: "instagramUrl", label: "Instagram", icon: Instagram },
  { key: "linkedinUrl", label: "LinkedIn", icon: Linkedin },
  { key: "twitterUrl", label: "X (Twitter)", icon: Twitter },
  { key: "tiktokUrl", label: "TikTok", icon: Music2 },
] as const;

export function AgentSocialLinks({
  className,
  size = "default",
  ...links
}: AgentSocialLinksProps) {
  if (!hasAgentSocialLinks(links)) return null;

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {SOCIAL_ITEMS.map(({ key, label, icon: Icon }) => {
        const href = links[key];
        if (!href) return null;

        return (
          <Button
            key={key}
            asChild
            variant="outline"
            size="icon"
            className={cn(buttonSize, "shrink-0")}
            title={label}
          >
            <a href={href} target="_blank" rel="noopener noreferrer">
              <Icon className={iconSize} />
              <span className="sr-only">{label}</span>
            </a>
          </Button>
        );
      })}
    </div>
  );
}
