import React, { useState, useRef, useEffect } from 'react'
import { Minimize2, Maximize2, Eye, EyeOff, Copy, Move, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DebugPanel({
  data,
  title = 'Debug Panel',
  classNames,
}: {
  data: { [key: string]: any }
  title?: string
  classNames?: {
    panel?: string
    header?: string
    content?: string
    button?: string
  }
}) {
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [size, setSize] = useState({ width: 450, height: 350 })
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startX: 0, startY: 0 })
  const [copySuccess, setCopySuccess] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)

  // Simple drag handlers
  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y,
    })
    e.preventDefault()
  }

  const startResize = (e: React.MouseEvent) => {
    setIsResizing(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      startX: size.width,
      startY: size.height,
    })
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, dragStart.startX + deltaX)),
          y: Math.max(0, Math.min(window.innerHeight - 100, dragStart.startY + deltaY)),
        })
      }

      if (isResizing && !isMaximized) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        setSize({
          width: Math.max(300, Math.min(window.innerWidth - position.x, dragStart.startX + deltaX)),
          height: Math.max(200, Math.min(window.innerHeight - position.y, dragStart.startY + deltaY)),
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, position, size, isMaximized])

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    setIsMaximized(false)
  }

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
    setIsMinimized(false)
  }

  const resetPanel = () => {
    setPosition({ x: 20, y: 20 })
    setSize({ width: 450, height: 350 })
    setIsMinimized(false)
    setIsMaximized(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={cn(
          'fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-all hover:scale-110',
          classNames?.button
        )}
        title="Show Debug Panel"
      >
        <Eye size={20} />
      </button>
    )
  }

  const panelStyle = isMaximized
    ? {
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        transform: 'none',
      }
    : isMinimized
    ? {
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: size.width,
        height: 42,
      }
    : {
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: size.width,
        height: size.height,
      }

  return (
    <div
      ref={panelRef}
      className={cn(
        `fixed top-0 left-0 bg-slate-900 border border-slate-700 shadow-2xl z-50 flex flex-col overflow-hidden ${
          isMaximized ? 'rounded-none' : 'rounded-lg'
        } ${isDragging ? 'select-none' : ''}`,
        classNames?.panel
      )}
      style={panelStyle}
    >
      {/* Header Bar */}
      <div
        className={cn(
          `bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700 min-h-[42px] select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`,
          classNames?.header
        )}
        onMouseDown={startDrag}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-none">
          <Move size={14} className="text-slate-500 flex-shrink-0" />
          <span className="text-slate-200 text-sm font-medium truncate">{title}</span>
          {copySuccess && <span className="text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded">Copied!</span>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 pointer-events-auto">
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy JSON to clipboard"
          >
            <Copy size={14} />
          </button>

          <button
            onClick={resetPanel}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset position and size"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={toggleMinimize}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title={isMinimized ? 'Restore' : 'Minimize'}
          >
            <Minimize2 size={14} />
          </button>

          <button
            onClick={toggleMaximize}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Maximize2 size={14} />
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
            title="Hide panel"
          >
            <EyeOff size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-auto bg-slate-950">
            <pre className="text-slate-300 text-sm p-4 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

          {/* Resize Handle */}
          {!isMaximized && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={startResize}
              style={{
                background: 'linear-gradient(-45deg, transparent 30%, #64748b 30%, #64748b 70%, transparent 70%)',
              }}
              title="Drag to resize"
            />
          )}
        </>
      )}
    </div>
  )
}
