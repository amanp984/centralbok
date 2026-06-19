import logoAsset from "@/assets/brand-logo.png.asset.json";

type Variant = "fullscreen" | "overlay";

export function BrandLoader({
  message,
  variant = "fullscreen",
  visible = true,
}: {
  message?: string;
  variant?: Variant;
  visible?: boolean;
}) {
  const isOverlay = variant === "overlay";
  return (
    <div
      aria-hidden={!visible}
      role={visible ? "status" : undefined}
      className={[
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 transition-opacity duration-300",
        isOverlay ? "bg-black/55 backdrop-blur-sm" : "bg-black",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <img
        src={logoAsset.url}
        alt="Central Bank of India"
        className={`${isOverlay ? "w-20 h-20" : "w-28 h-28"} object-contain drop-shadow-xl animate-[fade-in_0.4s_ease-out]`}
      />
      <div
        className={`${isOverlay ? "w-7 h-7 border-2" : "w-9 h-9 border-[3px]"} rounded-full border-white/30 border-t-white animate-spin`}
      />
      {message && (
        <p className="text-white/90 text-sm font-medium tracking-wide">{message}</p>
      )}
    </div>
  );
}
