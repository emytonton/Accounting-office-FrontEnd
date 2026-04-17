function irParaStep(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function enviarLink() {
  const email = document.getElementById('input-email').value.trim();
  if (!email || !email.includes('@')) {
    alert('Informe um e-mail válido.');
    return;
  }
  document.getElementById('email-display').textContent = email;
  irParaStep('step-enviado');
}

function avaliarForca(senha) {
  const segs = [
    document.getElementById('seg1'), document.getElementById('seg2'),
    document.getElementById('seg3'), document.getElementById('seg4'),
  ];
  const label = document.getElementById('strength-label');
  segs.forEach(s => { s.className = 'strength-seg'; });

  let pontos = 0;
  if (senha.length >= 8)       pontos++;
  if (/[A-Z]/.test(senha))     pontos++;
  if (/[0-9]/.test(senha))     pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  const classes = ['weak', 'fair', 'good', 'good'];
  const labels  = ['Muito fraca', 'Fraca', 'Boa', 'Forte'];
  for (let i = 0; i < pontos; i++) segs[i].classList.add(classes[pontos - 1]);
  label.textContent = pontos > 0 ? labels[pontos - 1] : '';
}

function confirmarSenha() {
  const codigo = document.getElementById('input-codigo').value.trim();
  const nova   = document.getElementById('input-nova-senha').value;
  const conf   = document.getElementById('input-confirmar').value;
  if (!codigo)         { alert('Informe o código de verificação recebido por e-mail.'); return; }
  if (nova.length < 8) { alert('A senha deve ter ao menos 8 caracteres.'); return; }
  if (nova !== conf)   { alert('As senhas não coincidem.'); return; }
  irParaStep('step-sucesso');
}
