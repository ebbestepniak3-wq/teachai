'use client'

import { useState, useCallback } from 'react'
import {
  ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight,
  X, Maximize2, Download, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DocumentPreviewProps {
  previewUrl: string
  fileName: string
  pageCount?: number
  fileType: string
  ocrText?: string
  onClose?: () => void
}

export function DocumentPreview({
  previewUrl, fileName, pageCount = 1, fileType, ocrText, onClose,
}: DocumentPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [showOcr, setShowOcr] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'

  const zoomIn = () => setZoom((z) => Math.min(200, z + 25))
  const zoomOut = () => setZoom((z) => Math.max(25, z - 25))
  const rotate = () => setRotation((r) => (r + 90) % 360)
  const resetView = () => { setZoom(100); setRotation(0) }

  const nextPage = () => setCurrentPage((p) => Math.min(pageCount, p + 1))
  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1))

  return (
    <div className={cn(
      'flex flex-col rounded-2xl border border-border bg-card overflow-hidden',
      fullscreen && 'fixed inset-4 z-50 shadow-2xl'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium truncate">{fileName}</p>
          {pageCount > 1 && (
            <Badge variant="outline" className="text-[10px] shrink-0">{pageCount} Seiten</Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <Button variant="ghost" size="icon-sm" onClick={zoomOut} disabled={zoom <= 25} title="Verkleinern">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <button
            onClick={resetView}
            className="min-w-[48px] rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
          >
            {zoom}%
          </button>
          <Button variant="ghost" size="icon-sm" onClick={zoomIn} disabled={zoom >= 200} title="Vergrößern">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Rotate */}
          <Button variant="ghost" size="icon-sm" onClick={rotate} title="Drehen">
            <RotateCw className="h-3.5 w-3.5" />
          </Button>

          {/* OCR toggle */}
          {ocrText && (
            <Button
              variant={showOcr ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowOcr(!showOcr)}
              className="text-xs"
            >
              OCR-Text
            </Button>
          )}

          {/* Download */}
          <a href={previewUrl} download={fileName}>
            <Button variant="ghost" size="icon-sm" title="Herunterladen">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </a>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setFullscreen(!fullscreen)}
            title="Vollbild"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>

          {onClose && (
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview area */}
        <div className="relative flex-1 overflow-auto bg-muted/20 flex items-start justify-center p-4">
          <div
            className="transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
          >
            {isImage ? (
              <img
                src={previewUrl}
                alt={fileName}
                className="max-w-full rounded-lg shadow-xl"
                style={{ maxHeight: '600px' }}
              />
            ) : isPdf ? (
              <iframe
                src={`${previewUrl}#page=${currentPage}`}
                className="w-full rounded-lg shadow-xl bg-white"
                style={{ width: '600px', height: '800px' }}
                title={`${fileName} Vorschau`}
              />
            ) : (
              <div className="flex h-64 w-64 flex-col items-center justify-center rounded-2xl border border-border bg-card text-center p-8">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vorschau nicht verfügbar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* OCR text panel */}
        {showOcr && ocrText && (
          <div className="w-72 shrink-0 border-l border-border overflow-y-auto">
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Erkannter Text
              </p>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed">
                {ocrText}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Page navigation */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-border py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Seite <strong>{currentPage}</strong> von <strong>{pageCount}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
