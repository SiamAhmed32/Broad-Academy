import React from "react";
import ConsultationImage from "./ConsultationImage";
import { Container } from "../reusables";
import ConsultationInfo from "./ConsultationInfo";
import { getCurrentUser } from "@/lib/auth/session";

const ConsultationPage = async () => {
  const user = await getCurrentUser();
  return (
    <section className="bg-[#F7FAFF] py-14 sm:py-16">
      <Container>
        <div className="flex flex-col items-center gap-10 md:flex-row md:justify-between md:gap-12">
          <ConsultationInfo account={user ? { email: user.email, phone: user.phone } : null} />
          <ConsultationImage />
        </div>
      </Container>
    </section>
  );
};

export default ConsultationPage;
