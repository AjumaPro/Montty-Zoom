import React, { useRef, useEffect, useState } from 'react';
import { HiXMark, HiPencil, HiTrash } from 'react-icons/hi2';
import './ScreenAnnotation.css';

function ScreenAnnotation({ isOpen, onClose, screenStream }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Set drawing styles
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    return () => {
      // Cleanup
    };
  }, [isOpen, color, lineWidth]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!isOpen || !screenStream) return null;

  return (
    <div className="screen-annotation-overlay">
      <div className="annotation-controls">
        <div className="annotation-tools">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-picker"
          />
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="width-slider"
          />
          <button onClick={clearCanvas} className="annotation-btn">
            <HiTrash /> Clear
          </button>
          <button onClick={onClose} className="annotation-btn close-btn">
            <HiXMark /> Close
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="annotation-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          canvasRef.current.dispatchEvent(mouseEvent);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          canvasRef.current.dispatchEvent(mouseEvent);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          const mouseEvent = new MouseEvent('mouseup', {});
          canvasRef.current.dispatchEvent(mouseEvent);
        }}
      />
    </div>
  );
}

export default ScreenAnnotation;

