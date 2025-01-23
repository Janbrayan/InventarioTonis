import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

// Importamos los componentes de Recharts
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, CartesianGrid, ResponsiveContainer
} from 'recharts';

/**
 * Estructura que esperamos de la llamada `statsGetTopProductos`
 * (Adáptalo a tu API real.)
 */
interface TopProducto {
  productoId: number;
  nombreProducto: string;
  totalVendidas: number;
}

/**
 * Componente principal de estadísticas.
 * - Llama a window.electronAPI.statsGetTopProductos(5) para obtener
 *   los 5 productos más vendidos.
 * - Muestra una gráfica de barras con Recharts.
 */
export default function Estadisticas() {
  const [loading, setLoading] = useState(true);
  const [datosTopProductos, setDatosTopProductos] = useState<TopProducto[]>([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  async function cargarEstadisticas() {
    try {
      setLoading(true);
      // Llamamos a la función expuesta en preload.ts / ipcHandlers:
      const top = await window.electronAPI.statsGetTopProductos(5);
      // Suponemos que `top` es un array tipo: [{productoId, nombreProducto, totalVendidas}, ...]
      setDatosTopProductos(top);
    } catch (error) {
      console.error('Error al cargar top productos:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Cargando estadísticas...</p>;
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#212529' }}>
        Estadísticas
      </Typography>

      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: '#1c2430', color: '#fff' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Top 5 Productos Más Vendidos
          </Typography>

          {/* Contenedor "responsivo" para la gráfica */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosTopProductos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombreProducto" />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* Usamos la propiedad dataKey con el campo que contenga las ventas */}
              <Bar dataKey="totalVendidas" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
