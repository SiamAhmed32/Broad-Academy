import Image from "next/image";
import React from "react";

const HeroRightSection = () => {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="relative aspect-[10/10] overflow-hidden rounded-[1.6rem] border border-white/20 bg-white/8 shadow-[0_20px_50px_rgba(5,14,28,0.38)]">
        <Image
          src="/hero/hero1.png"
          alt="Student holding study materials"
          fill
          className="object-cover object-[center_0%]"
          sizes="(max-width: 1024px) 100vw, 620px"
          priority
        />
      </div>
    </div>
  );
};

export default HeroRightSection;
