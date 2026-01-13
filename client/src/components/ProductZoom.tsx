import { useState, useRef, MouseEvent } from "react";

interface ProductZoomProps {
  src: string;
  alt: string;
}

export function ProductZoom({ src, alt }: ProductZoomProps) {
  const [showZoom, setShowZoom] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;

    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setPosition({ x, y });
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden cursor-zoom-in"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="w-full h-full object-contain p-4"
      />
      
      {showZoom && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none bg-white"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundSize: "250%",
            backgroundRepeat: "no-repeat"
          }}
        />
      )}
    </div>
  );
}
