import Image from "next/image";

const OWNER_IMAGE = "/owner image/owner.jpg";

const HeroRightSection = () => {
  return (
    <div className="relative mx-auto w-full max-w-[680px] overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-[0_20px_50px_rgba(22,51,81,0.12)]">
      <Image
        src={OWNER_IMAGE}
        alt="Broad Academy founder"
        width={3264}
        height={2448}
        className="aspect-[4/3] h-auto w-full object-cover object-top"
        sizes="(max-width: 1024px) 100vw, 680px"
        priority
      />
    </div>
  );
};

export default HeroRightSection;
