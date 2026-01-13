import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function CartTimer() {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos

  useEffect(() => {
    // Tentar recuperar tempo salvo no sessionStorage
    const savedTime = sessionStorage.getItem("cartTimer");
    if (savedTime) {
      const parsedTime = parseInt(savedTime, 10);
      // Se o tempo salvo for válido e maior que 0, usar ele
      if (!isNaN(parsedTime) && parsedTime > 0) {
        setTimeLeft(parsedTime);
      }
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        sessionStorage.setItem("cartTimer", newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (timeLeft <= 0) return null;

  return (
    <div className="bg-pink-50 border border-pink-100 rounded-lg p-3 mb-6 flex items-center justify-center gap-2 text-pink-900 animate-in fade-in slide-in-from-top-4 duration-500">
      <Clock className="w-5 h-5 text-pink-600 animate-pulse" />
      <p className="font-medium text-sm sm:text-base">
        Seus produtos estão reservados por <span className="font-bold text-pink-600 font-mono text-lg mx-1">{formatTime(timeLeft)}</span> minutos.
      </p>
    </div>
  );
}
