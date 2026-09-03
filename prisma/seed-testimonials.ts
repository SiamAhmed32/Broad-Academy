import "dotenv/config";
import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";

const testimonials = [
  {
    fullName: "আরিব রহমান",
    identity: "শিক্ষার্থী, HSC 26 ব্যাচ",
    review:
      "এই প্ল্যাটফর্মের ক্লাস ও ম্যাটেরিয়াল আমার পড়াশোনার জন্য দারুণ সহায়ক হয়েছে। শিক্ষকরা খুবই সহযোগী এবং প্রতিটি টপিক খুব সহজভাবে বুঝিয়ে দেন। আমার প্রস্তুতি এখন অনেক গুছানো ও আত্মবিশ্বাসী।",
    imageUrl: "/testimonials/img1.jpg",
    rating: 5,
    featured: true,
    displayOrder: 1,
  },
  {
    fullName: "সাদিয়া আফরিন",
    identity: "শিক্ষার্থী, HSC 27 ব্যাচ",
    review:
      "নিয়মিত পরীক্ষা, ডাউট সলভ ক্লাস এবং পার্সোনাল গাইডলাইন আমার জন্য অনেক উপকারে এসেছে। এখানে শেখার পরিবেশ ও সাপোর্টিভ সিস্টেম সত্যিই অসাধারণ।",
    imageUrl: "/testimonials/img2.jpg",
    rating: 5,
    featured: true,
    displayOrder: 2,
  },
  {
    fullName: "মোঃ কামরুল ইসলাম",
    identity: "অভিভাবক",
    review:
      "আমার ছেলে এখানে পড়ে অনেক উপকৃত হয়েছে। শিক্ষকরা শিক্ষার্থীদের খুব যত্ন নেন এবং পড়াশোনার অগ্রগতি নিয়মিত জানানো হয়। একজন অভিভাবক হিসেবে আমি খুবই সন্তুষ্ট।",
    imageUrl: "/testimonials/img3.jpg",
    rating: 5,
    featured: true,
    displayOrder: 3,
  },
  {
    fullName: "ফারজানা আক্তার",
    identity: "অভিভাবক",
    review:
      "এখানকার গাইডলাইন, আপডেট এবং শিক্ষকদের আন্তরিকতা আমাদের আস্থা বাড়িয়েছে। আমার মেয়ের আত্মবিশ্বাস ও পড়াশোনার মান দুটোই অনেক উন্নত হয়েছে।",
    imageUrl: "/testimonials/img4.jpg",
    rating: 5,
    featured: true,
    displayOrder: 4,
  },
  {
    fullName: "তানভীর হাসান",
    identity: "শিক্ষার্থী, SSC 26 ব্যাচ",
    review:
      "গাইডলাইন ও রুটিন মেনে পড়াশোনা করার অভ্যাস এখানেই তৈরি হয়েছে। কঠিন অধ্যায়গুলোও এখন সহজে বুঝতে পারি এবং পরীক্ষার আগে আত্মবিশ্বাসী থাকি।",
    imageUrl: "/testimonials/img5.jpg",
    rating: 5,
    featured: false,
    displayOrder: 5,
  },
  {
    fullName: "নুসরাত জাহান",
    identity: "অভিভাবক",
    review:
      "সন্তানের পড়াশোনার অগ্রগতি নিয়মিত জানতে পারায় নিশ্চিন্ত থাকি। শিক্ষকদের ফলোআপ ও পরামর্শ সত্যিই অনেক কাজে দিয়েছে।",
    imageUrl: "/testimonials/img6.jpg",
    rating: 5,
    featured: false,
    displayOrder: 6,
  },
  {
    fullName: "মাহিন খান",
    identity: "শিক্ষার্থী, HSC 26 ব্যাচ",
    review:
      "মডেল টেস্ট ও রিভিশন ক্লাসগুলো পরীক্ষার আগে আমাকে অনেক সাহায্য করেছে। এখন কোন টপিকে জোর দিতে হবে তা স্পষ্ট বুঝতে পারি।",
    imageUrl: "/testimonials/img7.jpg",
    rating: 5,
    featured: false,
    displayOrder: 7,
  },
  {
    fullName: "রোকসানা বেগম",
    identity: "অভিভাবক",
    review:
      "শিক্ষকদের আন্তরিকতা ও নিয়মিত যোগাযোগ আমাদের জন্য স্বস্তির বিষয়। মেয়ের পড়াশোনার প্রতি আগ্রহ আগের চেয়ে অনেক বেড়েছে।",
    imageUrl: "/testimonials/img8.jpg",
    rating: 5,
    featured: false,
    displayOrder: 8,
  },
];

async function main() {
  await db.$executeRaw`DELETE FROM "Testimonial"`;

  for (const item of testimonials) {
    await db.$executeRaw`
      INSERT INTO "Testimonial" (
        "id", "fullName", "identity", "review", "imageUrl", "rating",
        "featured", "displayOrder", "status", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${item.fullName}, ${item.identity}, ${item.review},
        ${item.imageUrl}, ${item.rating}, ${item.featured}, ${item.displayOrder},
        ${"PUBLISHED"}::"TestimonialStatus", NOW()
      )
    `;
  }

  console.log(`Seeded ${testimonials.length} testimonials.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
