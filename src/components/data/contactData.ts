import { Clock3, Mail, MapPin, Phone } from "lucide-react";

export const contactDetails = {
  email: "support@broadacademy.com",
  phone: "+880 1813-494196",
  phoneHref: "tel:+8801813494196",
  address: "Dhaka, Bangladesh",
  hours: "Saturday – Thursday, 10:00 AM – 8:00 PM",
  responseTime: "We usually reply within 1–2 business days.",
};

export const contactMethods = [
  {
    icon: Mail,
    label: "Email us",
    value: contactDetails.email,
    href: `mailto:${contactDetails.email}`,
    description: "Best for detailed questions and enrollment support.",
  },
  {
    icon: Phone,
    label: "Call us",
    value: contactDetails.phone,
    href: contactDetails.phoneHref,
    description: "Speak with our academic support team directly.",
  },
  {
    icon: MapPin,
    label: "Location",
    value: contactDetails.address,
    description: "Online-first academy with local support in Dhaka.",
  },
  {
    icon: Clock3,
    label: "Office hours",
    value: contactDetails.hours,
    description: contactDetails.responseTime,
  },
] as const;

export const contactFaq = [
  {
    question: "How quickly will I get a reply?",
    answer:
      "Most messages are answered within 1–2 business days during office hours.",
  },
  {
    question: "Can I book a free consultation?",
    answer:
      "Yes. Choose “Free Consultation” as the subject and mention your class or goals.",
  },
  {
    question: "Do you support Class 6 to HSC students?",
    answer:
      "Yes. We support learners from Class 6 through HSC with subject-focused guidance.",
  },
] as const;
