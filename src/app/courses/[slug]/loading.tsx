import { Layout } from "@/components/Layout";
import { Container } from "@/components/reusables";

export default function CourseDetailsLoading() {
  return (
    <Layout>
      <main className="min-h-screen animate-pulse bg-[#f7f9fc]">
        <div className="h-[34rem] bg-navy" />
        <Container className="-mt-20 grid gap-8 pb-20 lg:grid-cols-[1fr_370px]">
          <div className="h-[42rem] rounded-[2rem] bg-white" />
          <div className="h-[32rem] rounded-[2rem] bg-white" />
        </Container>
      </main>
    </Layout>
  );
}
