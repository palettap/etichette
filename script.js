
const csvUrl = "https://raw.githubusercontent.com/palettap/barcode-label-maker/e2afbcfe438081c9c6bbf490654e2158654ba5b9/articoli_esempio.csv";
let articoli = [];
const preferiti = JSON.parse(localStorage.getItem('preferiti')) || [];

async function caricaArticoli() {
  const res = await fetch(csvUrl);
  const text = await res.text();
  const rows = text.trim().split("\n").slice(1);
  articoli = rows.map(row => {
    const [codice, descrizione, tipo_articolo] = row.split(';');
    return { codice, descrizione, tipo_articolo };
  });
}

function aggiornaPreferiti() {
  const container = document.getElementById('preferiti');
  container.innerHTML = '';
  preferiti.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'favorite-item';
    div.innerHTML = `<span>{item.codice} - {item.descrizione}</span>
      <span><i class="fas fa-tag" onclick='caricaPreferito({index})'></i>
      <i class="fas fa-trash" onclick='rimuoviPreferito({index})'></i></span>`;
    container.appendChild(div);
  });
}

function aggiungiPreferito() {
  const codice = document.getElementById('codiceArticolo').value;
  const descrizione = document.getElementById('descrizione').value;
  const peso = document.getElementById('peso').value;
  preferiti.push({ codice, descrizione, peso });
  localStorage.setItem('preferiti', JSON.stringify(preferiti));
  aggiornaPreferiti();
}

function caricaPreferito(index) {
  const item = preferiti[index];
  document.getElementById('codiceArticolo').value = item.codice;
  document.getElementById('descrizione').value = item.descrizione;
  document.getElementById('peso').value = item.peso;
}

function rimuoviPreferito(index) {
  preferiti.splice(index, 1);
  localStorage.setItem('preferiti', JSON.stringify(preferiti));
  aggiornaPreferiti();
}

function calcolaEAN13CheckDigit(code) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

function generaEtichetta() {
  const canvas = document.getElementById('canvasEtichetta');
  const ctx = canvas.getContext('2d');
  const codice = document.getElementById('codiceArticolo').value.padStart(6, '0');
  const descrizione = document.getElementById('descrizione').value;
  const peso = document.getElementById('peso').value;

  const articolo = articoli.find(a => a.codice === codice);
  const tipo = articolo?.tipo_articolo || 'standard';
  let barcode = '';

  if (tipo === 'a_peso') {
    const pesoInt = peso.split('.')[0].padStart(2, '0');
    const pesoDec = (peso.split('.')[1] || '000').padEnd(3, '0').substring(0, 3);
    const base = '2' + codice + pesoInt + pesoDec;
    barcode = base + calcolaEAN13CheckDigit(base);
  } else {
    barcode = codice + '000000' + (peso * 100).toFixed(0).padStart(3, '0');
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0D5164';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.font = '16px Arial';
  ctx.fillText(`Codice: {codice}`, canvas.width / 2, 40);
  ctx.fillText(`Descrizione: {descrizione}`, canvas.width / 2, 70);
  ctx.fillText(`Peso: {peso} kg`, canvas.width / 2, 100);
  JsBarcode(canvas, barcode, { format: tipo === 'a_peso' ? 'EAN13' : 'CODE128', displayValue: false });

  setTimeout(() => {
    const dataUrl = canvas.toDataURL();
    const win = window.open();
    win.document.write('<img src="' + dataUrl + '" onload="window.print(); window.close();">');
    win.document.close();
  }, 300);
}

caricaArticoli();
aggiornaPreferiti();
