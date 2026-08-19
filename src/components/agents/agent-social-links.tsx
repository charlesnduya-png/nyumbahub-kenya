import { Globe, Music2 } from "lucide-react";
import type { SVGProps } from "react";

import { Button } from "@/components/ui/button";
import type { AgentSocialLinks } from "@/lib/agent-social-url";
import { hasAgentSocialLinks } from "@/lib/agent-social-url";
import { cn } from "@/lib/utils";

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.523.993c.428.427.773.912.993 1.523.163.46.349 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.088 4.088 0 01-.993 1.523 4.088 4.088 0 01-1.523.993c-.46.163-1.26.349-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.088 4.088 0 01-1.523-.993 4.088 4.088 0 01-.993-1.523c-.163-.46-.349-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.088 4.088 0 01.993-1.523A4.088 4.088 0 015.152 2.204c.46-.163 1.26-.349 2.43-.403C8.416 2.175 8.796 2.163 12 2.163zM12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.902.333 4.14.63a6.21 6.21 0 00-2.247 1.463A6.21 6.21 0 00.43 4.34C.133 5.102-.069 5.975.072 7.253.014 8.533 0 8.941 0 12s.014 3.467.072 4.747c.058 1.278.26 2.151.558 2.913a6.21 6.21 0 001.463 2.247 6.21 6.21 0 002.247 1.463c.762.297 1.635.5 2.913.558C8.533 23.986 8.941 24 12 24s3.467-.014 4.747-.072c1.278-.058 2.151-.26 2.913-.558a6.21 6.21 0 002.247-1.463 6.21 6.21 0 001.463-2.247c.297-.762.5-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.058-1.278-.26-2.151-.558-2.913a6.21 6.21 0 00-1.463-2.247A6.21 6.21 0 0019.66.63C18.898.333 18.025.131 16.747.072 15.467.014 15.059 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11-.001-4.125 2.062 2.062 0 01.001 4.125zM6.864 20.452H3.809V9h3.055v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type AgentSocialLinksProps = AgentSocialLinks & {
  className?: string;
  size?: "sm" | "default";
};

const SOCIAL_ITEMS = [
  { key: "website", label: "Website", icon: Globe },
  { key: "facebookUrl", label: "Facebook", icon: FacebookIcon },
  { key: "instagramUrl", label: "Instagram", icon: InstagramIcon },
  { key: "linkedinUrl", label: "LinkedIn", icon: LinkedinIcon },
  { key: "twitterUrl", label: "X (Twitter)", icon: TwitterIcon },
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
