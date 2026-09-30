import Image from "next/image";

export function BrandMark({ variant = "color" }: { variant?: "color" | "white" }) {
  const src = variant === "white" ? "/brand/wellsphere-logo-white.svg" : "/brand/wellsphere-logo.svg";
  return (
    <Image
      src={src}
      alt="WellSphere LATAM"
      width={150}
      height={41}
      priority
      style={{ height: "auto" }}
    />
  );
}
