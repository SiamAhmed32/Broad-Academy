import Image from "next/image";

const HeroRightSection = () => {
  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[3rem] bg-btnBg/8 blur-2xl sm:-inset-10"
      />
      <div
        aria-hidden
        className="absolute -right-6 -top-6 -z-10 hidden h-40 w-40 rounded-full border-2 border-dashed border-btnBg/15 sm:block"
      />

      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem]">
        <Image
          src="/hero/students-collage.png"
          alt="Students studying together with laptops, books, and notes"
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 600px"
          priority
        />
      </div>
    </div>
  );
};

export default HeroRightSection;
