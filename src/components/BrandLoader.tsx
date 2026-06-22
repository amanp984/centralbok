import bannerAsset from "@/assets/cbi-official-logo.png.asset.json";

type Variant = "fullscreen" | "overlay";

/**
 * Full-screen brand loader — no card, no white box.
 * Just the Central Bank banner over a blurred dark backdrop with a spinner.
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
  void variant;
  return (
    <div
      aria-hidden={!visible}
      role={visible ? "status" : undefined}
      className={[
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6",
        "transition-opacity duration-300 ease-out",
        "bg-slate-950/60 backdrop-blur-[12px]",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <img
        src={bannerAsset.url}
        alt="Central Bank of India"
        className="w-[78%] max-w-[460px] h-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] animate-[brand-pulse_1.8s_ease-in-out_infinite]"
      />
      <div className="w-10 h-10 rounded-full border-[3px] border-white/25 border-t-white animate-spin" />
      {message && (
        <p className="text-white/95 text-sm sm:text-base font-medium tracking-wide text-center px-6">
          {message}
        </p>
      )}
    </div>
  );
}
