import { Container } from "@/components/reusables";
import type { TeamListResponse } from "@/lib/instructors/types";

import InstructorCTA from "./InstructorCTA";
import InstructorHero from "./InstructorHero";
import TeamInstructorCard from "./TeamInstructorCard";
import TeamMentorCard from "./TeamMentorCard";

type InstructorsPageProps = {
  initialData: TeamListResponse;
};

const InstructorsPage = ({ initialData }: InstructorsPageProps) => {
  const { instructors, mentors } = initialData;

  return (
    <main className="overflow-hidden bg-soft">
      <InstructorHero />

      <section className="py-14 sm:py-20">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-navy sm:text-3xl">
              Our Expert Instructors
            </h2>
            <div className="mx-auto mt-3 h-[3px] w-14 rounded-full bg-accent" />
            <p className="mx-auto mt-4 max-w-xl leading-7 text-navy/60">
              We have a team of experienced and passionate instructors who are
              dedicated to helping you learn and grow.
            </p>
          </div>

          {instructors.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {instructors.map((member) => (
                <TeamInstructorCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-center text-navy/50">
              Instructor profiles are coming soon.
            </p>
          )}
        </Container>
      </section>

      <section className="border-t border-navy/8 py-14 sm:py-20">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-navy sm:text-3xl">
              Our Mentors &amp; Student Support Team
            </h2>
            <div className="mx-auto mt-3 h-[3px] w-14 rounded-full bg-accent" />
            <p className="mx-auto mt-4 max-w-xl leading-7 text-navy/60">
              Our mentor and support team is always here to guide you and
              ensure you have the best learning experience.
            </p>
          </div>

          {mentors.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {mentors.map((member) => (
                <TeamMentorCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-center text-navy/50">
              Mentor profiles are coming soon.
            </p>
          )}
        </Container>
      </section>

      <InstructorCTA />
    </main>
  );
};

export default InstructorsPage;
