import Header from "@/components/public/Header";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] bg-[#F9F4EC] dark:bg-[#14100c] text-[#1E160A] dark:text-[#f5ede2] flex flex-col overflow-hidden">
      <Header fixed={false} />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
