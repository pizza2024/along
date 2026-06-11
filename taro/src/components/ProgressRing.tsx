import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { hexToRgb } from '@/utils/color';
import { tickProgress } from '@/hooks/useLongPress';

interface Props {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
}

export function ProgressRing({ size, strokeWidth, progress, color }: Props) {
  const canvasId = `ring-${Math.random().toString(36).slice(2, 9)}`;
  const nodeRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;
    const ctx = node.getContext('2d');
    if (!ctx) return;
    const dpr = 1;
    const w = size;
    const h = size;
    const r = (w - strokeWidth) / 2;
    const cx = w / 2;
    const cy = h / 2;
    const [rr, gg, bb] = hexToRgb(color);

    ctx.clearRect(0, 0, w * dpr, h * dpr);
    if (progress <= 0) return;
    const start = -Math.PI / 2;
    const end = start + 2 * Math.PI * Math.max(0, Math.min(1, progress));
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end, false);
    ctx.strokeStyle = `rgb(${rr},${gg},${bb})`;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [color, progress, size, strokeWidth]);

  useEffect(() => {
    const id = requestAnimationFrame(() => draw());
    rafRef.current = id as unknown as number;
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current as unknown as number);
        rafRef.current = null;
      }
    };
  }, [draw]);

  useEffect(() => {
    const query = Taro.createSelectorQuery();
    query
      .select(`#${canvasId}`)
      .node()
      .exec((res) => {
        const arr = (res && res[0]) as { node?: any } | undefined;
        if (arr && arr.node) {
          nodeRef.current = arr.node;
          draw();
        }
      });
  }, [canvasId, draw]);

  return (
    <Canvas
      type="2d"
      canvasId={canvasId}
      id={canvasId}
      style={{
        width: `${size}rpx`,
        height: `${size}rpx`,
        position: 'absolute',
        left: 0,
        top: 0,
      }}
    />
  );
}

export function __tickProgressForTest(elapsed: number, duration: number) {
  return tickProgress(elapsed, duration);
}
