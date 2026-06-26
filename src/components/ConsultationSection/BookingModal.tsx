"use client";

import { CalendarCheck, ShieldCheck } from "lucide-react";
import Modal from "../reusables/Modal";
import BookingForm from "./BookingForm";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request parent counselling">
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <CalendarCheck className="h-5 w-5 text-accent" />
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              <ShieldCheck className="h-3 w-3" />
              Fees confirmed before session
            </div>
          </div>
          <h2 className="text-xl font-bold text-navy sm:text-2xl">
            Request a parent counselling session
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            Tell us about your child&apos;s class, subject needs, and study
            concerns. Our team will contact you to confirm timing and discuss
            session fees before the appointment is scheduled.
          </p>
        </div>

        <BookingForm onSuccess={onClose} />
      </div>
    </Modal>
  );
}
