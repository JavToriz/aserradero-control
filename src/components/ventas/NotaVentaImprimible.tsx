// components/ventas/NotaVentaImprimible.tsx
import React from 'react';

// Helper simple para numeros a letras (puedes expandirlo o usar librería)
function numeroALetras(num: number): string {
  // Implementación básica para el demo. 
  // Sugerencia: instalar 'numero-a-letras' si quieres algo robusto.
  return `${Number(num).toFixed(2)} PESOS 00/100 M.N.`; 
}

interface NotaProps {
  datos: {
    folio_nota: string;
    fecha_salida: string;
    cliente: { nombre_completo: string; domicilio_poblacion?: string; rfc?: string };
    vehiculo?: { marca: string; modelo: string; matricula: string; capacidad_carga_toneladas: number };
    detalles: any[];
    total_venta: number;
    quien_expide: string;
  }
}

// --- ESTILOS SEGUROS (CSS PURO) ---
// Usamos esto en lugar de clases Tailwind para evitar errores 'lab()' en el PDF
const S = {
  container: {
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    lineHeight: '1.2',
    padding: '40px',
    maxWidth: '850px',
    margin: '0 auto',
  },
  borderBox: {
    border: '1px solid #000000',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  logoBox: {
    width: '80px',
    height: '80px',
    border: '2px solid #000000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    textAlign: 'center' as const,
    marginRight: '15px',
  },
  titleBox: {
    textAlign: 'center' as const,
    flex: 1,
  },
  folioBox: {
    border: '2px solid #000000',
    borderRadius: '8px',
    overflow: 'hidden',
    width: '200px',
    textAlign: 'right' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '20px',
    border: '1px solid #000000',
  },
  th: {
    backgroundColor: '#e5e7eb', // Gris claro seguro
    border: '1px solid #000000',
    padding: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
  },
  td: {
    borderRight: '1px solid #000000',
    padding: '4px',
    fontSize: '11px',
  },
  footerBox: {
    border: '1px solid #000000',
    display: 'flex',
    height: '100px',
  }
};

export const NotaVentaImprimible = ({ datos }: NotaProps) => {
  const fechaObj = new Date(datos.fecha_salida);
  const dia = fechaObj.getUTCDate();
  const mes = fechaObj.getUTCMonth() + 1;
  const ano = fechaObj.getUTCFullYear();

  return (
    <div id="nota-venta-imprimible" style={S.container}>
      
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={S.logoBox}>LOGO<br/>ASERRADERO</div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Aserradero Puente de Doria</h1>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0' }}>HERMENEGILDO BADILLO CRUZ</h2>
            <p style={{ fontSize: '10px', margin: 0 }}>
              R.F.C. BACH780413IZA &nbsp; CURP: BACH780413HPLDRR07<br/>
              RFN: HGO TI 1621 &nbsp; C.I. T-13-024-BAC-001/21<br/>
              <strong>TELS. 775 124 76 57 y 775 137 2681</strong>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
           <div style={S.folioBox}>
             <div style={{ backgroundColor: '#000000', color: '#ffffff', fontWeight: 'bold', padding: '5px', textAlign: 'center', textTransform: 'uppercase' }}>
               Nota de Venta
             </div>
             <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', padding: '10px', textAlign: 'center' }}>
                {datos.folio_nota}
             </div>
           </div>
           <p style={{ fontSize: '9px', marginTop: '5px', textAlign: 'center' }}>
             PARCELA 317 Z-1 P1/2 DEL EJIDO RIO SECO<br/>
             C.P. 43500 PUENTE DE DORIA RIO SECO,<br/>
             HUASCA DE OCAMPO, HGO.
           </p>
        </div>
      </div>

      {/* FECHAS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
        <table style={{ ...S.table, marginBottom: 0, width: '50%' }}>
          <tbody>
            <tr>
              <td style={{ ...S.th, width: '30%', backgroundColor: '#e5e7eb' }}>FECHA DE<br/>SALIDA</td>
              <td style={{ border: '1px solid #000', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', borderBottom: '1px solid #000' }}>DIA</div>
                <div>{dia}</div>
              </td>
              <td style={{ border: '1px solid #000', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', borderBottom: '1px solid #000' }}>MES</div>
                <div>{mes}</div>
              </td>
              <td style={{ border: '1px solid #000', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', borderBottom: '1px solid #000' }}>AÑO</div>
                <div>{ano}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <table style={{ ...S.table, marginBottom: 0, width: '50%' }}>
          <tbody>
            <tr>
              <td style={{ ...S.th, width: '30%', backgroundColor: '#e5e7eb' }}>FECHA DE<br/>VENCIMIENTO</td>
              <td style={{ border: '1px solid #000' }}></td>
              <td style={{ border: '1px solid #000' }}></td>
              <td style={{ border: '1px solid #000' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CLIENTE INFO */}
      <div style={{ border: '1px solid #000', marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
          <div style={{ width: '100px', padding: '5px', backgroundColor: '#f3f4f6', borderRight: '1px solid #000', fontWeight: 'bold' }}>NOMBRE:</div>
          <div style={{ padding: '5px', flex: 1, textTransform: 'uppercase' }}>{datos.cliente.nombre_completo}</div>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '100px', padding: '5px', backgroundColor: '#f3f4f6', borderRight: '1px solid #000', fontWeight: 'bold' }}>DIRECCIÓN:</div>
          <div style={{ padding: '5px', flex: 1, textTransform: 'uppercase' }}>{datos.cliente.domicilio_poblacion || ''}</div>
        </div>
      </div>

      {/* TABLA PRODUCTOS */}
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>CANT.</th>
            <th style={S.th}>DESCRIPCIÓN</th>
            <th style={S.th}>GÉNERO</th>
            <th style={S.th}>TOTAL PIES</th>
            <th style={S.th}>PRECIO U.</th>
            <th style={S.th}>IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          {datos.detalles.map((item, idx) => (
            <tr key={idx} style={{ height: '25px' }}>
              <td style={{ ...S.td, textAlign: 'center' }}>{item.cantidad}</td>
              <td style={{ ...S.td, textTransform: 'uppercase' }}>
                {item.producto?.descripcion} {item.medidas ? `- ${item.medidas}` : ''}
              </td>
              <td style={{ ...S.td, textAlign: 'center', textTransform: 'uppercase' }}>{item.genero}</td>
              <td style={{ ...S.td, textAlign: 'center' }}>-</td>
              <td style={{ ...S.td, textAlign: 'right' }}>${Number(item.precio_unitario).toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontSize: '11px' }}>
                ${Number(item.importe).toFixed(2)}
              </td>
            </tr>
          ))}
          {/* Relleno para mantener tamaño */}
          {[...Array(Math.max(0, 8 - datos.detalles.length))].map((_, idx) => (
            <tr key={`empty-${idx}`} style={{ height: '25px' }}>
              <td style={S.td}></td><td style={S.td}></td><td style={S.td}></td>
              <td style={S.td}></td><td style={S.td}></td><td style={{ border: '1px solid #000' }}></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>
              <span style={{ fontWeight: 'bold' }}>IMPORTE CON LETRA:</span><br/>
              {numeroALetras(Number(datos.total_venta))}
            </td>
            <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', textAlign: 'right', backgroundColor: '#f3f4f6' }}>TOTAL</td>
            <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', textAlign: 'right', fontSize: '16px' }}>
              ${Number(datos.total_venta).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* FOOTER / FIRMAS */}
      <div style={S.footerBox}>
        <div style={{ width: '50%', borderRight: '1px solid #000', position: 'relative' }}>
           <div style={{ position: 'absolute', bottom: '10px', left: '10%', right: '10%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '5px', fontSize: '10px', fontWeight: 'bold' }}>
             NOMBRE Y FIRMA DE QUIEN EXPIDE<br/>
             <span style={{ fontWeight: 'normal', textTransform: 'uppercase' }}>{datos.quien_expide}</span>
           </div>
        </div>
        <div style={{ width: '50%', padding: '10px', fontSize: '10px' }}>
           <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', paddingBottom: '2px', display: 'flex' }}>
             <span style={{ fontWeight: 'bold', width: '60px' }}>MARCA:</span>
             <span style={{ textTransform: 'uppercase', flex: 1 }}>{datos.vehiculo?.marca}</span>
             <span style={{ fontWeight: 'bold', width: '50px' }}>MODELO:</span>
             <span style={{ textTransform: 'uppercase' }}>{datos.vehiculo?.modelo}</span>
           </div>
           <div style={{ display: 'flex' }}>
             <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 'bold', display: 'block' }}>CAPACIDAD:</span>
                <span>{datos.vehiculo?.capacidad_carga_toneladas ? `${datos.vehiculo.capacidad_carga_toneladas} TON` : ''}</span>
             </div>
             <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 'bold', display: 'block' }}>PLACAS:</span>
                <span style={{ textTransform: 'uppercase' }}>{datos.vehiculo?.matricula}</span>
             </div>
           </div>
        </div>
      </div>

      {/* CSS PARA IMPRESIÓN NATIVA */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #nota-venta-imprimible, #nota-venta-imprimible * {
            visibility: visible;
          }
          #nota-venta-imprimible {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          /* Ocultar elementos que no sean la nota */
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};