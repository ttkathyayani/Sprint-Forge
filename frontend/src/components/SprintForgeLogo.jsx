import React from "react";
import logoImg from "@/assets/logo.png";
import logoMarkImg from "@/assets/logo-mark.png";

export default function SprintForgeLogo({
  size = "md",
  compact = false,
  showText = true,
  className = "",
  subtitle = null,
}) {
  const heightMap = {
    xs: "h-6",
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-16",
  };

  const currentHeight = heightMap[size] || heightMap.md;

  if (compact) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src={logoMarkImg}
          alt="Sprint-Forge"
          className={`${currentHeight} w-auto object-contain rounded-lg`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={logoImg}
        alt="Sprint-Forge"
        className={`${currentHeight} w-auto object-contain`}
      />
      {subtitle && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#5B675A] border-l border-[#EADBCC] pl-2 -ml-1">
          {subtitle}
        </span>
      )}
    </div>
  );
}
