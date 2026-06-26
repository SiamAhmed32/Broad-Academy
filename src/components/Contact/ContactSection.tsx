import { Container } from "@/components/reusables";

import ContactForm from "./ContactForm";
import ContactHeader from "./ContactHeader";
import ContactInfo from "./ContactInfo";

const ContactSection = () => {
  return (
    <section id="contact" className="bg-soft py-14 sm:py-16 lg:py-20">
      <Container>
        <ContactHeader variant="section" />

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <ContactInfo compact />
          <ContactForm source="homepage" />
        </div>
      </Container>
    </section>
  );
};

export default ContactSection;
