/* ═══════════════════════════════════════════════════════════════════
   FUNGUYS — Simuladores de Cultivo
   - Simulador BÁSICO: Home page (lead magnet)
   - Simulador AVANZADO: Página de cursos (contenido premium)
   ═══════════════════════════════════════════════════════════════════ */

// Configuración de especies
const SPECIES_CONFIG = {
  girgola_gris: {
    name: 'Gírgola Gris',
    beBase: 70,
    flushDist: [0.50, 0.30, 0.15, 0.05],
    days: [15, 25],
    mult: { optimas: 1.0, buenas: 0.79, basicas: 0.57 },
    description: 'La más eficiente para iniciar. Ciclos cortos, alta demanda en restaurantes y ferias.'
  },
  girgola_reina: {
    name: 'Gírgola Reina',
    beBase: 60,
    flushDist: [0.52, 0.28, 0.14, 0.06],
    days: [20, 35],
    mult: { optimas: 1.0, buenas: 0.80, basicas: 0.58 },
    description: 'Mayor valor gastronómico y precio de venta. Sustrato específico requerido.'
  },
  shiitake: {
    name: 'Shiitake',
    beBase: 55,
    flushDist: [0.45, 0.30, 0.18, 0.07],
    days: [45, 75],
    mult: { optimas: 1.0, buenas: 0.76, basicas: 0.55 },
    description: 'Ciclo más largo, requiere madera o bloque enriquecido. Alto valor comercial.'
  }
};

const HUMEDAD_SUSTRATO = 0.625;
const FACTOR_SECO = 1 - HUMEDAD_SUSTRATO;

// ═══════════════════════════════════════════════════════════════════
// SIMULADOR BÁSICO (Lead Magnet)
// ═══════════════════════════════════════════════════════════════════

class BasicSimulator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = {};
    this.unlocked = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="simulator-basic">
        <div class="sim-header">
          <h3>🍄 Calculá tu producción estimada</h3>
          <p class="text-muted">Ingresá los datos de tu cultivo y descubrí cuántos kg podés cosechar</p>
        </div>

        <div class="sim-controls">
          <div class="sim-control-group">
            <label>Especie</label>
            <select id="simBasicEspecie" class="sim-select">
              <option value="girgola_gris">Gírgola Gris (recomendado para empezar)</option>
              <option value="girgola_reina">Gírgola Reina</option>
              <option value="shiitake">Shiitake</option>
            </select>
          </div>

          <div class="sim-control-group">
            <label>
              Sustrato húmedo
              <span id="simBasicKgVal" class="sim-value">5 kg</span>
            </label>
            <input type="range" id="simBasicKg" min="1" max="50" value="5" class="sim-slider">
            <div class="sim-range-labels">
              <span>1 kg</span>
              <span>50 kg</span>
            </div>
          </div>

          <div class="sim-control-group">
            <label>
              Oleadas / flushes
              <span id="simBasicFlushesVal" class="sim-value">3</span>
            </label>
            <input type="range" id="simBasicFlushes" min="1" max="4" value="3" class="sim-slider">
            <div class="sim-range-labels">
              <span>1</span>
              <span>4</span>
            </div>
          </div>
        </div>

        <div id="simBasicResults" class="sim-results" style="display: none;">
          <div class="sim-result-card">
            <div class="sim-result-label">Rendimiento total</div>
            <div class="sim-result-value"><span id="resBasicRend">0</span> kg</div>
          </div>
          <div class="sim-result-card">
            <div class="sim-result-label">Eficiencia biológica</div>
            <div class="sim-result-value"><span id="resBasicEB">0</span>%</div>
          </div>
          <div class="sim-result-card">
            <div class="sim-result-label">Duración estimada</div>
            <div class="sim-result-value"><span id="resBasicDias">0</span> días</div>
          </div>
        </div>

        <div class="sim-cta">
          <button id="btnCalculateBasic" class="btn btn-primary btn-large" style="width: 100%;">
            📊 Calcular proyección
          </button>
        </div>

        <p class="sim-disclaimer">
          * Estimación basada en condiciones estándar de cultivo. Resultados reales pueden variar.
        </p>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const btnCalc = document.getElementById('btnCalculateBasic');
    const sliders = ['simBasicKg', 'simBasicFlushes'];
    
    // Actualizar valores de sliders
    document.getElementById('simBasicKg').addEventListener('input', (e) => {
      document.getElementById('simBasicKgVal').textContent = e.target.value + ' kg';
      if (this.unlocked) this.calculate();
    });

    document.getElementById('simBasicFlushes').addEventListener('input', (e) => {
      document.getElementById('simBasicFlushesVal').textContent = e.target.value;
      if (this.unlocked) this.calculate();
    });

    document.getElementById('simBasicEspecie').addEventListener('change', () => {
      if (this.unlocked) this.calculate();
    });

    btnCalc.addEventListener('click', () => {
      if (!this.unlocked) {
        this.openLeadModal();
      } else {
        this.calculate();
      }
    });
  }

  calculate() {
    const especie = document.getElementById('simBasicEspecie').value;
    const kgHumedo = parseFloat(document.getElementById('simBasicKg').value);
    const flushes = parseInt(document.getElementById('simBasicFlushes').value);
    
    const config = SPECIES_CONFIG[especie];
    const cond = 'buenas'; // Asumimos condiciones buenas para el simulador básico
    const mult = config.mult[cond];
    
    const kgSeco = kgHumedo * FACTOR_SECO;
    const beEfectivo = config.beBase * mult;
    
    const distTotal = config.flushDist.reduce((a,b) => a+b, 0);
    const distParcial = config.flushDist.slice(0, flushes).reduce((a,b) => a+b, 0);
    const fraccion = distParcial / distTotal;
    
    const totalRend = (kgSeco * beEfectivo / 100) * fraccion;
    const ebMostrar = Math.round(beEfectivo * fraccion);
    
    this.data = {
      especie,
      especieNombre: config.name,
      kgHumedo,
      kgSeco: kgSeco.toFixed(1),
      flushes,
      totalRend: totalRend.toFixed(1),
      beEfectivo: ebMostrar,
      dias: config.days[0] + '–' + config.days[1]
    };

    document.getElementById('resBasicRend').textContent = this.data.totalRend;
    document.getElementById('resBasicEB').textContent = this.data.beEfectivo;
    document.getElementById('resBasicDias').textContent = this.data.dias;
    document.getElementById('simBasicResults').style.display = 'grid';
  }

  openLeadModal() {
    const modal = document.createElement('div');
    modal.id = 'leadModalBasic';
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="document.getElementById('leadModalBasic').remove()"></div>
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>🎯 Desbloqueá tu proyección</h3>
          <button onclick="document.getElementById('leadModalBasic').remove()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="text-muted mb-lg">
            Ingresá tus datos para ver los resultados completos + recibí una guía PDF gratis sobre 
            <strong>cómo optimizar tu eficiencia biológica</strong>.
          </p>

          <div class="form-group">
            <label>Nombre *</label>
            <input type="text" id="leadBasicNombre" placeholder="Juan Pérez" required>
          </div>

          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="leadBasicEmail" placeholder="juan@ejemplo.com" required>
          </div>

          <div class="form-group">
            <label>WhatsApp (opcional)</label>
            <input type="tel" id="leadBasicWA" placeholder="+54 9 11 1234-5678">
          </div>

          <div id="leadBasicError" style="display: none; color: #fca5a5; background: rgba(220,38,38,0.12); 
               padding: 12px; border-radius: 8px; font-size: 14px;"></div>
        </div>
        <div class="modal-footer">
          <button onclick="document.getElementById('leadModalBasic').remove()" class="btn btn-secondary">Cancelar</button>
          <button onclick="submitBasicLead()" class="btn btn-primary">Ver mi proyección →</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
  }

  unlock() {
    this.unlocked = true;
    document.getElementById('btnCalculateBasic').innerHTML = '🔄 Recalcular';
    this.calculate();
  }
}

// Función global para submit del lead
window.submitBasicLead = async function() {
  const nombre = document.getElementById('leadBasicNombre').value.trim();
  const email = document.getElementById('leadBasicEmail').value.trim();
  const wa = document.getElementById('leadBasicWA').value.trim();
  const errorEl = document.getElementById('leadBasicError');

  if (!nombre) {
    errorEl.textContent = 'Por favor ingresá tu nombre';
    errorEl.style.display = 'block';
    return;
  }

  if (!email || !email.includes('@')) {
    errorEl.textContent = 'Por favor ingresá un email válido';
    errorEl.style.display = 'block';
    return;
  }

  // Guardar lead en Google Sheets
  const leadData = {
    timestamp: new Date().toISOString(),
    nombre,
    email,
    whatsapp: wa,
    source: 'simulador_basico_home'
  };

  try {
    if (window.LEADS_SCRIPT_URL && window.LEADS_SCRIPT_URL !== 'REEMPLAZAR_CON_URL') {
      await fetch(window.LEADS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
    }
  } catch (err) {
    console.warn('No se pudo guardar el lead:', err);
  }

  // Cerrar modal
  document.getElementById('leadModalBasic').remove();
  document.body.style.overflow = '';

  // Desbloquear simulador
  window.basicSimulator.unlock();

  // Mostrar confirmación
  cart.showNotification('✅ ¡Listo! Revisá tu email por la guía PDF');
};

// ═══════════════════════════════════════════════════════════════════
// SIMULADOR AVANZADO (Contenido del curso)
// ═══════════════════════════════════════════════════════════════════

class AdvancedSimulator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = {};
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="simulator-advanced">
        <div class="sim-header">
          <h3>🔬 Simulador Avanzado de Producción</h3>
          <p class="text-muted">Calcula rendimientos detallados por oleada y optimiza tu producción</p>
        </div>

        <div class="sim-controls-advanced">
          <div class="sim-row">
            <div class="sim-control-group">
              <label>Especie</label>
              <select id="simAdvEspecie" class="sim-select">
                <option value="girgola_gris">Gírgola Gris</option>
                <option value="girgola_reina">Gírgola Reina</option>
                <option value="shiitake">Shiitake</option>
              </select>
            </div>

            <div class="sim-control-group">
              <label>Condiciones de cultivo</label>
              <select id="simAdvCondicion" class="sim-select">
                <option value="optimas">Óptimas (control total)</option>
                <option value="buenas" selected>Buenas (control básico)</option>
                <option value="basicas">Básicas (sin control)</option>
              </select>
            </div>
          </div>

          <div class="sim-row">
            <div class="sim-control-group">
              <label>
                Sustrato húmedo
                <span id="simAdvKgVal" class="sim-value">10 kg</span>
              </label>
              <input type="range" id="simAdvKg" min="1" max="100" value="10" class="sim-slider">
            </div>

            <div class="sim-control-group">
              <label>
                Oleadas / flushes
                <span id="simAdvFlushesVal" class="sim-value">4</span>
              </label>
              <input type="range" id="simAdvFlushes" min="1" max="4" value="4" class="sim-slider">
            </div>
          </div>
        </div>

        <button id="btnCalculateAdv" class="btn btn-primary btn-large" style="width: 100%; margin: 24px 0;">
          📊 Calcular proyección detallada
        </button>

        <div id="simAdvResults" class="sim-results-advanced" style="display: none;">
          <div class="results-summary">
            <div class="result-card-large">
              <div class="result-icon">📈</div>
              <div class="result-label">Rendimiento total</div>
              <div class="result-value-large"><span id="resAdvRend">0</span> kg</div>
            </div>
            <div class="result-card-large">
              <div class="result-icon">⚡</div>
              <div class="result-label">Eficiencia biológica</div>
              <div class="result-value-large"><span id="resAdvEB">0</span>%</div>
            </div>
            <div class="result-card-large">
              <div class="result-icon">⏱️</div>
              <div class="result-label">Duración total</div>
              <div class="result-value-large"><span id="resAdvDias">0</span> días</div>
            </div>
          </div>

          <div class="flush-breakdown">
            <h4>Rendimiento por oleada</h4>
            <div id="flushTable"></div>
          </div>

          <div class="sim-insights">
            <h4>💡 Análisis y recomendaciones</h4>
            <div id="simInsights"></div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Sliders
    document.getElementById('simAdvKg').addEventListener('input', (e) => {
      document.getElementById('simAdvKgVal').textContent = e.target.value + ' kg';
    });

    document.getElementById('simAdvFlushes').addEventListener('input', (e) => {
      document.getElementById('simAdvFlushesVal').textContent = e.target.value;
    });

    // Botón calcular
    document.getElementById('btnCalculateAdv').addEventListener('click', () => {
      this.calculate();
    });

    // Auto-recalcular al cambiar especie o condición
    document.getElementById('simAdvEspecie').addEventListener('change', () => this.calculate());
    document.getElementById('simAdvCondicion').addEventListener('change', () => this.calculate());
  }

  calculate() {
    const especie = document.getElementById('simAdvEspecie').value;
    const kgHumedo = parseFloat(document.getElementById('simAdvKg').value);
    const cond = document.getElementById('simAdvCondicion').value;
    const flushes = parseInt(document.getElementById('simAdvFlushes').value);
    
    const config = SPECIES_CONFIG[especie];
    const mult = config.mult[cond];
    
    const kgSeco = kgHumedo * FACTOR_SECO;
    const beEfectivo = config.beBase * mult;
    
    const distTotal = config.flushDist.reduce((a,b) => a+b, 0);
    const distParcial = config.flushDist.slice(0, flushes).reduce((a,b) => a+b, 0);
    const fraccion = distParcial / distTotal;
    
    const totalRend = (kgSeco * beEfectivo / 100) * fraccion;
    const ebMostrar = Math.round(beEfectivo * fraccion);
    
    // Calcular por oleada
    const flushData = [];
    let acumulado = 0;
    for (let i = 0; i < flushes; i++) {
      const rendOleada = (kgSeco * beEfectivo / 100) * config.flushDist[i];
      acumulado += rendOleada;
      flushData.push({
        num: i + 1,
        rendimiento: rendOleada.toFixed(2),
        porcentaje: (config.flushDist[i] * 100).toFixed(0),
        acumulado: acumulado.toFixed(2)
      });
    }

    // Actualizar resultados
    document.getElementById('resAdvRend').textContent = totalRend.toFixed(2);
    document.getElementById('resAdvEB').textContent = ebMostrar;
    document.getElementById('resAdvDias').textContent = config.days[0] + '–' + config.days[1];

    // Tabla de oleadas
    let tableHTML = `
      <table class="flush-table">
        <thead>
          <tr>
            <th>Oleada</th>
            <th>Kg estimados</th>
            <th>% del total</th>
            <th>Acumulado</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    flushData.forEach(f => {
      tableHTML += `
        <tr>
          <td>#${f.num}</td>
          <td><strong>${f.rendimiento} kg</strong></td>
          <td>${f.porcentaje}%</td>
          <td>${f.acumulado} kg</td>
        </tr>
      `;
    });
    
    tableHTML += `
        </tbody>
      </table>
    `;
    
    document.getElementById('flushTable').innerHTML = tableHTML;

    // Insights
    const insights = this.generateInsights(config, cond, ebMostrar, totalRend, kgHumedo);
    document.getElementById('simInsights').innerHTML = insights;

    document.getElementById('simAdvResults').style.display = 'block';
  }

  generateInsights(config, cond, eb, rend, kgHumedo) {
    let insights = '<ul class="insights-list">';
    
    // Insight sobre eficiencia
    if (eb >= 60) {
      insights += '<li class="insight-good">✅ Excelente eficiencia biológica. Tus condiciones son ideales.</li>';
    } else if (eb >= 40) {
      insights += '<li class="insight-ok">⚠️ Eficiencia aceptable. Podés mejorar optimizando temperatura y humedad.</li>';
    } else {
      insights += '<li class="insight-bad">❌ Eficiencia baja. Revisá condiciones ambientales y calidad del sustrato.</li>';
    }

    // Insight sobre rendimiento
    const rendPorKg = (rend / kgHumedo).toFixed(2);
    insights += `<li class="insight-info">📊 Estás produciendo ${rendPorKg} kg de hongos por cada kg de sustrato húmedo.</li>`;

    // Insight específico de la especie
    insights += `<li class="insight-info">🍄 ${config.description}</li>`;

    // Insight sobre condiciones
    if (cond === 'basicas') {
      insights += '<li class="insight-warn">💡 Con condiciones básicas, considerá invertir en control de temperatura y humedad para aumentar un 30-40% el rendimiento.</li>';
    } else if (cond === 'buenas') {
      insights += '<li class="insight-ok">💡 Upgrade a condiciones óptimas podría aumentar tu rendimiento un 20-25%.</li>';
    }

    insights += '</ul>';
    return insights;
  }
}

// CSS para simuladores
const simulatorStyles = document.createElement('style');
simulatorStyles.textContent = `
  .simulator-basic, .simulator-advanced {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
  }

  .sim-header {
    margin-bottom: var(--space-lg);
    text-align: center;
  }

  .sim-header h3 {
    font-size: 28px;
    margin-bottom: var(--space-sm);
  }

  .sim-controls, .sim-controls-advanced {
    margin-bottom: var(--space-lg);
  }

  .sim-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }

  .sim-control-group {
    margin-bottom: var(--space-md);
  }

  .sim-control-group label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm);
    font-weight: 500;
    color: var(--cream);
  }

  .sim-value {
    color: var(--amber);
    font-weight: 700;
    font-family: 'Fraunces', serif;
  }

  .sim-select {
    width: 100%;
    padding: 12px 16px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--cream);
    font-size: 15px;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .sim-select:focus {
    outline: none;
    border-color: var(--amber);
  }

  .sim-slider {
    width: 100%;
    height: 8px;
    background: var(--surface2);
    border-radius: 4px;
    outline: none;
    -webkit-appearance: none;
  }

  .sim-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: var(--amber);
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .sim-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .sim-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: var(--amber);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .sim-range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--cream-muted);
    margin-top: 4px;
  }

  .sim-results {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-md);
    margin: var(--space-lg) 0;
    padding: var(--space-lg);
    background: var(--surface2);
    border-radius: var(--radius);
  }

  .sim-result-card {
    text-align: center;
  }

  .sim-result-label {
    font-size: 13px;
    color: var(--cream-muted);
    margin-bottom: 8px;
  }

  .sim-result-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--amber);
    font-family: 'Fraunces', serif;
  }

  .sim-disclaimer {
    font-size: 13px;
    color: var(--cream-muted);
    text-align: center;
    font-style: italic;
    margin-top: var(--space-md);
  }

  /* Advanced simulator styles */
  .results-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  .result-card-large {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--space-lg);
    text-align: center;
  }

  .result-icon {
    font-size: 40px;
    margin-bottom: var(--space-sm);
  }

  .result-value-large {
    font-size: 36px;
    font-weight: 700;
    color: var(--amber);
    font-family: 'Fraunces', serif;
    margin-top: var(--space-sm);
  }

  .flush-breakdown {
    margin: var(--space-xl) 0;
  }

  .flush-breakdown h4 {
    margin-bottom: var(--space-md);
  }

  .flush-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface2);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .flush-table th {
    background: var(--surface);
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid var(--border);
  }

  .flush-table td {
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }

  .flush-table tr:last-child td {
    border-bottom: none;
  }

  .sim-insights {
    margin-top: var(--space-xl);
    padding: var(--space-lg);
    background: var(--surface2);
    border-radius: var(--radius);
  }

  .sim-insights h4 {
    margin-bottom: var(--space-md);
  }

  .insights-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .insights-list li {
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    line-height: 1.6;
  }

  .insight-good {
    background: rgba(107,158,94,0.12);
    color: var(--sage-light);
  }

  .insight-ok {
    background: rgba(212,150,58,0.12);
    color: var(--amber);
  }

  .insight-bad {
    background: rgba(220,38,38,0.12);
    color: #fca5a5;
  }

  .insight-info {
    background: var(--surface);
    color: var(--cream);
  }

  .insight-warn {
    background: rgba(212,150,58,0.08);
    color: var(--amber-light);
  }
`;

document.head.appendChild(simulatorStyles);
