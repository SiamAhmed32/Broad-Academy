import Image from "next/image";

const OWNER_IMAGE = "/owner image/owner.jpg";

const HeroRightSection = () => {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <Image
        src={OWNER_IMAGE}
        alt="Broad Academy founder"
        width={3264}
        height={2448}
        className="h-auto w-full"
        sizes="(max-width: 1024px) 100vw, 640px"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 0%, #000 86%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, #000 0%, #000 86%, transparent 100%)",
        }}
        priority
      />
    </div>
  );
};

export default HeroRightSection;
