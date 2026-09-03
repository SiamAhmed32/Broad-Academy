import { Container } from "@/components/reusables";

import ContactFormCard from "./ContactFormCard";
import ContactMethodsCard from "./ContactMethodsCard";
import ContactSectionHeader from "./ContactSectionHeader";
import QuickReplyCard from "./QuickReplyCard";

const ContactSection = () => {
  return (
    <section id="contact" className="overflow-x-hidden bg-[#FBFCFE] py-12 sm:py-16 lg:py-20">
      <Container>
        <ContactSectionHeader />

        <div className="mt-8 grid min-w-0 grid-cols-1 items-start gap-6 sm:mt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <ContactFormCard />

          <div className="flex flex-col gap-6">
            <ContactMethodsCard />
            <QuickReplyCard />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ContactSection;
