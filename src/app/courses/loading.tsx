import { Layout } from "@/components/Layout";
import { Container } from "@/components/reusables";

export default function CoursesLoading() {
  return (
    <Layout>
      <main className="min-h-screen bg-[#f7f9fc]">
        <div className="h-80 animate-pulse bg-navy" />
        <Container>
          <div className="-mt-8 h-24 animate-pulse rounded-[1.6rem] bg-white shadow-xl" />
          <div className="grid gap-6 py-16 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[31rem] animate-pulse rounded-[1.65rem] bg-white" />
            ))}
          </div>
        </Container>
      </main>
    </Layout>
  );
}
