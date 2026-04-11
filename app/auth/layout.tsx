export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 luxury-grid" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 bg-linear-to-b from-primary/20 via-accent/10 to-transparent" />

      <div className="relative z-10">
        <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:block">
            {/* Header */}
            <header className="flex-start p-4">
              <div className=" text-cente ">
                <div className=" mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent hero-glow">
                  <span className="text-3xl font-bold text-primary-foreground">
                    ₦
                  </span>
                </div>
                <h1 className="text-4xl font-semibold text-foreground">
                  NairaFlow
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Smart remittance. Automatic protection.
                </p>
              </div>
            </header>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground surface-panel">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                Built for borderless savings on Monad
              </div>
              <h1 className="mb-4 text-5xl font-semibold leading-tight text-foreground">
                Protect every incoming dollar before it disappears.
              </h1>
              <p className="text-lg text-muted-foreground">
                NairaFlow turns each stablecoin payment into disciplined
                spending power and protected USD reserves.
              </p>
            </div>
          </div>

          <div className="w-full max-w-md justify-self-center">
            <div className="surface-panel rounded-[28px] p-8">{children}</div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Demo environment. Claims shown in-product should match
              implementation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
