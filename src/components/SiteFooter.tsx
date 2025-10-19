import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Github, Linkedin, Twitter } from "lucide-react";

type SiteFooterProps = {
  className?: string;
};

const SiteFooter = ({ className }: SiteFooterProps) => {
  const socialLinks = [
    {
      href: "https://www.linkedin.com/in/lance-yan/",
      label: "LinkedIn",
      Icon: Linkedin,
    },
    {
      href: "https://github.com/lance116",
      label: "GitHub",
      Icon: Github,
    },
    {
      href: "https://x.com/cnnguan",
      label: "X (Twitter)",
      Icon: Twitter,
    },
  ];

  return (
    <footer className={cn("border-t border-slate-200/80 bg-white/85", className)}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10 text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">
            &copy; {new Date().getFullYear()} ratemycompany. All rights reserved.
          </p>
          <p className="text-sm">
            If you want a company featured or noticed a bug/mistake, feel free to contact me:
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {socialLinks.map(({ href, label, Icon }) => (
            <Button
              key={href}
              asChild
              variant="ghost"
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            >
              <a href={href} target="_blank" rel="noreferrer">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{label}</span>
              </a>
            </Button>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
