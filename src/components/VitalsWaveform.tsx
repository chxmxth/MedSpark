import { useEffect, useRef } from "react";

interface WaveformProps {
  heartRate: number;
  breathingRate: number;
}

export default function VitalsWaveform({ heartRate, breathingRate }: WaveformProps) {
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const spo2CanvasRef = useRef<HTMLCanvasElement>(null);
  const respCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 1. ECG ANIMATION
    const ecgCanvas = ecgCanvasRef.current;
    if (!ecgCanvas) return;
    const ecgCtx = ecgCanvas.getContext("2d");
    if (!ecgCtx) return;

    let ecgAnimationId: number;
    let ecgX = 0;
    const ecgPoints: number[] = new Array(ecgCanvas.width).fill(50);

    const drawEcg = () => {
      const width = ecgCanvas.width;
      const height = ecgCanvas.height;
      ecgCtx.clearRect(0, 0, width, height);

      // Draw Grid lines
      ecgCtx.strokeStyle = "rgba(16, 185, 129, 0.08)";
      ecgCtx.lineWidth = 1;
      for (let i = 0; i < width; i += 15) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(i, 0);
        ecgCtx.lineTo(i, height);
        ecgCtx.stroke();
      }
      for (let i = 0; i < height; i += 15) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(0, i);
        ecgCtx.lineTo(width, i);
        ecgCtx.stroke();
      }

      // Procedural ECG segment calculation
      // Calculate cycle length based on HR (cycles per minute)
      // heartRate of 60 is 1 cycle/sec (60 FPS equals 60 steps)
      const fps = 60;
      const cycleLength = (fps * 60) / heartRate;
      const posInCycle = ecgX % cycleLength;

      let val = height / 2; // Baseline

      // P wave
      if (posInCycle > cycleLength * 0.1 && posInCycle < cycleLength * 0.2) {
        const pProgress = (posInCycle - cycleLength * 0.1) / (cycleLength * 0.1);
        val -= Math.sin(pProgress * Math.PI) * 4;
      }
      // PR segment flat line
      // QRS complex
      else if (posInCycle >= cycleLength * 0.25 && posInCycle < cycleLength * 0.27) {
        // Q wave dip
        val += 3;
      } else if (posInCycle >= cycleLength * 0.27 && posInCycle < cycleLength * 0.31) {
        // R wave peak
        const rProgress = (posInCycle - cycleLength * 0.27) / (cycleLength * 0.04);
        val -= Math.sin(rProgress * Math.PI) * 32;
      } else if (posInCycle >= cycleLength * 0.31 && posInCycle < cycleLength * 0.34) {
        // S wave dip
        const sProgress = (posInCycle - cycleLength * 0.31) / (cycleLength * 0.03);
        val += Math.sin(sProgress * Math.PI) * 8;
      }
      // ST segment flat line
      // T wave
      else if (posInCycle > cycleLength * 0.45 && posInCycle < cycleLength * 0.6) {
        const tProgress = (posInCycle - cycleLength * 0.45) / (cycleLength * 0.15);
        val -= Math.sin(tProgress * Math.PI) * 6;
      }

      ecgPoints.push(val);
      if (ecgPoints.length > width) {
        ecgPoints.shift();
      }

      // Draw Path
      ecgCtx.strokeStyle = "#10B981"; // Lead II Emerald Green
      ecgCtx.lineWidth = 1.8;
      ecgCtx.beginPath();
      for (let i = 0; i < ecgPoints.length; i++) {
        if (i === 0) ecgCtx.moveTo(i, ecgPoints[i]);
        else ecgCtx.lineTo(i, ecgPoints[i]);
      }
      ecgCtx.stroke();

      // Current scanner blip drawing
      ecgCtx.fillStyle = "#34D399";
      ecgCtx.beginPath();
      ecgCtx.arc(ecgPoints.length - 1, ecgPoints[ecgPoints.length - 1], 3.5, 0, Math.PI * 2);
      ecgCtx.fill();

      ecgX++;
      ecgAnimationId = requestAnimationFrame(drawEcg);
    };

    drawEcg();

    return () => cancelAnimationFrame(ecgAnimationId);
  }, [heartRate]);

  useEffect(() => {
    // 2. SpO2 ANIMATION (Arterial PPG)
    const spo2Canvas = spo2CanvasRef.current;
    if (!spo2Canvas) return;
    const spo2Ctx = spo2Canvas.getContext("2d");
    if (!spo2Ctx) return;

    let spo2AnimationId: number;
    let spo2X = 0;
    const spo2Points: number[] = new Array(spo2Canvas.width).fill(50);

    const drawSpo2 = () => {
      const width = spo2Canvas.width;
      const height = spo2Canvas.height;
      spo2Ctx.clearRect(0, 0, width, height);

      // Draw Grid lines
      spo2Ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      spo2Ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 15) {
        spo2Ctx.beginPath();
        spo2Ctx.moveTo(i, 0);
        spo2Ctx.lineTo(i, height);
        spo2Ctx.stroke();
      }
      for (let i = 0; i < height; i += 15) {
        spo2Ctx.beginPath();
        spo2Ctx.moveTo(0, i);
        spo2Ctx.lineTo(width, i);
        spo2Ctx.stroke();
      }

      const fps = 60;
      const cycleLength = (fps * 60) / heartRate;
      const posInCycle = spo2X % cycleLength;

      let val = height / 2;

      // Pulsatile curve with dicrotic notch
      if (posInCycle < cycleLength * 0.4e0) {
        // Systolic pulse rise
        const progress = posInCycle / (cycleLength * 0.4);
        val -= Math.sin(progress * Math.PI) * 20;
      } else if (posInCycle >= cycleLength * 0.4 && posInCycle < cycleLength * 0.55) {
        // Dicrotic notch notch
        const progress = (posInCycle - cycleLength * 0.4) / (cycleLength * 0.15);
        val -= 10 - Math.sin(progress * Math.PI) * 4;
      } else {
        // Diastolic runoff
        const progress = (posInCycle - cycleLength * 0.55) / (cycleLength * 0.45);
        val -= 8 * (1 - progress);
      }

      spo2Points.push(val);
      if (spo2Points.length > width) {
        spo2Points.shift();
      }

      // Draw Path
      spo2Ctx.strokeStyle = "#38BDF8"; // Cyan blue SpO2
      spo2Ctx.lineWidth = 1.8;
      spo2Ctx.beginPath();
      for (let i = 0; i < spo2Points.length; i++) {
        if (i === 0) spo2Ctx.moveTo(i, spo2Points[i]);
        else spo2Ctx.lineTo(i, spo2Points[i]);
      }
      spo2Ctx.stroke();

      // Current scanner blip drawing
      spo2Ctx.fillStyle = "#7DD3FC";
      spo2Ctx.beginPath();
      spo2Ctx.arc(spo2Points.length - 1, spo2Points[spo2Points.length - 1], 3.5, 0, Math.PI * 2);
      spo2Ctx.fill();

      spo2X++;
      spo2AnimationId = requestAnimationFrame(drawSpo2);
    };

    drawSpo2();

    return () => cancelAnimationFrame(spo2AnimationId);
  }, [heartRate]);

  useEffect(() => {
    // 3. RESPIRATORY CYCLE ANIMATION
    const respCanvas = respCanvasRef.current;
    if (!respCanvas) return;
    const respCtx = respCanvas.getContext("2d");
    if (!respCtx) return;

    let respAnimationId: number;
    let respX = 0;
    const respPoints: number[] = new Array(respCanvas.width).fill(30);

    const drawResp = () => {
      const width = respCanvas.width;
      const height = respCanvas.height;
      respCtx.clearRect(0, 0, width, height);

      // Draw Grid lines
      respCtx.strokeStyle = "rgba(251, 191, 36, 0.08)";
      respCtx.lineWidth = 1;
      for (let i = 0; i < width; i += 15) {
        respCtx.beginPath();
        respCtx.moveTo(i, 0);
        respCtx.lineTo(i, height);
        respCtx.stroke();
      }
      for (let i = 0; i < height; i += 15) {
        respCtx.beginPath();
        respCtx.moveTo(0, i);
        respCtx.lineTo(width, i);
        respCtx.stroke();
      }

      const fps = 60;
      // Inhales and exhales
      const cycleLength = (fps * 60) / breathingRate;
      const posInCycle = respX % cycleLength;
      const progress = posInCycle / cycleLength;

      // Pure smooth lung respiration curve (sinusoidal)
      const val = height / 2 - Math.sin(progress * Math.PI * 2) * 14;

      respPoints.push(val);
      if (respPoints.length > width) {
        respPoints.shift();
      }

      // Draw Path
      respCtx.strokeStyle = "#F59E0B"; // Amber warning / pulmonary
      respCtx.lineWidth = 1.8;
      respCtx.beginPath();
      for (let i = 0; i < respPoints.length; i++) {
        if (i === 0) respCtx.moveTo(i, respPoints[i]);
        else respCtx.lineTo(i, respPoints[i]);
      }
      respCtx.stroke();

      // Current scanner blip drawing
      respCtx.fillStyle = "#FBBF24";
      respCtx.beginPath();
      respCtx.arc(respPoints.length - 1, respPoints[respPoints.length - 1], 3.5, 0, Math.PI * 2);
      respCtx.fill();

      respX++;
      respAnimationId = requestAnimationFrame(drawResp);
    };

    drawResp();

    return () => cancelAnimationFrame(respAnimationId);
  }, [breathingRate]);

  return (
    <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-4 shadow-inner flex flex-col gap-4 text-xs font-mono select-none">
      {/* ECG */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-emerald-400 font-semibold px-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            ECG LEAD II
          </span>
          <span className="text-slate-500">25 mm/s</span>
        </div>
        <div className="relative bg-slate-950/70 rounded-lg border border-slate-900 overflow-hidden h-[75px]">
          <canvas ref={ecgCanvasRef} width={400} height={75} className="w-full h-full block" />
        </div>
      </div>

      {/* SpO2 */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-sky-400 font-semibold px-1">
          <span>PLETH (SpO2)</span>
          <span className="text-slate-500">AV: 8</span>
        </div>
        <div className="relative bg-slate-950/70 rounded-lg border border-slate-900 overflow-hidden h-[75px]">
          <canvas ref={spo2CanvasRef} width={400} height={75} className="w-full h-full block" />
        </div>
      </div>

      {/* RESP */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-amber-500 font-semibold px-1">
          <span>RESP WINDOW</span>
          <span className="text-slate-500">1x</span>
        </div>
        <div className="relative bg-slate-950/70 rounded-lg border border-slate-900 overflow-hidden h-[75px]">
          <canvas ref={respCanvasRef} width={400} height={75} className="w-full h-full block" />
        </div>
      </div>
    </div>
  );
}
