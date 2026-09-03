import Image from "next/image";

import type { TeamMember } from "@/lib/instructors/types";
import { FacebookIcon, YoutubeIcon } from "./SocialIcons";

const TeamInstructorCard = ({ member }: { member: TeamMember }) => {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-md shadow-navy/5 ring-1 ring-navy/5">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-heroBg">
        <Image
          src={member.avatarUrl}
          alt={member.fullName}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      </div>

      <h3 className="mt-4 text-base font-semibold text-navy">{member.fullName}</h3>

      <div className="mt-3 flex items-center justify-center gap-2">
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

export default TeamInstructorCard;
