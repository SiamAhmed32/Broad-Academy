import {
  legalPagesData,
  SUPPORT_EMAIL,
  type LegalPageSlug,
} from "@/components/data/legalPagesData";
import { Container } from "@/components/reusables";

type LegalPageProps = {
  slug: LegalPageSlug;
};

const EmailLink = () => (
  <a
    href={`mailto:${SUPPORT_EMAIL}`}
    className="font-medium text-accent underline-offset-4 hover:underline"
  >
    {SUPPORT_EMAIL}
  </a>
);

// Turns any mention of the support email inside copy into a mailto link.
const withEmailLinks = (text: string) =>
  text.split(SUPPORT_EMAIL).flatMap((part, index) =>
    index === 0 ? [part] : [<EmailLink key={index} />, part],
  );

const LegalPage = ({ slug }: LegalPageProps) => {
  const page = legalPagesData[slug];

  return (
    <main className="bg-[#f8fbff]">
      <Container>
        <article className="mx-auto max-w-4xl py-14 sm:py-20">
          <h1 className="text-center text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            {page.title}
          </h1>

          <p className="mt-10 text-lg leading-8 text-[#1f2d45] sm:text-xl sm:leading-9">
            {page.intro}
          </p>

          <ol className="mt-10 space-y-9">
            {page.sections.map((section, index) => (
              <li key={section.title}>
                <h2 className="text-xl font-semibold text-navy sm:text-2xl">
                  <span className="text-accent">{index + 1}.</span>{" "}
                  {section.title}
                </h2>
                <p className="mt-3 text-base leading-8 text-[#1f2d45] sm:text-lg sm:leading-8">
                  {withEmailLinks(section.body)}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-12 border-t border-navy/10 pt-6 text-base text-body">
            <p>
              Last updated:{" "}
              <span className="font-medium text-navy">{page.lastUpdated}</span>
            </p>
            <p className="mt-2">
              Questions? Contact us at <EmailLink />
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
};

export default LegalPage;
