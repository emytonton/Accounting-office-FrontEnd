import React from 'react'

function calcStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const LABELS = ['', 'Muito fraca', 'Fraca', 'Boa', 'Forte']
const CLASSES = ['', 'weak', 'fair', 'good', 'good']

export default function PasswordStrength({ password }) {
  if (!password) return null
  const score = calcStrength(password)

  return (
    <div className="strength-wrap">
      <div className="strength-bar">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`strength-seg${i <= score ? ` ${CLASSES[score]}` : ''}`}
          />
        ))}
      </div>
      <span className="strength-text">{score > 0 ? LABELS[score] : ''}</span>
    </div>
  )
}
