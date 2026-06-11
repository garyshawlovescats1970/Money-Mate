import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emptyState, parseState, type BudgetState } from "@/types";
import { BudgetProvider } from "@/components/BudgetProvider";
import TabBar from "@/components/TabBar";
import LogoutButton from "@/components/LogoutButton";

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let initial: BudgetState = emptyState();
  const row = await prisma.moneyState.findUnique({
    where: { userId: session.user.id },
  });
  if (row) {
    try {
      initial = parseState(JSON.parse(row.json));
    } catch {
      // keep empty state
    }
  }

  return (
    <BudgetProvider initial={initial}>
      <div className="mx-auto min-h-dvh max-w-[430px] px-4 pb-24 pt-4">
        <header className="mb-4 flex items-center justify-between">
          <span className="brand-text text-lg font-extrabold tracking-tight">
            MoneyMate
          </span>
          <LogoutButton />
        </header>
        {children}
      </div>
      <TabBar />
    </BudgetProvider>
  );
}
