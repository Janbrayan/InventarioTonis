import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Stack
} from '@mui/material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';

// Configuración global de dayjs en español
dayjs.locale('es');

/**
 * Convierte un objeto Dayjs a formato "YYYY-MM-DD HH:mm:ss".
 * Aunque el Picker se muestre en 12h, internamente guardamos 24h.
 */
function formatDateTime(value: Dayjs | null): string {
  if (!value) return '';
  return value.format('YYYY-MM-DD HH:mm:ss');
}

export default function Cortes() {
  // Estados de los DateTimePickers
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);

  // "montoInversion"
  const [montoInversion, setMontoInversion] = useState<number | undefined>(undefined);
  const [observaciones, setObservaciones] = useState('');

  // Datos del corte
  const [corteInfo, setCorteInfo] = useState<any>(null);

  // Alert
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  function showAlert(message: string) {
    setAlertMessage(message);
    setAlertOpen(true);
  }

  function closeAlert() {
    setAlertOpen(false);
    setAlertMessage('');
  }

  /**
   * Crea el corte (en el backend).
   */
  async function handleCreateCorte() {
    const inicioStr = formatDateTime(fechaInicio);
    const finStr = formatDateTime(fechaFin);

    // Validaciones
    if (!inicioStr || !finStr) {
      showAlert('Debes seleccionar la fecha/hora de inicio y fin.');
      return;
    }
    if (montoInversion === undefined || montoInversion <= 0) {
      showAlert('Debes ingresar un monto de inversión válido.');
      return;
    }

    try {
      const resp = await window.electronAPI.createCorte(
        inicioStr,
        finStr,
        undefined, // Se omite ID de usuario
        montoInversion,
        observaciones
      );
      if (!resp.success) {
        showAlert(resp.error || 'No se pudo crear el corte.');
        return;
      }
      setCorteInfo(resp.data);
      showAlert('Corte creado con éxito.');
    } catch (error) {
      console.error('Error handleCreateCorte:', error);
      showAlert('Ocurrió un error al crear el corte.');
    }
  }

  /**
   * Obtiene el corte por ID (si ya existe uno).
   */
  async function handleGetCorte() {
    if (!corteInfo?.id) {
      showAlert('No hay un corte reciente o no tiene ID.');
      return;
    }
    try {
      const resp = await window.electronAPI.getCorteById(corteInfo.id);
      if (!resp.success) {
        showAlert(resp.error || 'No se pudo obtener el corte.');
        return;
      }
      setCorteInfo(resp.data);
      showAlert('Corte obtenido exitosamente.');
    } catch (error) {
      console.error('Error handleGetCorte:', error);
      showAlert('Error al obtener corte por ID.');
    }
  }

  /**
   * Genera PDF. El backend lo guarda en Descargas.
   */
  async function handleGeneratePDF() {
    if (!corteInfo) {
      showAlert('Primero debes crear u obtener un corte antes de generar PDF.');
      return;
    }
    try {
      const resp = await window.electronAPI.generateCortePDF(corteInfo, 'cualquier-ruta.pdf');
      if (!resp.success) {
        showAlert(resp.error || 'No se pudo generar el PDF.');
        return;
      }
      showAlert(`PDF generado correctamente en: ${resp.file}`);
    } catch (error) {
      console.error('Error handleGeneratePDF:', error);
      showAlert('Ocurrió un error al generar el PDF.');
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      {/* Fondo gris muy claro en toda la pantalla */}
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
        {/* Card principal con todo el contenido */}
        <Card
          sx={{
            maxWidth: 900,
            margin: '0 auto',
            boxShadow: 4,
            borderRadius: 2,
          }}
        >
          {/* Encabezado tipo banner (parte superior del Card) */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Corte de Caja
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Crea y administra cortes de forma sencilla. Selecciona tu rango de
              fechas, el monto de inversión y obtén tus resultados.
            </Typography>
          </Box>

          {/* Contenido general */}
          <CardContent sx={{ pb: 4 }}>
            {/* Sección: Datos para crear Corte */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Datos para crear Corte
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {/* Fecha Inicio (12h con AM/PM) */}
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Fecha/Hora Inicio"
                  value={fechaInicio}
                  onChange={setFechaInicio}
                  ampm // muestra formato 12 horas
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>

              {/* Fecha Fin (12h con AM/PM) */}
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Fecha/Hora Fin"
                  value={fechaFin}
                  onChange={setFechaFin}
                  ampm // muestra formato 12 horas
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>

              {/* Monto de Inversión (obligatorio) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  label="Monto de Inversión"
                  variant="outlined"
                  fullWidth
                  value={montoInversion || ''}
                  onChange={(e) =>
                    setMontoInversion(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Observaciones"
                  variant="outlined"
                  multiline
                  rows={3}
                  fullWidth
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </Grid>

              {/* Botón para crear Corte */}
              <Grid item xs={12} sx={{ textAlign: 'right', mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateCorte}
                  sx={{ fontWeight: 'bold' }}
                >
                  Crear Corte
                </Button>
              </Grid>
            </Grid>

            {/* Sección: Información del corte (si existe) */}
            {corteInfo && (
              <>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', mt: 4, color: 'secondary.main' }}
                >
                  Corte Actual
                </Typography>
                <Divider sx={{ mb: 2, mt: 1 }} />

                {/* Cambiamos color a blanco (#fff) para texto en fondo oscuro */}
                <Stack
                  spacing={1}
                  divider={<Divider flexItem sx={{ opacity: 0.3 }} />}
                  sx={{ pt: 1, color: '#fff' }}
                >
                  <Typography variant="body1">
                    <strong>ID:</strong> {corteInfo.id}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Fecha Corte:</strong> {corteInfo.fechaCorte}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Rango:</strong> {corteInfo.fechaInicio} - {corteInfo.fechaFin}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Total Ventas:</strong> ${corteInfo.totalVentas}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Total Descuentos:</strong> ${corteInfo.totalDescuentos}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Ventas Netas:</strong> ${corteInfo.netoVentas}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Inversión:</strong> ${corteInfo.totalEgresos}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Saldo Final:</strong> ${corteInfo.saldoFinal}
                  </Typography>
                  {corteInfo.observaciones && (
                    <Typography variant="body1">
                      <strong>Observaciones:</strong> {corteInfo.observaciones}
                    </Typography>
                  )}
                </Stack>

                {/* Botones de acciones del corte actual */}
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button variant="outlined" onClick={handleGetCorte}>
                    Volver a Obtener Corte
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleGeneratePDF}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Generar PDF
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* ALERTA MODAL */}
        <Dialog open={alertOpen} onClose={closeAlert}>
          <DialogTitle>Alerta</DialogTitle>
          <DialogContent>
            <Typography>{alertMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeAlert} autoFocus>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
