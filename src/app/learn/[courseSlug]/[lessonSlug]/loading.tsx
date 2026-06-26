export default function LearningRoomLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-[#f4f7fb]">
      <div className="h-16 bg-navy" />
      <div className="mx-auto grid max-w-[100rem] gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="aspect-video rounded-3xl bg-navy/15" />
        <div className="h-[42rem] rounded-3xl bg-white" />
      </div>
    </main>
  );
}
