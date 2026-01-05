import React from 'react';

// --- LOGICA NUMERO A LETRAS ---
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

export interface DatosEmpresaNota {
  nombre: string;
  propietario: string;
  rfc: string;
  curp?: string;
  rfn?: string; 
  c_i?: string; 
  telefonos: string;
  direccion_completa: string; 
  logo_url: string;
}

interface NotaProps {
  empresa?: DatosEmpresaNota; 
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

// --- ESTILOS ---
const S = {
  container: { backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif', fontSize: '10px', lineHeight: '1.1', padding: '10px 15px', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box' as const },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', width: '100%' },
  logoBox: { width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
  titleBox: { flex: 1, textAlign: 'center' as const, padding: '0 10px' },
  folioContainer: { width: '160px', textAlign: 'right' as const },
  folioBox: { border: '2px solid #000000', borderRadius: '6px', overflow: 'hidden', textAlign: 'right' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '5px', border: '1px solid #000000' },
  th: { backgroundColor: '#e5e7eb', border: '1px solid #000000', padding: '2px', fontSize: '9px', fontWeight: 'bold', textAlign: 'center' as const },
  td: { borderRight: '1px solid #000000', padding: '2px 4px', fontSize: '9px' },
  footerBox: { border: '1px solid #000000', display: 'flex', height: '65px', marginTop: '10px' }
};

export const NotaVentaImprimible = ({ datos, empresa }: NotaProps) => {
  const fechaObj = new Date(datos.fecha_salida);
  const dia = fechaObj.getUTCDate();
  const mes = fechaObj.getUTCMonth() + 1;
  const ano = fechaObj.getUTCFullYear();

  // Valores por defecto actualizados con los dos teléfonos
  const emp = empresa || {
    nombre: "Aserradero Puente de Doria",
    propietario: "HERMENEGILDO BADILLO CRUZ",
    rfc: "BACH780413IZA",
    curp: "BACH780413HPLDRR07",
    rfn: "HGO TI 1621",
    c_i: "T-13-024-BAC-001/21",
    telefonos: "775 124 76 57 y 775 137 2681", // <--- ACTUALIZADO MANUALMENTE TAMBIÉN
    direccion_completa: "PARCELA 317 Z-1 P1/2 DEL EJIDO RIO SECO\nC.P. 43500 PUENTE DE DORIA RIO SECO,\nHUASCA DE OCAMPO, HGO.",
    logo_url: "/images/logo-puente-de-doria.png"
  };

  const renderDescripcion = (item: any) => {
    const desc = item.producto?.descripcion || '';
    const medidas = item.medidas || '';
    if (!medidas || desc.includes(medidas) || desc === medidas) return desc;
    return `${desc} - ${medidas}`;
  };

  return (
    <div id="nota-venta-imprimible" style={S.container}>
      <div style={S.headerRow}>
        <div style={S.logoBox}>
          <img src={emp.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={S.titleBox}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>{emp.nombre}</h1>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0' }}>{emp.propietario}</h2>
          <p style={{ fontSize: '8px', margin: 0, lineHeight: '1.3' }}>
            R.F.C. {emp.rfc} &nbsp; CURP: {emp.curp}<br/>
            RFN: {emp.rfn} &nbsp; C.I. {emp.c_i}<br/>
            {/* Aquí se renderiza la cadena '775... y 775...' que manda la API */}
            <strong>TELS. {emp.telefonos}</strong>
          </p>
        </div>
        <div style={S.folioContainer}>
          <div style={S.folioBox}>
            <div style={{ backgroundColor: '#000000', color: '#ffffff', fontWeight: 'bold', padding: '2px', fontSize: '10px', textAlign: 'center', textTransform: 'uppercase' }}>Nota de Venta</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626', padding: '5px', textAlign: 'center' }}>{datos.folio_nota}</div>
          </div>
          <p style={{ fontSize: '7px', marginTop: '5px', textAlign: 'center', lineHeight: '1.2', whiteSpace: 'pre-line' }}>{emp.direccion_completa}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
        <table style={{ ...S.table, marginBottom: 0, width: '50%' }}>
          <tbody>
            <tr>
              <td style={{ ...S.th, width: '30%', backgroundColor: '#e5e7eb' }}>FECHA DE<br/>SALIDA</td>
              <td style={{ border: '1px solid #000', textAlign: 'center', padding: 0 }}><div style={{ fontSize: '8px', borderBottom: '1px solid #000' }}>DIA</div><div style={{ fontSize: '10px' }}>{dia}</div></td>
              <td style={{ border: '1px solid #000', textAlign: 'center', padding: 0 }}><div style={{ fontSize: '8px', borderBottom: '1px solid #000' }}>MES</div><div style={{ fontSize: '10px' }}>{mes}</div></td>
              <td style={{ border: '1px solid #000', textAlign: 'center', padding: 0 }}><div style={{ fontSize: '8px', borderBottom: '1px solid #000' }}>AÑO</div><div style={{ fontSize: '10px' }}>{ano}</div></td>
            </tr>
          </tbody>
        </table>
        <table style={{ ...S.table, marginBottom: 0, width: '50%' }}>
          <tbody><tr><td style={{ ...S.th, width: '30%', backgroundColor: '#e5e7eb' }}>FECHA DE<br/>VENCIMIENTO</td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td></tr></tbody>
        </table>
      </div>

      <div style={{ border: '1px solid #000', marginBottom: '10px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
          <div style={{ width: '80px', padding: '4px', backgroundColor: '#f3f4f6', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '9px' }}>NOMBRE:</div>
          <div style={{ padding: '4px', flex: 1, textTransform: 'uppercase', fontSize: '10px' }}>{datos.cliente.nombre_completo}</div>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '80px', padding: '4px', backgroundColor: '#f3f4f6', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '9px' }}>DIRECCIÓN:</div>
          <div style={{ padding: '4px', flex: 1, textTransform: 'uppercase', fontSize: '10px' }}>{datos.cliente.domicilio_poblacion || ''}</div>
        </div>
      </div>

      <table style={S.table}>
        <thead>
          <tr><th style={S.th}>CANT.</th><th style={S.th}>DESCRIPCIÓN</th><th style={S.th}>GÉNERO</th><th style={S.th}>TOTAL PIES</th><th style={S.th}>PRECIO U.</th><th style={S.th}>IMPORTE</th></tr>
        </thead>
        <tbody>
          {datos.detalles.map((item, idx) => (
            <tr key={idx} style={{ height: '18px' }}>
              <td style={{ ...S.td, textAlign: 'center' }}>{item.cantidad}</td>
              <td style={{ ...S.td, textTransform: 'uppercase' }}>{renderDescripcion(item)}</td>
              <td style={{ ...S.td, textAlign: 'center', textTransform: 'uppercase' }}>{item.genero}</td>
              <td style={{ ...S.td, textAlign: 'center' }}>-</td>
              <td style={{ ...S.td, textAlign: 'right' }}>${Number(item.precio_unitario).toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right', fontSize: '9px' }}>${Number(item.importe).toFixed(2)}</td>
            </tr>
          ))}
          {[...Array(Math.max(0, 8 - datos.detalles.length))].map((_, idx) => (
            <tr key={`empty-${idx}`} style={{ height: '18px' }}><td style={S.td}></td><td style={S.td}></td><td style={S.td}></td><td style={S.td}></td><td style={S.td}></td><td style={{ border: '1px solid #000' }}></td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'top' }}>
              <span style={{ fontWeight: 'bold', fontSize: '8px' }}>IMPORTE CON LETRA:</span><br/>
              <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>{numeroALetras(Number(datos.total_venta))}</span>
            </td>
            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', textAlign: 'right', backgroundColor: '#f3f4f6', fontSize: '9px' }}>TOTAL</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', textAlign: 'right', fontSize: '12px' }}>${Number(datos.total_venta).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={S.footerBox}>
        <div style={{ width: '50%', borderRight: '1px solid #000', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '5px', left: '10%', right: '10%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '2px', fontSize: '8px', fontWeight: 'bold' }}>
            NOMBRE Y FIRMA DE QUIEN EXPIDE<br/>
            <span style={{ fontWeight: 'normal', textTransform: 'uppercase' }}>{datos.quien_expide}</span>
          </div>
        </div>
        <div style={{ width: '50%', padding: '5px', fontSize: '8px' }}>
          <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', paddingBottom: '2px', display: 'flex' }}>
            <span style={{ fontWeight: 'bold', width: '40px' }}>MARCA:</span><span style={{ textTransform: 'uppercase', flex: 1 }}>{datos.vehiculo?.marca}</span>
            <span style={{ fontWeight: 'bold', width: '40px' }}>MODELO:</span><span style={{ textTransform: 'uppercase' }}>{datos.vehiculo?.modelo}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}><span style={{ fontWeight: 'bold', display: 'block' }}>CAPACIDAD:</span><span>{datos.vehiculo?.capacidad_carga_toneladas ? `${datos.vehiculo.capacidad_carga_toneladas} TON` : ''}</span></div>
            <div style={{ flex: 1 }}><span style={{ fontWeight: 'bold', display: 'block' }}>PLACAS:</span><span style={{ textTransform: 'uppercase' }}>{datos.vehiculo?.matricula}</span></div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body { margin: 0 !important; padding: 0 !important; background-color: #fff; }
          body * { visibility: hidden; }
          #nota-venta-imprimible, #nota-venta-imprimible * { visibility: visible; }
          #nota-venta-imprimible { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 10px 20px !important; border: none !important; }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>
    </div>
  );
};