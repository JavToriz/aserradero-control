import React from 'react';

// --- TIPO DE DATOS ---
export interface DatosEmpresaRecibo {
  nombre: string;
  propietario: string;
  rfc: string;
  ciudad_estado: string; 
  rfn: string;
  direccion_completa: string;
  logo_url: string;
}

// --- LOGICA NATIVA ---
const numeroALetras = (amount: number): string => {
  const unidades = ['', 'UN ', 'DOS ', 'TRES ', 'CUATRO ', 'CINCO ', 'SEIS ', 'SIETE ', 'OCHO ', 'NUEVE '];
  const decenas = ['DIEZ ', 'ONCE ', 'DOCE ', 'TRECE ', 'CATORCE ', 'QUINCE ', 'DIECISEIS ', 'DIECISIETE ', 'DIECIOCHO ', 'DIECINUEVE ', 'VEINTE ', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA '];
  const centenas = ['', 'CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ', 'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS '];

  let number = parseFloat(amount.toString());
  let decimals = Math.round((number - Math.floor(number)) * 100);
  let enteros = Math.floor(number);

  function getUnidades(num: number) { let un = Math.floor(num % 10); return unidades[un]; }
  function getDecenas(num: number) {
    let dec = Math.floor(num / 10); let uni = num - (dec * 10);
    if (dec < 3) { if (dec === 0) return getUnidades(num); if (dec === 1 && uni < 10) return decenas[uni]; if (dec === 2 && uni === 0) return decenas[10]; if (dec === 2 && uni > 0) return 'VEINTI' + getUnidades(uni); } 
    let str = decenas[dec + 8]; if (uni > 0) str += 'Y ' + getUnidades(uni); return str;
  }
  function getCentenas(num: number) { if (num > 99) { if (num === 100) return 'CIEN '; let cen = Math.floor(num / 100); let resto = num - (cen * 100); return centenas[cen] + getDecenas(resto); } else { return getDecenas(num); } }
  function getMiles(num: number) { let divisor = 1000; let cientos = Math.floor(num / divisor); let resto = num - (cientos * divisor); let strMiles = ''; if (cientos > 0) { if (cientos === 1) strMiles = 'MIL '; else strMiles = getCentenas(cientos) + 'MIL '; } if (resto > 0) strMiles += getCentenas(resto); return strMiles; }
  let letras = ''; if (enteros === 0) letras = 'CERO '; else if (enteros < 1000) letras = getCentenas(enteros); else if (enteros < 1000000) letras = getMiles(enteros);
  return `${letras.trim()} PESOS ${decimals.toString().padStart(2, '0')}/100 M.N.`;
};

interface ReciboProps {
  empresa: DatosEmpresaRecibo; 
  datos: {
    folio_recibo?: string;
    fecha_emision: string;
    beneficiario: string;
    monto: number;
    concepto_general: string;
    concepto_detalle: string;
    responsable: string;
  }
}

const S = {
  container: { backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif', fontSize: '12px', padding: '40px', maxWidth: '850px', margin: '0 auto', border: '1px solid #e5e7eb' },
  header: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' },
  logoBox: { width: '90px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '20px' },
  titleBlock: { textAlign: 'center' as const },
  row: { display: 'flex', border: '1px solid #ccc', marginBottom: '-1px' },
  labelBox: { width: '150px', backgroundColor: '#4b5563', color: '#ffffff', fontWeight: 'bold', display: 'flex', alignItems: 'center', padding: '10px', fontSize: '11px', textTransform: 'uppercase' as const },
  valueBox: { flex: 1, padding: '10px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', textTransform: 'uppercase' as const, backgroundColor: '#f3f4f6' },
  amountBar: { backgroundColor: '#374151', color: '#ffffff', padding: '10px', textAlign: 'center' as const, fontSize: '12px', fontWeight: 'bold', marginTop: '10px', marginBottom: '30px', textTransform: 'uppercase' as const, borderRadius: '4px' },
  signatures: { display: 'flex', justifyContent: 'space-between', marginTop: '60px' },
  signBox: { width: '40%', borderTop: '1px solid #000', textAlign: 'center' as const, paddingTop: '5px' }
};

export const ReciboGastoImprimible = ({ datos, empresa }: ReciboProps) => {
  const nombreQuienEntrega = empresa.propietario; 
  const fecha = new Date(datos.fecha_emision).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const importeLetra = numeroALetras(datos.monto);
  const direccionEnUnaLinea = empresa.direccion_completa ? empresa.direccion_completa.replace(/\n/g, ' ') : '';
  return (
    <div id="recibo-gasto-imprimible" style={S.container}>
      <div style={S.header}>
        <div style={S.logoBox}><img src={empresa.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
        <div style={S.titleBlock}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>{empresa.nombre}</h1>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0' }}>{empresa.propietario}</h2>
          <p style={{ fontSize: '10px', margin: 0 }}>R.F.C. {empresa.rfc} &bull; RFN: {empresa.rfn}</p>
          <p style={{ fontSize: '9px', margin: '2px 0 0 0', textTransform: 'uppercase' }}> {direccionEnUnaLinea} </p>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px', textTransform: 'uppercase' }}>Recibo de Dinero {datos.folio_recibo ? `#${datos.folio_recibo}` : ''}</h3>
        </div>
      </div> 

      <div style={{ marginBottom: '20px' }}>
        <div style={S.row}><div style={S.labelBox}>Recibí de:</div><div style={S.valueBox}>{nombreQuienEntrega}</div></div>
        <div style={S.row}><div style={S.labelBox}>Cantidad:</div><div style={S.valueBox}>$ {Number(datos.monto).toFixed(2)}</div></div>
        <div style={S.row}>
          <div style={S.labelBox}>Concepto:</div>
          <div style={{...S.valueBox, flexDirection: 'column', alignItems: 'flex-start'}}>
            <span>{datos.concepto_general}</span>
            {datos.concepto_detalle && (<span style={{ fontSize: '11px', fontWeight: 'normal', color: '#555' }}>{datos.concepto_detalle}</span>)}
          </div>
        </div>
      </div>

      <div style={S.amountBar}>({importeLetra})</div>
      <div style={{ textAlign: 'right', fontStyle: 'italic', marginBottom: '20px' }}>{fecha}</div>

      <div style={S.signatures}>
        <div style={S.signBox}><span style={{ fontWeight: 'bold', fontSize: '11px' }}>NOMBRE Y FIRMA DE QUIEN RECIBE</span><br/><span style={{ textTransform: 'uppercase' }}>{datos.beneficiario}</span></div>
        <div style={S.signBox}><span style={{ fontWeight: 'bold', fontSize: '11px' }}>NOMBRE Y FIRMA DE QUIEN ENTREGÓ</span><br/><span style={{ textTransform: 'uppercase' }}>{datos.responsable}</span></div>
      </div>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #recibo-gasto-imprimible, #recibo-gasto-imprimible * { visibility: visible; }
          #recibo-gasto-imprimible { position: absolute; left: 0; top: 0; width: 100%; margin: 0; border: none; }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>
    </div>
  );
};