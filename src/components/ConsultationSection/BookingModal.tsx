"use client";

import { CalendarCheck, ShieldCheck } from "lucide-react";
import Modal from "../reusables/Modal";
import BookingForm from "./BookingForm";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: { email: string; phone: string | null } | null;
}

export default function BookingModal({ isOpen, onClose, account }: BookingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Study Plan / Counselling" insetOnMobile>
      <div className="p-4 sm:p-8">
        <div className="mb-6">
          <div className="mb-3 flex min-w-0 items-center gap-2 pr-10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <CalendarCheck className="h-5 w-5 text-accent" />
            </div>
            <div lang="bn" className="font-bangla flex items-start gap-1.5 rounded-2xl bg-amber-50 px-3 py-1 text-xs font-medium leading-relaxed text-amber-800">
              <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
              স্টাডি প্ল্যান/কাউন্সেলিং বুক করার পূর্বে নির্ধারিত সম্মানী প্রদান করতে হবে।
            </div>
          </div>
          <h2 className="font-bangla text-xl font-bold text-navy sm:text-2xl">
            স্টাডি প্ল্যান ও কাউন্সেলিং সেশনের জন্য আবেদন করুন
          </h2>
          <p className="font-bangla mt-1.5 text-sm leading-relaxed text-gray-500">
            সর্তকতার সাথে ফরমটি ফিলাপ করুন, খুব অল্প কথায় শিক্ষার্থীর সমস্যাগুলো
            জানান পরবর্তীতে আমাদের টিম আপনার সাথে যোগাযোগ করবে।
          </p>
        </div>

        <BookingForm onSuccess={onClose} initialAccount={account} />
      </div>
    </Modal>
  );
}
