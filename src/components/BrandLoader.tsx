import bannerAsset from "@/assets/cbi-banner.png.asset.json";

type Variant = "fullscreen" | "overlay";

/**
 * Glass loader showing the Central Bank banner over the blurred page.
 * Keeps the current page visible — never shows a black screen.
 */
export function BrandLoader({
  message = "Securing your session...",
  variant = "overlay",
  visible = true,
}: {
  message?: string;
  variant?: Variant;
  visible?: boolean;
}) {
  const isFullscreen = variant === "fullscreen";
  return (
    <div
      aria-hidden={!visible}
      role={visible ? "status" : undefined}
      className={[
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5",
        "transition-opacity duration-300 ease-out",
        "bg-slate-950/45 backdrop-blur-[10px]",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div
        className={[
          "rounded-xl bg-white/95 shadow-2xl ring-1 ring-white/40 px-5 py-3",
          "animate-[brand-pulse_1.6s_ease-in-out_infinite]",
          isFullscreen ? "max-w-[440px] w-[88%] sm:w-[440px]" : "max-w-[360px] w-[82%] sm:w-[380px]",
        ].join(" ")}
      >
        <img
          src={bannerAsset.url}
          alt="Central Bank of India"
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="w-9 h-9 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
      {message && (
        <p className="text-white/95 text-sm sm:text-base font-medium tracking-wide text-center px-6">
          {message}
        </p>
      )}
    </div>
  );
}
