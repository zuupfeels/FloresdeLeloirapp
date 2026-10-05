/**
 * Convierte un número monetario a su representación en letras en español
 * Ejemplo: 770043.58 -> "PESOS SETECIENTOS SETENTA MIL CUARENTA Y TRES CON 58/100"
 */

const UNIDADES = ['', 'UN ', 'DOS ', 'TRES ', 'CUATRO ', 'CINCO ', 'SEIS ', 'SIETE ', 'OCHO ', 'NUEVE '];
const DECENAS = [
  'DIEZ ', 'ONCE ', 'DOCE ', 'TRECE ', 'CATORCE ', 'QUINCE ', 'DIECISEIS ', 'DIECISIETE ', 'DIECIOCHO ', 'DIECINUEVE ',
  'VEINTE ', 'VEINTIUN ', 'VEINTIDOS ', 'VEINTITRES ', 'VEINTICUATRO ', 'VEINTICINCO ', 'VEINTISEIS ', 'VEINTISIETE ', 'VEINTIOCHO ', 'VEINTINUEVE '
];
const DECENAS_DIEZ = ['', '', '', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA '];
const CENTENAS = [
  '', 'CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ',
  'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS '
];

function seccion(num: number, divisor: number, strSingular: string, strPlural: string): string {
  const cientos = Math.floor(num / divisor);
  const resto = num - cientos * divisor;
  let letras = '';

  if (cientos > 0) {
    if (cientos > 1) {
      letras = centenas(cientos) + ' ' + strPlural;
    } else {
      letras = strSingular;
    }
  }

  if (resto > 0) {
    letras += '';
  }

  return letras;
}

function centenas(num: number): string {
  const c = Math.floor(num / 100);
  const d = Math.floor((num % 100) / 10);
  const u = num % 10;

  let letras = '';

  if (num === 100) {
    return 'CIEN ';
  }

  letras += CENTENAS[c];

  if (d === 0) {
    letras += UNIDADES[u];
  } else if (d === 1) {
    letras += DECENAS[u];
  } else if (d === 2) {
    if (u === 0) {
      letras += 'VEINTE ';
    } else {
      letras += DECENAS[10 + u];
    }
  } else {
    letras += DECENAS_DIEZ[d];
    if (u > 0) {
      letras += 'Y ' + UNIDADES[u];
    }
  }

  return letras;
}

export function numeroALetras(monto: number): string {
  if (isNaN(monto) || monto < 0) {
    return 'CERO';
  }

  const partes = monto.toFixed(2).split('.');
  const enteros = parseInt(partes[0], 10);
  const centavos = partes[1] || '00';

  if (enteros === 0) {
    return `PESOS CERO CON ${centavos}/100`;
  }

  let letras = '';

  // Millones
  const millones = Math.floor(enteros / 1000000);
  const restoMillones = enteros % 1000000;

  if (millones > 0) {
    if (millones === 1) {
      letras += 'UN MILLON ';
    } else {
      letras += centenas(millones) + 'MILLONES ';
    }
  }

  // Miles
  const miles = Math.floor(restoMillones / 1000);
  const restoMiles = restoMillones % 1000;

  if (miles > 0) {
    if (miles === 1) {
      letras += 'MIL ';
    } else {
      letras += centenas(miles) + 'MIL ';
    }
  }

  // Cientos
  if (restoMiles > 0) {
    letras += centenas(restoMiles);
  }

  const resultado = letras.replace(/\s+/g, ' ').trim();
  return `PESOS ${resultado} CON ${centavos}/100`;
}

export function formatearMoneda(monto: number): string {
  if (isNaN(monto)) return '$ 0,00';
  return '$ ' + monto.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
