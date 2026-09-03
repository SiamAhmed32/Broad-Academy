import Image from "next/image";

import type { TeamMember } from "@/lib/instructors/types";
import { FacebookIcon, YoutubeIcon } from "./SocialIcons";

const TeamMentorCard = ({ member }: { member: TeamMember }) => {
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow-md shadow-navy/5 ring-1 ring-navy/5">
      <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-heroBg">
        <Image
          src={member.avatarUrl}
          alt={member.fullName}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      <h3 className="mt-4 text-base font-semibold text-navy">{member.fullName}</h3>
      <p className="mt-0.5 text-sm font-medium text-accent">{member.title}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-navy/60">
        {member.shortBio}
      </p>

      <div className="mt-4 flex items-center justify-center gap-2">
        {member.facebookUrl ? (
          <a
            href={member.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.fullName} on Facebook`}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
          >
            <FacebookIcon className="h-3.5 w-3.5" />
          </a>
        ) : null}
        {member.youtubeUrl ? (
          <a
            href={member.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.fullName} on YouTube`}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
          >
            <YoutubeIcon className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default TeamMentorCard;
