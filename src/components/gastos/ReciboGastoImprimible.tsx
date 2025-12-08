// components/gastos/ReciboGastoImprimible.tsx
import React from 'react';

// Helper simple. Para producción, instala 'numero-a-letras'
function numeroALetras(num: number): string {
  return `${num.toFixed(2)} PESOS 00/100 M.N.`; 
}

interface ReciboProps {
  datos: {
    folio_recibo?: string;
    fecha_emision: string;
    beneficiario: string; // Nombre de quien recibe
    monto: number;
    monto_letra: string;
    concepto_general: string;
    concepto_detalle: string;
    responsable: string; // Nombre de quien entrega (Usuario o Dueño)
  }
}

const S = {
  container: {
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    padding: '40px',
    maxWidth: '850px',
    margin: '0 auto',
    border: '1px solid #e5e7eb',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #000',
    paddingBottom: '10px',
  },
  logoBox: {
    width: '70px',
    height: '70px',
    border: '2px solid #000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    marginRight: '20px',
  },
  titleBlock: {
    textAlign: 'center' as const,
  },
  row: {
    display: 'flex',
    border: '1px solid #ccc',
    marginBottom: '-1px', // Para colapsar bordes
  },
  labelBox: {
    width: '150px',
    backgroundColor: '#4b5563', // El gris oscuro de la imagen
    color: '#ffffff',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
  },
  valueBox: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    textTransform: 'uppercase' as const,
    backgroundColor: '#f3f4f6', // Gris muy claro de fondo
  },
  amountBar: {
    backgroundColor: '#374151', // Gris más oscuro para la barra de letras
    color: '#ffffff',
    padding: '10px',
    textAlign: 'center' as const,
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '10px',
    marginBottom: '30px',
    textTransform: 'uppercase' as const,
    borderRadius: '4px',
  },
  signatures: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '60px',
  },
  signBox: {
    width: '40%',
    borderTop: '1px solid #000',
    textAlign: 'center' as const,
    paddingTop: '5px',
  }
};

export const ReciboGastoImprimible = ({ datos }: ReciboProps) => {
  // Asumimos que el dueño siempre paga, o usamos el responsable del sistema
  const nombreQuienEntrega = "HERMENEGILDO BADILLO CRUZ"; 
  const fecha = new Date(datos.fecha_emision).toLocaleDateString('es-MX', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div id="recibo-gasto-imprimible" style={S.container}>
      
      {/* HEADER IDENTICO A LA NOTA */}
      <div style={S.header}>
        <div style={S.logoBox}>LOGO</div>
        <div style={S.titleBlock}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>ASERRADERO PUENTE DE DORIA</h1>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0' }}>HERMENEGILDO BADILLO CRUZ</h2>
          <p style={{ fontSize: '10px', margin: 0 }}>
            R.F.C. BACH780413IZA &bull; HUASCA DE OCAMPO, HGO.
          </p>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px', textTransform: 'uppercase' }}>
            Recibo de Dinero {datos.folio_recibo ? `#${datos.folio_recibo}` : ''}
          </h3>
        </div>
      </div>

      {/* CUERPO DEL RECIBO (Estilo Bloques) */}
      <div style={{ marginBottom: '20px' }}>
        
        {/* Fila: Recibí de */}
        <div style={S.row}>
          <div style={S.labelBox}>Recibí de:</div>
          <div style={S.valueBox}>{nombreQuienEntrega}</div>
        </div>

        {/* Fila: Cantidad Numérica */}
        <div style={S.row}>
          <div style={S.labelBox}>Cantidad:</div>
          <div style={S.valueBox}>$ {Number(datos.monto).toFixed(2)}</div>
        </div>

        {/* Fila: Concepto */}
        <div style={S.row}>
          <div style={S.labelBox}>Concepto:</div>
          <div style={{...S.valueBox, flexDirection: 'column', alignItems: 'flex-start'}}>
            <span>{datos.concepto_general}</span>
            {datos.concepto_detalle && (
              <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#555' }}>
                {datos.concepto_detalle}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* BARRA OSCURA DE CANTIDAD CON LETRA */}
      <div style={S.amountBar}>
        ({datos.monto_letra})
      </div>

      {/* FECHA */}
      <div style={{ textAlign: 'right', fontStyle: 'italic', marginBottom: '20px' }}>
        {fecha}
      </div>

      {/* FIRMAS */}
      <div style={S.signatures}>
        <div style={S.signBox}>
          <span style={{ fontWeight: 'bold', fontSize: '11px' }}>NOMBRE Y FIRMA DE QUIEN RECIBE</span><br/>
          <span style={{ textTransform: 'uppercase' }}>{datos.beneficiario}</span>
        </div>
        <div style={S.signBox}>
          <span style={{ fontWeight: 'bold', fontSize: '11px' }}>NOMBRE Y FIRMA DE QUIEN ENTREGÓ</span><br/>
          <span style={{ textTransform: 'uppercase' }}>{datos.responsable}</span>
        </div>
      </div>

      {/* Estilos para impresión nativa */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #recibo-gasto-imprimible, #recibo-gasto-imprimible * {
            visibility: visible;
          }
          #recibo-gasto-imprimible {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; border: none;
          }
        }
      `}</style>
    </div>
  );
};