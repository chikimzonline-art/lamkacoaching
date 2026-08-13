"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useWindowSize } from "react-use";

export function ReceiptActions({ backLink, backText }: { backLink: string; backText: string }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize();

  useEffect(() => {
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {showConfetti && (
        <Confetti 
          width={width} 
          height={height} 
          recycle={false} 
          numberOfPieces={400} 
          gravity={0.15}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100 }}
        />
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8 no-print">
        <Button 
          onClick={handlePrint} 
          variant="outline" 
          size="lg"
          className="w-full sm:w-auto border-emerald-200 hover:bg-emerald-50 text-emerald-700 gap-2 h-12 rounded-xl font-semibold"
        >
          <Printer className="h-5 w-5" />
          Print Receipt
        </Button>
        <Button 
          onClick={handlePrint}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 rounded-xl font-semibold shadow-md shadow-emerald-500/20"
          size="lg"
        >
          <Download className="h-5 w-5" />
          Save as PDF
        </Button>
      </div>
      
      <div className="flex justify-center mt-8 no-print">
        <Link href={backLink} className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {backText}
        </Link>
      </div>
    </>
  );
}
