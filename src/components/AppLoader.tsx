import loaderAsset from "@/assets/cbi-loader.png.asset.json";

type Variant = "fullscreen" | "overlay";

/**
 * AppLoader — global reusable loading component for the banking portal.
 * Uses the Central Bank emblem asset with a blue-themed animated ring.
 * Replaces the previous BrandLoader everywhere.
 */
export function AppLoader({
  message = "Loading...",
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
        "bg-[#0b1e3f]/85 backdrop-blur-[10px]",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div className="relative flex items-center justify-center w-[160px] h-[160px]">
        {/* Outer rotating blue ring */}
        <div
          className="absolute inset-0 rounded-full border-[4px] border-transparent animate-spin"
          style={{
            borderTopColor: "#1e88ff",
            borderRightColor: "#1e88ff",
            animationDuration: "1.4s",
          }}
        />
        {/* Inner counter-rotating faint ring */}
        <div
          className="absolute inset-3 rounded-full border-[2px] border-transparent animate-spin"
          style={{
            borderBottomColor: "rgba(120,180,255,0.55)",
            animationDuration: "2.4s",
            animationDirection: "reverse",
          }}
        />
        {/* Emblem — uploaded reference image, unchanged */}
        <img
          src={loaderAsset.url}
          alt="Central Bank of India"
          className="w-[92px] h-[92px] object-contain drop-shadow-[0_6px_18px_rgba(30,136,255,0.45)] animate-[brand-pulse_1.8s_ease-in-out_infinite]"
        />
      </div>
      {message && (
        <p className="text-white text-sm sm:text-base font-medium tracking-wide text-center px-6">
          {message}
        </p>
      )}
    </div>
  );
}

// Backwards-compatible alias so any lingering import keeps working.
export const BrandLoader = AppLoader;