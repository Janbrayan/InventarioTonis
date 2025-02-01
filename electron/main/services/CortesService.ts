// src/electron/services/CortesService.ts

import db from '../db';
import fs from 'fs';
import path from 'path';
import * as os from 'os';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';

export interface CorteData {
  id: number;
  fechaCorte: string;
  fechaInicio: string;
  fechaFin: string;
  totalVentas: number;
  totalDescuentos: number;
  netoVentas: number;
  totalEgresos: number;
  saldoFinal: number;
  usuarioId?: number | null;
  observaciones?: string;
}

interface VentasRow {
  totalVentas: number;
}
interface DescuentosRow {
  totalDescuentos: number;
}

/**
 * Crea un corte en la BD (mismo código sin cambios).
 */
export function createCorte(
  fechaInicio: string,
  fechaFin: string,
  usuarioId?: number,
  montoEgresos?: number,
  observaciones?: string
): CorteData {
  const formato = 'YYYY-MM-DD HH:mm:ss';
  const ahora = dayjs().format(formato);

  const rowVentas = db.prepare(`
    SELECT IFNULL(SUM(total), 0) AS totalVentas
    FROM sales
    WHERE fecha >= ? AND fecha <= ?
  `).get(fechaInicio, fechaFin) as VentasRow | undefined;
  const totalVentas = rowVentas ? rowVentas.totalVentas : 0;

  const rowDescuentos = db.prepare(`
    SELECT IFNULL(SUM(descuentoManualFijo * cantidad), 0) AS totalDescuentos
    FROM detail_ventas dv
    JOIN sales s ON s.id = dv.ventaId
    WHERE s.fecha >= ? AND s.fecha <= ?
  `).get(fechaInicio, fechaFin) as DescuentosRow | undefined;
  const totalDescuentos = rowDescuentos ? rowDescuentos.totalDescuentos : 0;

  const netoVentas = totalVentas - totalDescuentos;
  const totalEgresos = montoEgresos || 0;
  const saldoFinal = netoVentas - totalEgresos;
  const nowStr = dayjs().format(formato);

  const insertStmt = db.prepare(`
    INSERT INTO cortes (
      fechaCorte, fechaInicio, fechaFin,
      totalVentas, totalDescuentos, netoVentas,
      totalEgresos, saldoFinal,
      usuarioId, observaciones,
      createdAt, updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    ahora,
    fechaInicio,
    fechaFin,
    totalVentas,
    totalDescuentos,
    netoVentas,
    totalEgresos,
    saldoFinal,
    usuarioId || null,
    observaciones || '',
    nowStr,
    nowStr
  );

  const corteId = result.lastInsertRowid as number;

  return {
    id: corteId,
    fechaCorte: ahora,
    fechaInicio,
    fechaFin,
    totalVentas,
    totalDescuentos,
    netoVentas,
    totalEgresos,
    saldoFinal,
    usuarioId: usuarioId || null,
    observaciones: observaciones || '',
  };
}

interface CorteRow {
  id: number;
  fechaCorte: string;
  fechaInicio: string;
  fechaFin: string;
  totalVentas: number;
  totalDescuentos: number;
  netoVentas: number;
  totalEgresos: number;
  saldoFinal: number;
  usuarioId?: number | null;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Obtiene un corte por ID (mismo código sin cambios).
 */
export function getCorteById(corteId: number): CorteData | null {
  const row = db.prepare(`
    SELECT *
    FROM cortes
    WHERE id = ?
  `).get(corteId) as CorteRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    fechaCorte: row.fechaCorte,
    fechaInicio: row.fechaInicio,
    fechaFin: row.fechaFin,
    totalVentas: row.totalVentas,
    totalDescuentos: row.totalDescuentos,
    netoVentas: row.netoVentas,
    totalEgresos: row.totalEgresos,
    saldoFinal: row.saldoFinal,
    usuarioId: row.usuarioId ?? null,
    observaciones: row.observaciones ?? '',
  };
}

/**
 * Genera un PDF con datos del corte, guardado en ~/Downloads/corte_YYYYMMDD_HHmmss.pdf,
 * con el mismo diseño "bonito" de recuadro y explicaciones, sin sobrescribir archivos viejos.
 */
export async function generateCortePDF(
  corteData: CorteData,
  _outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const homeDir = os.homedir();
    const downloadsDir = path.join(homeDir, 'Downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir);
    }

    // Aquí usamos la fecha/hora para el nombre, evitando sobrescribir:
    const timestamp = dayjs().format('YYYYMMDD_HHmmss');
    const fileName = path.join(downloadsDir, `corte_${timestamp}.pdf`);

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(fileName);
    doc.pipe(stream);

    // -- ENCABEZADO de color
    const headerHeight = 40;
    doc.rect(doc.x, doc.y, doc.page.width - doc.x * 2, headerHeight).fill('#f2f2f2');

    const headerY = doc.y + 10;
    doc.fillColor('#333')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('REPORTE DE CORTE DE CAJA', doc.x + 10, headerY);

    // mover cursor debajo del encabezado
    doc.y += headerHeight + 10;

    // FECHA de generación
    doc.fontSize(11).font('Helvetica').fillColor('#555')
      .text(`Fecha de Generación: ${corteData.fechaCorte}`, { align: 'right' });
    
    doc.moveDown();

    const boxStartY = doc.y;
    doc.moveDown(0.5);

    doc.save();
    const boxPadding = 10;
    const boxWidth = doc.page.width - doc.x * 2;
    const boxStartX = doc.x;
    const initialY = doc.y;

    // Título
    doc.fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#000')
      .text('Información del Corte:')
      .moveDown(0.5);
    
    function printField(label: string, value: string, explanation: string) {
      doc.font('Helvetica-Bold')
         .text(`${label}: `, { continued: true })
         .font('Helvetica')
         .text(value)
         .moveDown(0.1);

      doc.font('Helvetica-Oblique')
         .fontSize(10)
         .fillColor('#666')
         .text(`(${explanation})`)
         .moveDown(0.5);

      doc.fontSize(12).font('Helvetica').fillColor('#000');
    }

    printField('ID del Corte', String(corteData.id), 'Identificador único.');
    printField(
      'Rango de Fechas',
      `${corteData.fechaInicio} - ${corteData.fechaFin}`,
      'Periodo de ventas/egresos analizado.'
    );
    printField(
      'Total Ventas',
      `$${corteData.totalVentas.toFixed(2)}`,
      'Monto facturado antes de descuentos.'
    );
    printField(
      'Total Descuentos',
      `$${corteData.totalDescuentos.toFixed(2)}`,
      'Suma de todas las rebajas aplicadas.'
    );
    printField(
      'Ventas Netas',
      `$${corteData.netoVentas.toFixed(2)}`,
      'Ingresos finales después de descuentos.'
    );
    printField(
      'Egresos',
      `$${corteData.totalEgresos.toFixed(2)}`,
      'Salidas de efectivo (gastos, retiros, etc.).'
    );
    printField(
      'Saldo Final',
      `$${corteData.saldoFinal.toFixed(2)}`,
      'Dinero que debería haber en caja al cierre.'
    );

    if (corteData.usuarioId) {
      printField('Usuario ID', String(corteData.usuarioId), 'Usuario que realizó el corte.');
    }

    if (corteData.observaciones) {
      doc.font('Helvetica-Bold')
         .text('Observaciones:')
         .moveDown(0.1);
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#333')
         .text(corteData.observaciones);
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica').fillColor('#000');
    }

    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#000')
       .text('Sobre este Corte:', { underline: true });
    doc.font('Helvetica')
       .fontSize(11)
       .fillColor('#333')
       .text(
         'Este reporte resume los ingresos por ventas (con descuentos) y los egresos ' +
         'durante el periodo. El saldo final refleja la cantidad de efectivo que debe existir ' +
         'en la caja al finalizar.'
       );

    const finalY = doc.y;
    const boxHeight = finalY - boxStartY;
    doc.restore();

    doc.save()
      .lineWidth(1)
      .strokeColor('#AAAAAA')
      .rect(boxStartX - boxPadding, boxStartY - boxPadding, boxWidth + boxPadding*2, boxHeight + boxPadding*2)
      .stroke()
      .restore();

    doc.moveDown(2);

    doc.font('Helvetica-Oblique')
       .fontSize(10)
       .fillColor('#666')
       .text('Documento generado automáticamente.', { align: 'center' });

    doc.end();
    stream.on('finish', () => {
      resolve(fileName);
    });
    stream.on('error', (error) => {
      reject(error);
    });
  });
}
