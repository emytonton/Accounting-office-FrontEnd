import React, { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { getLinksCatalog, createLink, updateLink, deleteLink } from '../api/demandLinkService'
import { getCompany } from '../api/companyService'
import { SECTOR_ORDER, normalizeSector, sectorLabel, sectorBadge } from '../constants/sectors'

function groupBySector(catalog) {
  const known = SECTOR_ORDER.reduce((acc, sector) => {
    const items = catalog.filter(c => normalizeSector(c.sector) === sector)
    if (items.length > 0) acc.push({ sector, items })
    return acc
  }, [])
  const knownSet = new Set(SECTOR_ORDER)
  const otherSectors = [...new Set(
    catalog.filter(c => !knownSet.has(normalizeSector(c.sector))).map(c => c.sector)
  )]
  otherSectors.forEach(sector => {
    const items = catalog.filter(c => c.sector === sector)
    if (items.length > 0) known.push({ sector, items })
  })
  return known
}

export default function CompanyLinks() {
  const { id: companyId } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [companyName, setCompanyName]   = useState(state?.company?.name ?? '')
  const [catalog, setCatalog]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    load()
    if (!companyName) {
      getCompany(companyId)
        .then(c => setCompanyName(c?.name ?? ''))
        .catch(() => {})
    }
  }, [companyId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getLinksCatalog(companyId)
      setCatalog(Array.isArray(data) ? data : [])
    } catch {
      setError('Não foi possível carregar os tipos de demanda. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleLink(item) {
    setActionLoading(item.demandTypeId)
    setError('')
    try {
      if (item.linked) {
        await deleteLink(companyId, item.linkId)
        setCatalog(prev => prev.map(c =>
          c.demandTypeId === item.demandTypeId
            ? { ...c, linked: false, linkId: undefined, subtasksEnabled: undefined }
            : c
        ))
      } else {
        const created = await createLink(companyId, {
          demandTypeId: item.demandTypeId,
          subtasksEnabled: item.hasSubtasks,
        })
        setCatalog(prev => prev.map(c =>
          c.demandTypeId === item.demandTypeId
            ? { ...c, linked: true, linkId: created.id, subtasksEnabled: created.subtasksEnabled }
            : c
        ))
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setError(msg || 'Não foi possível atualizar o vínculo. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleToggleSubtasks(item, enabled) {
    setActionLoading(`${item.demandTypeId}_sub`)
    try {
      await updateLink(companyId, item.linkId, { subtasksEnabled: enabled })
      setCatalog(prev => prev.map(c =>
        c.demandTypeId === item.demandTypeId ? { ...c, subtasksEnabled: enabled } : c
      ))
    } catch {
      setError('Não foi possível atualizar a configuração de subtarefas.')
    } finally {
      setActionLoading(null)
    }
  }

  const grouped = groupBySector(catalog)
  const linkedCount = catalog.filter(c => c.linked).length

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Vínculos</h1>
            <p className="page-subtitle">{companyName}</p>
          </div>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link to="/empresas">Empresas</Link>
            <span>›</span>
            <span>{companyName || 'Empresa'}</span>
            <span>›</span>
            <span>Tipos de Demanda</span>
          </div>

          {!isAdmin && (
            <div className="alert-info" style={{ marginBottom: 20 }}>
              <Icon name="info" size={18} />
              <span>Apenas administradores podem alterar os vínculos.</span>
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: 16 }}>
              <Icon name="warning" size={18} /> {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
            </div>
          ) : catalog.length === 0 ? (
            <div className="empty-state">Nenhum tipo de demanda cadastrado no sistema.</div>
          ) : (
            <>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
                {linkedCount} de {catalog.length} tipo{catalog.length !== 1 ? 's' : ''} vinculado{linkedCount !== 1 ? 's' : ''} a esta empresa.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {grouped.map(({ sector, items }) => {
                  const linkedInSector = items.filter(i => i.linked).length
                  return (
                    <div key={sector} className="vinculo-sector-group">
                      <div className="vinculo-sector-title">
                        <span className={`badge ${sectorBadge(sector)}`} style={{ marginRight: 8 }}>
                          {sectorLabel(sector)}
                        </span>
                        <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>
                          {linkedInSector}/{items.length} vinculados
                        </span>
                      </div>

                      <div className="vinculos-grid">
                        {items.map(item => {
                          const isLinking    = actionLoading === item.demandTypeId
                          const isSubLoading = actionLoading === `${item.demandTypeId}_sub`
                          const isBusy       = isLinking || isSubLoading
                          const disabled     = !isAdmin || isLinking || !item.isActive

                          return (
                            <div
                              key={item.demandTypeId}
                              className={`vinculo-item${item.linked ? ' checked' : ''}${!item.isActive ? ' disabled' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={!!item.linked}
                                disabled={disabled}
                                onChange={() => handleToggleLink(item)}
                              />
                              <div className="vinculo-item-body">
                                <div className="vinculo-item-name">{item.name}</div>
                                <div className="vinculo-item-meta">
                                  {!item.isActive && (
                                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>Inativo</span>
                                  )}
                                  {item.linked && item.hasSubtasks && (
                                    <label className="toggle-wrap" style={{ fontSize: 12 }} onClick={e => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={!!item.subtasksEnabled}
                                        disabled={!isAdmin || isSubLoading}
                                        onChange={e => handleToggleSubtasks(item, e.target.checked)}
                                      />
                                      <span>Subtarefas</span>
                                    </label>
                                  )}
                                  {isBusy && (
                                    <span className="spinner" style={{
                                      width: 12, height: 12, borderWidth: 2,
                                      borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF',
                                    }} />
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
