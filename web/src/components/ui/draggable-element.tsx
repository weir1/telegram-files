import React, { useRef, useState } from "react";
import { DndContext, type DragEndEvent, useDraggable } from "@dnd-kit/core";
import { Portal } from "@radix-ui/react-portal";
import { cn } from "@/lib/utils";

interface DraggableElementProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  longPressTime?: number; // 长按触发拖拽的时间 (ms)
}

const DraggableContent = ({
  children,
  className = "",
  style,
  onTap,
  longPressTime = 300,
}: DraggableElementProps & { style: React.CSSProperties }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: "draggable-element",
    });

  const touchStartTime = useRef<number>(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const [isLongPress, setIsLongPress] = useState(false);

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartTime.current = Date.now();
    touchStartPos.current = {
      x: e.touches[0]!.clientX,
      y: e.touches[0]!.clientY,
    };

    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
    }, longPressTime);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    clearTimeout(longPressTimer.current);

    if (touchStartPos.current) {
      const touchEndX = e.changedTouches[0]!.clientX;
      const touchEndY = e.changedTouches[0]!.clientY;
      const deltaX = Math.abs(touchEndX - touchStartPos.current.x);
      const deltaY = Math.abs(touchEndY - touchStartPos.current.y);
      const touchDuration = Date.now() - touchStartTime.current;

      // 如果移动距离小于阈值且不是长按，则视为点击
      if (
        deltaX < 5 &&
        deltaY < 5 &&
        touchDuration < longPressTime &&
        !isLongPress
      ) {
        onTap?.();
      }
    }

    setIsLongPress(false);
    touchStartPos.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPos.current) {
      const deltaX = Math.abs(e.touches[0]!.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(e.touches[0]!.clientY - touchStartPos.current.y);

      // 如果移动距离超过阈值，取消长按计时
      if (deltaX > 5 || deltaY > 5) {
        clearTimeout(longPressTimer.current);
      }
    }
  };

  const preventContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      {...(isLongPress ? listeners : {})}
      {...attributes}
      className={cn(
        `fixed touch-none select-none`,
        isDragging && "opacity-80",
        isLongPress && "cursor-grabbing",
        className,
      )}
      style={{
        ...style,
        ...transformStyle,
        touchAction: "none",
        WebkitUserSelect: "none", // 禁用文本选择
        WebkitTouchCallout: "none", // 禁用触摸回调
        userSelect: "none",
      }}
      onContextMenu={preventContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div
        className={`relative ${isLongPress ? "scale-105 transition-transform" : ""}`}
      >
        {children}
      </div>
      {isLongPress && (
        <div className="absolute inset-0 animate-pulse rounded-lg bg-black/5" />
      )}
    </div>
  );
};

const DraggableElement = (props: DraggableElementProps) => {
  const [position, setPosition] = useState({
    x: window.innerWidth - 60,
    y: window.innerHeight - 60,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;

    setPosition((prev) => {
      const newX = Math.max(
        0,
        Math.min(prev.x + delta.x, window.innerWidth - 40),
      );
      const newY = Math.max(
        0,
        Math.min(prev.y + delta.y, window.innerHeight - 40),
      );
      return { x: newX, y: newY };
    });
  };

  const style: React.CSSProperties = {
    top: position.y,
    left: position.x,
  };

  return (
    <Portal>
      <DndContext onDragEnd={handleDragEnd}>
        <div id="draggable-content">
          <DraggableContent {...props} style={style} />
        </div>
      </DndContext>
    </Portal>
  );
};

export default DraggableElement;
