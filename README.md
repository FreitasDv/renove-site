# Renove Atlas Site

Status: prototipo local, nao publicado.  
Data: 2026-06-18.

## O que e

Prototipo estatico da nova presenca publica da Renove Clinic:

- Home institucional.
- LP de campanha para Google Ads em `/emagrecimento-bauru/`.
- Pagina base de harmonizacao facial em `/harmonizacao-facial-bauru/`.
- Pagina de equipe/credenciais em `/sobre/`.
- Pagina local/contato em `/contato/`.

Fonte publica atual: `https://renoveclinic.com.br/`, LP no ar feita pelo Henrique Sobral. Este prototipo nao altera a LP viva, WordPress, dominio, Google Ads, GBP, GTM, CRM, Digisac ou qualquer painel.

O Renove-OS/painel novo entra apenas como contexto interno de funil e qualificacao. Nenhum layout, rota, promessa ou bastidor de painel deve aparecer no site/LP.

## Como rodar

```powershell
cd tools\renove-atlas-site
npm run serve -- --port 4187
```

Abrir:

```text
http://127.0.0.1:4187/
http://127.0.0.1:4187/emagrecimento-bauru/
```

## QA

```powershell
npm run qa:content
npm run qa:visual
npm test
```

O `qa:content` verifica:

- paginas obrigatorias;
- termos proibidos no HTML publico;
- UTM nos CTAs de WhatsApp;
- CRM/RQE, CNPJ, endereco da LP viva e disclaimer;
- schema `MedicalClinic`, `FAQPage` e `BreadcrumbList`;
- schema por pagina: `Service`, `Physician` e `ContactPage`;
- nomes de assets sem termos sensiveis;
- tokens principais da identidade Renove;
- bloqueio de `clay` como cor de CTA/acesso.

O `qa:visual` abre 5 rotas em 5 viewports:

- 390
- 768
- 1024
- 1280
- 1600

Ele valida console errors, respostas 400+, overflow horizontal, H1, CTA e salva prints em:

```text
tools/renove-atlas-site/qa-artifacts/
```

Por padrao o QA visual usa a porta `4197` para nao conflitar com a pre-visualizacao local na `4187`. Para alterar:

```powershell
$env:RENOVE_ATLAS_QA_PORT=4198
npm run qa:visual
```

## Compliance

Este prototipo nao usa:

- nomes de farmacos;
- dose ou mg;
- termos de compra;
- antes/depois;
- KG + prazo;
- promessa absoluta.

Assets copiados:

- `assets/logo-renove.png`
- `assets/equipe-renove.webp`
- `assets/folhas-renove.png`
- `assets/favicon.svg` (icone de marca, gerado local)

Assets nao usados:

- qualquer antes/depois;
- qualquer arquivo com nomes sensiveis;
- imagens com resultado numerico.

## SEO e compartilhamento

Cada pagina publica traz:

- favicon SVG + fallback PNG e `theme-color`;
- Open Graph (`og:title`, `og:description`, `og:url`, `og:image`) e Twitter Card `summary_large_image`, para preview ao compartilhar link no WhatsApp e redes;
- imagem social padrao: `assets/equipe-renove.webp`.

Na raiz:

- `robots.txt` libera o site e bloqueia `/brief/`, apontando o sitemap;
- `sitemap.xml` lista as 6 paginas publicas.

Antes de publicar, confirmar o dominio final nas URLs absolutas de OG/canonical/sitemap (`https://renoveclinic.com.br/`).

Endereco em uso no prototipo: `Av. Affonso Jose Aiello, 10-95 - Vila Aviacao, Bauru - SP`, conforme LP viva revisada em 18/06/2026. Documentos antigos citam Prime Square; confirmar fonte final antes de qualquer publicacao.

## Antes de publicar

Portoes humanos obrigatorios:

- aprovar direcao visual;
- confirmar fotos autorizadas;
- confirmar horarios de atendimento;
- confirmar endereco final com Joao/Arildo/Henrique e Google Business Profile;
- confirmar link final da politica de privacidade;
- decidir se vira WordPress direto, tema/blocos ou handoff para Henrique/Sobral;
- revisar Google Ads/GBP/GTM/GA4 sem alterar nada ate aprovacao explicita.
