import React from 'react'

export const ICONS = {
  // Navigation
  dashboard:      'dashboard',
  business:       'business',
  assignment:     'assignment',
  receipt:        'receipt_long',
  payments:       'payments',
  users:          'manage_accounts',
  logout:         'logout',
  demandTypes:    'category',
  audit:          'manage_history',
  // Actions
  add:            'add',
  edit:           'edit',
  block:          'block',
  restore:        'restore',
  delete:         'delete',
  close:          'close',
  search:         'search',
  link:           'link',
  settings:       'settings',
  openCompetence: 'event_available',
  viewDetail:     'open_in_new',
  // Alerts / status
  warning:        'warning',
  info:           'info',
  checkCircle:    'check_circle',
  // Form sections
  person:         'person',
  lock:           'lock',
  folder:         'folder',
  subtask:        'checklist',
  calendar:       'calendar_month',
  // Auth
  arrowBack:      'arrow_back',
  email:          'mail',
}

export function Icon({ name, size = 20, fill = 0, style = {} }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 300, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {ICONS[name] ?? name}
    </span>
  )
}
