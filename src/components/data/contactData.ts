import { Clock3, Mail, MapPin, Phone } from "lucide-react";

const supportEmail = "support.broadacademy@gmail.com";

export const contactDetails = {
  email: supportEmail,
  // Opens a Gmail compose window. mailto: does nothing for visitors who have
  // no desktop mail app set up, which is most of them.
  emailHref: `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}`,
  phone: "+880 1710785565",
  phoneHref: "tel:+8801710785565",
  whatsappHref: "https://wa.me/8801710785565",
  technicalWhatsapp: "01575863753",
  technicalWhatsappHref: "https://wa.me/8801575863753",
  address: "Banasree, Dhaka, Bangladesh",
  hours: "10:00 AM – 11:00 PM",
  responseTime: "We usually reply within 1–2 business days.",
};

/** The people visitors can call or WhatsApp, shown on the contact page. */
export const contactPeople = [
  {
    phone: "01710785565",
    name: "ADIB HASAN",
    role: "Founder & CEO",
    phoneHref: contactDetails.phoneHref,
    whatsappHref: contactDetails.whatsappHref,
  },
  {
    phone: "+880 1575863753",
    name: "HASIBUL HOQUE PROBAL",
    role: "Technical Support",
    phoneHref: "tel:+8801575863753",
    whatsappHref: contactDetails.technicalWhatsappHref,
  },
] as const;

export const contactMethods = [
  {
    icon: Mail,
    label: "Email us",
    value: contactDetails.email,
    href: contactDetails.emailHref,
    description: "Best for detailed questions and enrollment support.",
  },
  {
    icon: Phone,
    label: "Call & WhatsApp",
    value: contactDetails.phone,
    people: contactPeople,
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
