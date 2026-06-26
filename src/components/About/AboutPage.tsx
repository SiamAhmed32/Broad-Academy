import AboutApproach from "./AboutApproach";
import AboutCTA from "./AboutCTA";
import AboutHero from "./AboutHero";
import AboutMission from "./AboutMission";
import AboutPillars from "./AboutPillars";
import AboutStats from "./AboutStats";
import AboutStory from "./AboutStory";
import AboutTimeline from "./AboutTimeline";

const AboutPage = () => {
  return (
    <main className="bg-white">
      <AboutHero />
      <AboutStats />
      <AboutMission />
      <AboutStory />
      <AboutPillars />
      <AboutTimeline />
      <AboutApproach />
      <AboutCTA />
    </main>
  );
};

export default AboutPage;
