import { Container } from "@/components/reusables";
import HeroRightSection from "./HeroRightSection";
import HeroLeftSection from "./HeroLeftSection";
import HeroCommunityStrip from "./HeroCommunityStrip";

const HeroPage = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      <Container className="pb-10 pt-10 sm:pb-12 sm:pt-14 lg:pb-16 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end lg:gap-4">
          {/* Left Section */}
          <HeroLeftSection />

          {/* HeroRightSection */}
          <HeroRightSection />
        </div>

        <HeroCommunityStrip />
      </Container>
    </section>
  );
};

export default HeroPage;
