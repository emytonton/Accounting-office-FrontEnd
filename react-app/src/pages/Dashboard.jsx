import React from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral da operação</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 46 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Competência:</span>
            <select className="fi fi-w" style={{ height: 38 }}>
              <option>Abril / 2026</option>
              <option>Março / 2026</option>
              <option>Fevereiro / 2026</option>
            </select>
          </div>
        </div>

        <div className="content">
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
            <div className="stat-card stat-blue">
              <div className="stat-label">Empresas Ativas</div>
              <div className="stat-value">34</div>
              <div className="stat-sub">↑ 2 este mês</div>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-label">Demandas Concluídas</div>
              <div className="stat-value">127</div>
              <div className="stat-sub">de 160 geradas</div>
            </div>
            <div className="stat-card stat-yellow">
              <div className="stat-label">Demandas Pendentes</div>
              <div className="stat-value">24</div>
              <div className="stat-sub">8 com prazo hoje</div>
            </div>
            <div className="stat-card stat-red">
              <div className="stat-label">Em Atraso</div>
              <div className="stat-value">9</div>
              <div className="stat-sub">↑ 3 vs. mês anterior</div>
            </div>
            <div className="stat-card" style={{ borderTop: '3px solid #7C3AED' }}>
              <div className="stat-label">⚡ Risco de Prazo</div>
              <div className="stat-value" style={{ color: '#7C3AED' }}>5</div>
              <div className="stat-sub">demandas em risco esta semana</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">Demandas por Setor — Abr/2026</div>
              <div className="bar-chart">
                <div className="bar-wrap">
                  <div className="bar-val">58</div>
                  <div className="bar" style={{ height: 95 }}></div>
                  <div className="bar-lbl">Fiscal</div>
                </div>
                <div className="bar-wrap">
                  <div className="bar-val">47</div>
                  <div className="bar" style={{ height: 77, opacity: 0.7 }}></div>
                  <div className="bar-lbl">Pessoal</div>
                </div>
                <div className="bar-wrap">
                  <div className="bar-val">32</div>
                  <div className="bar" style={{ height: 52, opacity: 0.55 }}></div>
                  <div className="bar-lbl">Contábil</div>
                </div>
                <div className="bar-wrap">
                  <div className="bar-val">23</div>
                  <div className="bar" style={{ height: 38, opacity: 0.4 }}></div>
                  <div className="bar-lbl">Outros</div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">Recebimentos do Mês</div>
              <div className="donut-area">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="40" fill="none" stroke="#E5E7EB" strokeWidth="18" />
                  <circle
                    cx="55" cy="55" r="40"
                    fill="none" stroke="#2643FF" strokeWidth="18"
                    strokeDasharray="175 76" strokeDashoffset="62" strokeLinecap="round"
                  />
                  <circle
                    cx="55" cy="55" r="40"
                    fill="none" stroke="#16A34A" strokeWidth="18"
                    strokeDasharray="55 196" strokeDashoffset="-113" strokeLinecap="round"
                  />
                  <text x="55" y="51" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1E2939" fontFamily="Archivo,sans-serif">R$</text>
                  <text x="55" y="64" textAnchor="middle" fontSize="10" fill="#6B7280">28,4k</text>
                </svg>
                <div className="donut-legend">
                  <div className="leg-item">
                    <div className="leg-dot" style={{ background: '#2643FF' }}></div>Quitado — R$ 21.300
                  </div>
                  <div className="leg-item">
                    <div className="leg-dot" style={{ background: '#16A34A' }}></div>Parcial — R$ 7.100
                  </div>
                  <div className="leg-item">
                    <div className="leg-dot" style={{ background: '#E5E7EB' }}></div>Pendente — R$ 9.600
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 18, display: 'flex', gap: 14 }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/recibos')}>Ver Recibos</button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/recebimentos')}>Ver Recebimentos</button>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 22, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: 16, color: '#1E2939' }}>
                Demandas em Atraso
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#7C3AED', borderColor: '#DDD6FE' }}
                >
                  ⚡ Ver Central IA
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/demandas')}>
                  Ver todas
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Demanda</th>
                  <th>Setor</th>
                  <th>Risco IA</th>
                  <th>Prazo</th>
                  <th>Atraso</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw">Tech Solutions S/A</td>
                  <td>DCTF Mensal</td>
                  <td><span className="badge b-orange">Fiscal</span></td>
                  <td><span className="badge b-red">Alto</span></td>
                  <td>05/04/2026</td>
                  <td><span className="badge b-red">4 dias</span></td>
                </tr>
                <tr>
                  <td className="fw">Padaria São João Ltda</td>
                  <td>Folha de Pagamento</td>
                  <td><span className="badge b-blue">Pessoal</span></td>
                  <td><span className="badge b-yellow">Médio</span></td>
                  <td>07/04/2026</td>
                  <td><span className="badge b-red">2 dias</span></td>
                </tr>
                <tr>
                  <td className="fw">Mercearia do Bairro ME</td>
                  <td>Apuração Simples</td>
                  <td><span className="badge b-orange">Fiscal</span></td>
                  <td><span className="badge b-green">Baixo</span></td>
                  <td>08/04/2026</td>
                  <td><span className="badge b-yellow">1 dia</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
