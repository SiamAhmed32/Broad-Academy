import { Container } from "@/components/reusables";
import HeroRightSection from "./HeroRightSection";
import HeroLeftSection from "./HeroLeftSection";

const HeroPage = () => {
  return (
    <section className="bg-navy overflow-hidden">
      <Container className="pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pb-14 lg:pt-12">
        <div className="grid items-center gap-10 px-4 sm:px-6 lg:min-h-[620px] lg:grid-cols-[1.02fr_0.98fr] lg:px-10">
          {/* Left Section */}
          <HeroLeftSection />

          {/* HeroRightSection */}
          <HeroRightSection />
        </div>
      </Container>
    </section>
  );
};

export default HeroPage;
