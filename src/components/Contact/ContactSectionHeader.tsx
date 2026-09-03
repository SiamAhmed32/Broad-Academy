import Image from "next/image";

const ContactSectionHeader = () => {
  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#0D1321] sm:text-3xl lg:text-4xl">
          আমাদের সাথে যোগাযোগ করুন
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#64748B] sm:text-base">
          আপনার যেকোনো প্রশ্ন, পরামর্শ বা সহযোগিতার জন্য আমরা সর্বদা প্রস্তুত।
          চলুন হাত বাড়িয়ে যোগাযোগ করুন, আমরা দ্রুত আপনার সাথে যোগাযোগ করব।
        </p>
      </div>

      <div className="relative h-28 w-40 shrink-0 sm:h-32 sm:w-48">
        <Image
          src="/contact/support-illustration.png"
          alt="সাপোর্ট টিমের সাথে যোগাযোগ"
          fill
          className="object-contain"
          sizes="200px"
        />
      </div>
    </div>
  );
};

export default ContactSectionHeader;
