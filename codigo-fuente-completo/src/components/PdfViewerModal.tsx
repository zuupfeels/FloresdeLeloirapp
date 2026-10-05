import React, { useState, useEffect } from 'react';
import { GeneratedDocument } from '../utils/pdfGenerator';
import { FormatoFinal, AlumnoData } from '../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import {
  X,
  Download,
  Printer,
  FileText,
  FileCheck2,
  FolderArchive,
  Layers,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
  RefreshCw,
} from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  unificadoBytes: Uint8Array | null;
  individuales: GeneratedDocument[];
  formato: FormatoFinal;
  alumno: AlumnoData;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  unificadoBytes: initialUnificadoBytes,
  individuales,
  formato,
  alumno,
}) => {
  const [orderedDocs, setOrderedDocs] = useState<GeneratedDocument[]>(individuales);
  const [currentUnificadoBytes, setCurrentUnificadoBytes] = useState<Uint8Array | null>(initialUnificadoBytes);
  const [selectedDocId, setSelectedDocId] = useState<string>('unificado');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setOrderedDocs(individuales);
    setCurrentUnificadoBytes(initialUnificadoBytes);
  }, [individuales, initialUnificadoBytes]);

  // Update preview URL when selected doc changes
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    let blob: Blob | null = null;

    if (selectedDocId === 'unificado' && currentUnificadoBytes) {
      blob = new Blob([currentUnificadoBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    } else {
      const doc = orderedDocs.find((d) => d.id === selectedDocId);
      if (doc) {
        blob = doc.blob;
      } else if (currentUnificadoBytes) {
        blob = new Blob([currentUnificadoBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      }
    }

    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [isOpen, selectedDocId, currentUnificadoBytes, orderedDocs]);

  if (!isOpen) return null;

  // Re-merge PDF when order changes
  const reMergeDocuments = async (newOrder: GeneratedDocument[]) => {
    setIsReordering(true);
    try {
      const mergedDoc = await PDFDocument.create();

      // Cover Page
      const coverPage = mergedDoc.addPage([595.28, 841.89]);
      const fontBold = await mergedDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await mergedDoc.embedFont(StandardFonts.Helvetica);
      const { width, height } = coverPage.getSize();
      const margin = 40;

      coverPage.drawRectangle({
        x: margin,
        y: height - 120,
        width: width - margin * 2,
        height: 80,
        color: rgb(0.12, 0.28, 0.16),
      });

      coverPage.drawText('ESCUELA DE EDUCACIÓN ESPECIAL', {
        x: margin + 20,
        y: height - 70,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      coverPage.drawText('LEGAJO ANUAL OFICIAL DE COBERTURA Y PRESTACIONES', {
        x: margin + 20,
        y: height - 90,
        size: 9,
        font: fontRegular,
        color: rgb(0.85, 0.95, 0.85),
      });

      // Box Alumno
      coverPage.drawRectangle({
        x: margin,
        y: height - 260,
        width: width - margin * 2,
        height: 120,
        borderColor: rgb(0.2, 0.4, 0.25),
        borderWidth: 1.5,
        color: rgb(0.97, 0.99, 0.97),
      });

      coverPage.drawText(`ALUMNO/A: ${alumno.apellidoNombre.toUpperCase()}`, {
        x: margin + 18,
        y: height - 170,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.25, 0.15),
      });

      coverPage.drawText(`DNI: ${alumno.dni}   |   AFILIADO N°: ${alumno.numAfiliado}`, {
        x: margin + 18,
        y: height - 190,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });

      coverPage.drawText(`DIAGNÓSTICO: ${alumno.diagnostico}`, {
        x: margin + 18,
        y: height - 210,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });

      coverPage.drawText(`ESCUELA COMÚN: ${alumno.escuelaComun} (${alumno.grado})`, {
        x: margin + 18,
        y: height - 230,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Index with new order
      coverPage.drawText('ÍNDICE DE DOCUMENTACIÓN EN ESTE LEGAJO (ORDEN SELECCIONADO):', {
        x: margin + 10,
        y: height - 300,
        size: 9.5,
        font: fontBold,
        color: rgb(0.15, 0.3, 0.18),
      });

      let curY = height - 325;
      newOrder.forEach((doc, idx) => {
        coverPage.drawText(`${idx + 1}. ${doc.nombre.replace('.pdf', '')}`, {
          x: margin + 20,
          y: curY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
        curY -= 18;
      });

      // Copy pages in the specified order!
      for (const doc of newOrder) {
        const subDoc = await PDFDocument.load(doc.pdfBytes);
        const copiedPages = await mergedDoc.copyPages(subDoc, subDoc.getPageIndices());
        copiedPages.forEach((p) => mergedDoc.addPage(p));
      }

      const newBytes = await mergedDoc.save();
      setCurrentUnificadoBytes(newBytes);
      if (selectedDocId === 'unificado') {
        const blob = new Blob([newBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error('Error re-merging documents:', err);
    } finally {
      setIsReordering(false);
    }
  };

  // Move document up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedDocs];
    const item = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = item;
    setOrderedDocs(newOrder);
    reMergeDocuments(newOrder);
  };

  // Move document down
  const handleMoveDown = (index: number) => {
    if (index === orderedDocs.length - 1) return;
    const newOrder = [...orderedDocs];
    const item = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = item;
    setOrderedDocs(newOrder);
    reMergeDocuments(newOrder);
  };

  // Download current doc
  const handleDownloadCurrent = () => {
    if (!previewUrl) return;

    let filename = `Legajo_Completo_${alumno.apellidoNombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    if (selectedDocId !== 'unificado') {
      const doc = orderedDocs.find((d) => d.id === selectedDocId);
      if (doc) filename = doc.nombre;
    }

    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (orderedDocs.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folderName = `Legajo_${alumno.apellidoNombre.replace(/[^a-zA-Z0-9]/g, '_')}_DNI_${alumno.dni.replace(/\D/g, '')}`;
      const folder = zip.folder(folderName);

      if (currentUnificadoBytes && folder) {
        folder.file('00_LEGAJO_COMPLETO_UNIFICADO.pdf', currentUnificadoBytes);
      }

      for (const doc of orderedDocs) {
        if (folder) {
          folder.file(doc.nombre, doc.pdfBytes);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al generar archivo ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-gray-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-800 rounded text-emerald-200">
              <FileCheck2 className="w-5 h-5 text-emerald-300" />
            </span>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Visor y Ensamblador de Legajo</span>
                <span className="text-xs bg-emerald-700/80 px-2 py-0.5 rounded font-normal text-emerald-100">
                  {alumno.apellidoNombre} • DNI {alumno.dni}
                </span>
              </h2>
              <p className="text-[11px] text-emerald-200">
                Arrastrá o reordená los archivos con las flechas para definir el orden en el PDF UNIFICADO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-medium transition"
              title="Imprimir documento actual"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownloadCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold shadow-sm transition"
              title="Descargar documento actual"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-sm transition"
              title="Descargar todos los archivos juntos en un ZIP comprimido"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Comprimiendo...' : 'Descargar ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body with Sidebar list and PDF Preview */}
        <div className="flex-1 flex overflow-hidden bg-gray-100">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>ORDEN DEL LEGAJO UNIFICADO</span>
              {isReordering && (
                <span className="text-[10px] text-emerald-700 font-normal flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Re-ensamblando...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
              {/* Option: PDF UNIFICADO */}
              {currentUnificadoBytes && (
                <button
                  type="button"
                  onClick={() => setSelectedDocId('unificado')}
                  className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between mb-2 ${
                    selectedDocId === 'unificado'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-400'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <div className="text-xs">PDF UNIFICADO COMPLETO</div>
                      <div className="text-[10px] text-emerald-700 font-normal">
                        Ver resultado final según el orden de abajo
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}

              {/* Individual Documents with reorder buttons */}
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 pt-1 pb-1 flex items-center justify-between">
                <span>Elegir orden de unión:</span>
                <span className="text-gray-400">Usá ▲ ▼ para mover</span>
              </div>

              {orderedDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`w-full p-2 rounded-md border transition flex items-center justify-between gap-1.5 ${
                    selectedDocId === doc.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {/* Position badge */}
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>

                  {/* Doc Name (clickable to preview) */}
                  <button
                    type="button"
                    onClick={() => setSelectedDocId(doc.id)}
                    className="flex-1 text-left truncate cursor-pointer hover:text-emerald-800"
                    title={`Ver ${doc.nombre}`}
                  >
                    <span className="truncate text-[11px] block">{doc.nombre}</span>
                  </button>

                  {/* Up / Down reordering buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      className="p-1 hover:bg-gray-200 disabled:opacity-30 rounded text-gray-600 disabled:cursor-not-allowed"
                      title="Subir de posición en el legajo"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={idx === orderedDocs.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      className="p-1 hover:bg-gray-200 disabled:opacity-30 rounded text-gray-600 disabled:cursor-not-allowed"
                      title="Bajar de posición en el legajo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 text-center">
              💡 Cambiá el orden con las flechas y el PDF Unificado se recompone automáticamente.
            </div>
          </div>

          {/* PDF Viewer Area */}
          <div className="flex-1 p-3 flex flex-col items-center justify-center bg-gray-200">
            {previewUrl ? (
              <iframe
                id="pdf-preview-iframe"
                src={`${previewUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full rounded border border-gray-300 shadow-sm bg-white"
                title="Vista previa del documento PDF"
              />
            ) : (
              <div className="text-center p-8 text-gray-500">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs">Cargando visor PDF...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
