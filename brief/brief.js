var form = document.getElementById('brief');
var fill = document.getElementById('fill');
var plabel = document.getElementById('plabel');

function progress() {
  var seen = {};
  var total = 0, done = 0;
  form.querySelectorAll('textarea,input[type=text],input[type=tel],input[type=email]').forEach(function (el) {
    total++;
    if (el.value.trim()) done++;
  });
  form.querySelectorAll('input[type=radio]').forEach(function (r) {
    if (!seen[r.name]) {
      seen[r.name] = true;
      total++;
      if (form.querySelector('input[name="' + r.name + '"]:checked')) done++;
    }
  });
  var pct = total ? Math.round(done / total * 100) : 0;
  fill.style.width = pct + '%';
  plabel.textContent = pct + '% preenchido';
}
form.addEventListener('input', progress);
form.addEventListener('change', progress);

function val(n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; }
function radio(n) { var el = form.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ''; }
function checks(n) {
  return Array.prototype.map.call(
    form.querySelectorAll('input[name="' + n + '"]:checked'),
    function (e) { return e.value; }
  ).join(', ');
}

function build() {
  var L = [];
  L.push('BRIEFING - SITE E LANDING PAGE RENOVE CLINIC');
  L.push('Preenchido em: ' + new Date().toLocaleString('pt-BR'));
  L.push('');
  L.push('== 1. A CLINICA ==');
  L.push('Frase de apresentacao: ' + (val('frase_clinica') || '(usar sugestao)'));
  L.push('Diferencial principal: ' + (val('diferencial') || '(nao respondido)'));
  L.push('Horario: ' + (val('horario') || '(pendente)'));
  L.push('Endereco: ' + (radio('end_ok') === 'corrigir' ? val('end_novo') : 'Av. Affonso Jose Aiello, 10-95 - Vila Aviacao, Bauru/SP (confirmado)'));
  L.push('');
  L.push('== 2. DRA. JULIANA ==');
  L.push('Bio: ' + (val('juliana_bio') || '(usar texto da LP atual)'));
  L.push('CRM/RQE: ' + (radio('crm_ok') === 'corrigir' ? val('crm_novo') : 'CRM-SP 182.823 | RQE 133.088 (confirmado)'));
  L.push('Foto: ' + (radio('foto_juliana') || '(nao respondido)'));
  L.push('');
  L.push('== 3. CAROLINE (NUTRI) ==');
  L.push('Aparece no site: ' + (radio('carol_aparece') || '(nao respondido)'));
  L.push('Descricao da nutricao: ' + (val('nutri_desc') || '(usar sugestao)'));
  L.push('CRN: ' + (val('carol_crn') || '(nao informado)'));
  L.push('');
  L.push('== 4. OFERTA E PRECOS ==');
  L.push('Precos: ' + (radio('precos_ok') || '(nao respondido)') + (val('precos_novo') ? ' | Ajuste: ' + val('precos_novo') : ''));
  L.push('Entregaveis: ' + (val('entregaveis') || '(usar lista conhecida)'));
  L.push('HOF no site: ' + (radio('hof') || '(nao respondido)'));
  L.push('');
  L.push('== 5. TOM E MARCA ==');
  L.push('Sensacao desejada: ' + (checks('tom') || '(nao respondido)'));
  L.push('Referencias admiradas: ' + (val('referencias') || '(nenhuma)'));
  L.push('O que evitar: ' + (val('evitar') || '(nada citado)'));
  L.push('Observacoes extras: ' + (val('extra') || '(nenhuma)'));
  return L.join('\n');
}

document.getElementById('gen').addEventListener('click', function () {
  document.getElementById('result').value = build();
  document.getElementById('out').classList.add('show');
  document.getElementById('out').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('copy').addEventListener('click', function () {
  var r = document.getElementById('result');
  r.select();
  navigator.clipboard.writeText(r.value).then(function () {
    document.getElementById('copied').textContent = 'Copiado!';
  });
});
document.getElementById('download').addEventListener('click', function () {
  var blob = new Blob([build()], { type: 'text/plain' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'briefing-renove.txt';
  a.click();
});
document.getElementById('reset').addEventListener('click', function () {
  if (confirm('Limpar todas as respostas?')) {
    form.reset();
    progress();
    document.getElementById('out').classList.remove('show');
  }
});
progress();
