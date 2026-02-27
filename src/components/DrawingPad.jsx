import React from 'react';

export function DrawingPad({ width = 600, height = 300, clearSignal = 0, onStrokeDataChange, onImageDataChange }) {
  const canvasRef = React.useRef(null);
  const isDrawingRef = React.useRef(false);
  const currentStrokeRef = React.useRef(null);
  const [strokes, setStrokes] = React.useState([]);
  const supportsPointerEvents = React.useMemo(
    () => typeof window !== 'undefined' && 'PointerEvent' in window,
    []
  );

  function emitImageData() {
    if (!onImageDataChange || !canvasRef.current) {
      return;
    }
    onImageDataChange(canvasRef.current.toDataURL('image/png'));
  }

  const clearDrawing = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    isDrawingRef.current = false;
    currentStrokeRef.current = null;
    setStrokes([]);
    if (onStrokeDataChange) {
      onStrokeDataChange([]);
    }
    emitImageData();
  }, [onStrokeDataChange, onImageDataChange]);

  React.useEffect(() => {
    clearDrawing();
  }, [clearDrawing]);

  React.useEffect(() => {
    clearDrawing();
  }, [clearSignal, clearDrawing]);

  function getPointFromClient(clientX, clientY) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      t: Date.now(),
    };
  }

  function drawDot(point) {
    const context = canvasRef.current.getContext('2d');
    context.fillStyle = '#111111';
    context.beginPath();
    context.arc(point.x, point.y, 1.8, 0, Math.PI * 2);
    context.fill();
  }

  function drawSegment(from, to) {
    const context = canvasRef.current.getContext('2d');
    context.strokeStyle = '#111111';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  function beginStroke(point) {
    isDrawingRef.current = true;
    currentStrokeRef.current = {
      id: `s_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      points: [point],
    };
    drawDot(point);
  }

  function appendPoint(point) {
    if (!isDrawingRef.current || !currentStrokeRef.current) {
      return;
    }
    const points = currentStrokeRef.current.points;
    const previousPoint = points[points.length - 1];
    points.push(point);
    drawSegment(previousPoint, point);
  }

  function endStroke() {
    if (!isDrawingRef.current || !currentStrokeRef.current) {
      return;
    }

    const completedStroke = currentStrokeRef.current;
    isDrawingRef.current = false;
    currentStrokeRef.current = null;

    setStrokes((current) => {
      const next = [...current, completedStroke];
      if (onStrokeDataChange) {
        onStrokeDataChange(next);
      }
      emitImageData();
      return next;
    });
  }

  function handlePointerDown(event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    beginStroke(getPointFromClient(event.clientX, event.clientY));
  }

  function handlePointerMove(event) {
    event.preventDefault();
    appendPoint(getPointFromClient(event.clientX, event.clientY));
  }

  function handleMouseDown(event) {
    beginStroke(getPointFromClient(event.clientX, event.clientY));
  }

  function handleMouseMove(event) {
    appendPoint(getPointFromClient(event.clientX, event.clientY));
  }

  function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    beginStroke(getPointFromClient(touch.clientX, touch.clientY));
  }

  function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    appendPoint(getPointFromClient(touch.clientX, touch.clientY));
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ touchAction: 'none' }}
      data-stroke-count={strokes.length}
      onPointerDown={supportsPointerEvents ? handlePointerDown : undefined}
      onPointerMove={supportsPointerEvents ? handlePointerMove : undefined}
      onPointerUp={supportsPointerEvents ? endStroke : undefined}
      onPointerCancel={supportsPointerEvents ? endStroke : undefined}
      onPointerLeave={supportsPointerEvents ? endStroke : undefined}
      onMouseDown={!supportsPointerEvents ? handleMouseDown : undefined}
      onMouseMove={!supportsPointerEvents ? handleMouseMove : undefined}
      onMouseUp={!supportsPointerEvents ? endStroke : undefined}
      onMouseLeave={!supportsPointerEvents ? endStroke : undefined}
      onTouchStart={!supportsPointerEvents ? handleTouchStart : undefined}
      onTouchMove={!supportsPointerEvents ? handleTouchMove : undefined}
      onTouchEnd={!supportsPointerEvents ? endStroke : undefined}
      onTouchCancel={!supportsPointerEvents ? endStroke : undefined}
    ></canvas>
  );
}
