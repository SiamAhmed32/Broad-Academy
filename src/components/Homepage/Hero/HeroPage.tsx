import { Container } from "@/components/reusables";
import HeroRightSection from "./HeroRightSection";
import HeroLeftSection from "./HeroLeftSection";
import HeroCommunityStrip from "./HeroCommunityStrip";

const HeroPage = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-btnBg/5 via-transparent to-transparent"
      />

      <Container className="pb-10 pt-10 sm:pb-12 sm:pt-14 lg:pb-16 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
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
