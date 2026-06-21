import logoAsset from "@/assets/brand-logo.png.asset.json";

type Variant = "fullscreen" | "overlay";

/**
 * Translucent, blurred loader that keeps the underlying page visible.
 * Never shows a full black screen — uses a dim glass overlay everywhere.
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
        "bg-black/55 backdrop-blur-[10px]",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <img
        src={logoAsset.url}
        alt="Central Bank of India"
        className={[
          "object-contain mix-blend-screen drop-shadow-2xl",
          "animate-[brand-pulse_1.6s_ease-in-out_infinite]",
          isFullscreen
            ? "w-[120px] h-[120px] sm:w-[180px] sm:h-[180px]"
            : "w-[110px] h-[110px] sm:w-[150px] sm:h-[150px]",
        ].join(" ")}
      />
      <div className="w-9 h-9 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
      {message && (
        <p className="text-white/95 text-sm sm:text-base font-medium tracking-wide text-center px-6">
          {message}
        </p>
      )}
    </div>
  );
}
