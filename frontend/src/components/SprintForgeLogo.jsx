import React from "react";
import logoImg from "@/assets/logo.png";

export default function SprintForgeLogo({
  size = "md",
  showText = true,
  className = "",
  subtitle = null,
}) {
  const sizeMap = {
    xs: { img: "w-5 h-5", text: "text-base", badge: "text-[9px] px-1" },
    sm: { img: "w-7 h-7", text: "text-lg", badge: "text-[10px] px-1.5" },
    md: { img: "w-8 h-8", text: "text-xl", badge: "text-[10px] px-1.5" },
    lg: { img: "w-10 h-10", text: "text-2xl", badge: "text-xs px-2" },
    xl: { img: "w-12 h-12", text: "text-3xl", badge: "text-xs px-2" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src={logoImg}
          alt="SprintForge Logo"
          className={`${currentSize.img} rounded-xl object-cover shadow-xs border border-[#E8E2D7] bg-[#FAF8F4]`}
          onError={(e) => {
            // Fallback to SVG if image fails
            e.target.style.display = "none";
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-display font-bold tracking-tight text-[#252830] ${currentSize.text}`}>
              SprintForge
            </span>
            <span className={`font-mono uppercase font-semibold text-[#552F8E] bg-[#F2EBFA] border border-[#D8C7F5] rounded-md ${currentSize.badge}`}>
              AI
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] font-mono text-[#8A92A0] uppercase tracking-wider -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
