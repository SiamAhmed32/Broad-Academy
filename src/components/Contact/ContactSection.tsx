import { Container } from "@/components/reusables";

import ContactForm from "./ContactForm";
import ContactHeader from "./ContactHeader";
import ContactInfo from "./ContactInfo";

const ContactSection = () => {
  return (
    <section id="contact" className="overflow-x-hidden bg-soft py-12 sm:py-16 lg:py-20">
      <Container>
        <ContactHeader variant="section" />

        <div className="mt-8 grid min-w-0 grid-cols-1 items-start gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <ContactInfo compact />
          <ContactForm source="homepage" />
        </div>
      </Container>
    </section>
  );
};

export default ContactSection;
