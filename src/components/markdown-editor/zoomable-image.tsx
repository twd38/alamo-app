'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ZoomableImageProps = {
  src: string;
  alt?: string;
  className?: string;
};

type Point = { x: number; y: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ZoomableImage({
  src,
  alt = 'Image',
  className
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const initialDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const minScaleRef = useRef<number>(1);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState<number>(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const computeFitScale = useCallback(() => {
    const container = containerRef.current;
    const img = imageRef.current;
    if (!container || !img) return 1;
    const cw = container.clientWidth || 1;
    const ch = container.clientHeight || 1;
    const naturalWidth = img.naturalWidth || cw;
    const naturalHeight = img.naturalHeight || ch;
    const fit = Math.min(cw / naturalWidth, ch / naturalHeight);
    return isFinite(fit) && fit > 0 ? fit : 1;
  }, []);

  const applyFit = useCallback(() => {
    const fit = computeFitScale();
    minScaleRef.current = fit;
    initialScaleRef.current = fit;
    setScale(fit);
    setTranslate({ x: 0, y: 0 });
  }, [computeFitScale]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    if (img.complete) {
      applyFit();
    } else {
      img.onload = () => applyFit();
    }
    // Recompute on resize
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const fit = computeFitScale();
      const min = fit;
      minScaleRef.current = min;
      setScale((s) => Math.max(s, min));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [applyFit, computeFitScale]);

  const updatePointer = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const removePointer = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
  };

  const distanceBetween = (a: Point, b: Point) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updatePointer(e);
    if (pointersRef.current.size === 2) {
      // Start pinch gesture
      const [p1, p2] = Array.from(pointersRef.current.values());
      initialDistanceRef.current = distanceBetween(p1, p2);
      initialScaleRef.current = scale;
    } else if (pointersRef.current.size === 1) {
      setIsPanning(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    updatePointer(e);

    const points = Array.from(pointersRef.current.values());
    if (points.length === 2 && initialDistanceRef.current) {
      // Pinch zoom
      const newDistance = distanceBetween(points[0], points[1]);
      const factor = newDistance / initialDistanceRef.current;
      const min = minScaleRef.current;
      const nextScale = clamp(initialScaleRef.current * factor, min, 5);
      setScale(nextScale);
    } else if (points.length === 1 && scale > minScaleRef.current) {
      // Pan when zoomed in
      // Use movementX/Y for smoother panning where available
      const dx = (e as any).movementX ?? 0;
      const dy = (e as any).movementY ?? 0;
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    removePointer(e);
    if (pointersRef.current.size < 2) {
      initialDistanceRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      setIsPanning(false);
      // Snap back to fit when nearly reset
      if (scale <= minScaleRef.current * 1.01) {
        setScale(minScaleRef.current);
        setTranslate({ x: 0, y: 0 });
      }
    }
  };

  const onWheel = useCallback((e: React.WheelEvent) => {
    // Support pinch-to-zoom on trackpads (ctrl+wheel) and normal wheel zoom
    if (!e.ctrlKey && Math.abs(e.deltaY) < 50) return;
    if (e.cancelable) e.preventDefault();
    const delta = -e.deltaY;
    const step = delta > 0 ? 0.1 : -0.1;
    setScale((s) => clamp(s + step, minScaleRef.current, 5));
  }, []);

  const reset = () => {
    const min = minScaleRef.current;
    setScale(min);
    setTranslate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden select-none touch-none flex items-center justify-center',
        isPanning ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={reset}
      onClick={(e) => e.stopPropagation()}
      role="img"
      aria-label={alt}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        draggable={false}
        className="pointer-events-none block max-w-none select-none"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center'
        }}
      />
    </div>
  );
}
