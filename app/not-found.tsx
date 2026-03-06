import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 select-none">
      <Image
        src="/wallpapers/Sonoma.jpeg"
        alt="Background"
        fill
        priority
        className="-z-10 inset-0 object-cover"
      />
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="flex flex-col items-center rounded-xl border border-white/20 px-10 py-8 shadow-2xl"
          style={{
            background: "rgba(236, 236, 236, 0.78)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            boxShadow:
              "0 24px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 0 0 0.5px rgba(255, 255, 255, 0.3)",
            maxWidth: "380px",
            width: "100%",
          }}
          role="alert"
        >
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(180deg, #FFCC02 0%, #FF9500 100%)",
              boxShadow:
                "0 2px 8px rgba(255, 149, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            <span
              className="font-bold text-white"
              style={{
                fontSize: "36px",
                lineHeight: 1,
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.15)",
              }}
            >
              !
            </span>
          </div>

          <h1
            className="mb-1 text-center font-semibold"
            style={{
              fontSize: "15px",
              color: "#1d1d1f",
              letterSpacing: "-0.01em",
            }}
          >
            Page Not Found
          </h1>

          <p
            className="mb-6 text-center"
            style={{
              fontSize: "12px",
              color: "#6e6e73",
              lineHeight: 1.5,
              maxWidth: "260px",
            }}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md font-medium text-white transition-all hover:brightness-110 active:brightness-90"
            style={{
              background: "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)",
              boxShadow:
                "0 1px 3px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
              fontSize: "13px",
              padding: "6px 20px",
              minWidth: "120px",
              letterSpacing: "-0.01em",
            }}
          >
            Go to Desktop
          </Link>
        </div>
      </div>
    </div>
  );
}
