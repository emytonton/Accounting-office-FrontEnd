import React from 'react'

export const ICONS = {
  // Navigation
  dashboard:   'dashboard',
  business:    'business',
  assignment:  'assignment',
  receipt:     'receipt_long',
  payments:    'payments',
  users:       'manage_accounts',
  logout:      'logout',
  // Actions
  add:         'add',
  edit:        'edit',
  block:       'block',
  restore:     'restore',
  search:      'search',
  // Alerts / status
  warning:     'warning',
  info:        'info',
  checkCircle: 'check_circle',
  // Form sections
  person:      'person',
  lock:        'lock',
  folder:      'folder',
  // Auth
  arrowBack:   'arrow_back',
  email:       'mail',
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
