import React, { useRef, useEffect, useState } from 'react';
import './Whiteboard.css';

const Whiteboard = ({ socket, roomId, userId, isOpen, onClose }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);

  const drawLine = (x0, y0, x1, y1, drawColor, drawWidth) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  useEffect(() => {
    if (!canvasRef.current || !socket || !isOpen) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!container) {
      console.warn('Whiteboard container not found');
      return;
    }
    
    // Wait for container to be rendered
    const resizeCanvas = () => {
      if (container && canvas) {
        const rect = container.getBoundingClientRect();
        console.log('Resizing canvas:', { width: rect.width, height: rect.height });
        
        if (rect.width > 0 && rect.height > 0) {
          const headerHeight = 60;
          const canvasWidth = rect.width;
          const canvasHeight = rect.height - headerHeight;
          
          // Set canvas dimensions
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          console.log('Canvas dimensions set:', { width: canvas.width, height: canvas.height });
          
          // Set canvas context properties
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            console.log('Canvas context initialized');
          }
        } else {
          console.warn('Container has zero dimensions:', rect);
        }
      }
    };

    // Initial resize with multiple attempts
    resizeCanvas();
    const timeoutId1 = setTimeout(resizeCanvas, 50);
    const timeoutId2 = setTimeout(resizeCanvas, 100);
    const timeoutId3 = setTimeout(resizeCanvas, 200);
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Use ResizeObserver for better performance
    let resizeObserver;
    if (container && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      resizeObserver.observe(container);
    }

    const handleDraw = (data) => {
      if (data.userId === userId) return;
      console.log('Received draw event:', data);
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log('Canvas cleared');
      }
    };

    socket.on('whiteboard-draw', handleDraw);
    socket.on('whiteboard-clear', handleClear);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      socket.off('whiteboard-draw', handleDraw);
      socket.off('whiteboard-clear', handleClear);
      window.removeEventListener('resize', resizeCanvas);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [socket, userId, color, lineWidth, isOpen]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getTouchPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return { x: 0, y: 0 };
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const pos = getMousePos(e);
    console.log('Mouse down at:', pos);
    setIsDrawing(true);
    lastPosRef.current = pos;
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    const { x: x0, y: y0 } = lastPosRef.current;
    const { x: x1, y: y1 } = pos;

    console.log('Drawing line from', { x0, y0 }, 'to', { x1, y1 });
    drawLine(x0, y0, x1, y1, color, lineWidth);

    if (socket && roomId) {
      socket.emit('whiteboard-draw', {
        roomId,
        userId,
        x0,
        y0,
        x1,
        y1,
        color,
        lineWidth
      });
    }

    lastPosRef.current = pos;
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    setIsDrawing(true);
    lastPosRef.current = pos;
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const pos = getTouchPos(e);
    const { x: x0, y: y0 } = lastPosRef.current;
    const { x: x1, y: y1 } = pos;

    drawLine(x0, y0, x1, y1, color, lineWidth);

    if (socket && roomId) {
      socket.emit('whiteboard-draw', {
        roomId,
        userId,
        x0,
        y0,
        x1,
        y1,
        color,
        lineWidth
      });
    }

    lastPosRef.current = pos;
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) {
      socket.emit('whiteboard-clear', { roomId, userId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="whiteboard-panel" ref={containerRef}>
      <div className="whiteboard-header">
        <h3>Whiteboard</h3>
        <div className="whiteboard-controls">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-picker"
          />
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="line-width"
          />
          <span className="line-width-label">{lineWidth}px</span>
          <button onClick={clearCanvas} className="clear-btn">Clear</button>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default Whiteboard;

