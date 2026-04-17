# Justificativa Técnica — Protótipos SGEC
## Sistema de Gestão de Empresas Contábeis — Hub Accounting

---

## 1. Problema e Contexto

O escritório contábil opera com processos manuais baseados em papel e planilhas, gerando
dificuldades de rastreamento de pendências, controle de prazos por setor, acompanhamento
de demandas mensais e registro de recebimentos de honorários.

O sistema proposto (SGEC) centraliza essas operações em uma aplicação web multi-perfil,
com isolamento por escritório (tenant), controle de acesso granular e rastreabilidade completa.

---

## 2. Decisões de Design e Justificativas

### 2.1 Arquitetura de Navegação

**Decisão:** sidebar fixa de 250 px com seis itens principais + seção de usuário com logout.

**Justificativa:**
- O sistema possui atores com perfis distintos (Administrador e Colaborador, RF-005). A sidebar
  permanece visível em todas as telas para reduzir o número de cliques nos fluxos críticos (RNF-006: ≤ 10 cliques a partir do painel).
- O item ativo é destacado com cor primária (#2643FF), dando orientação espacial clara ao usuário.
- O rodapé da sidebar exibe nome, perfil e botão de logout explícito (RF-006, RNF-002).

### 2.2 Identidade Visual

**Paleta de cores:**
| Token          | Hex       | Uso                                  |
|----------------|-----------|--------------------------------------|
| Primário       | `#2643FF` | Botões, sidebar ativo, links         |
| Título         | `#155DFC` | Headings de página (52 px)           |
| Subtítulo      | `#002FBB` | Subtítulos com letter-spacing 2 px   |
| Texto escuro   | `#1E2939` | Conteúdo de tabela, labels           |
| Texto médio    | `#364153` | Cabeçalhos de tabela                 |
| Fundo suave    | `#F9FAFB` | Background de telas de listagem      |
| Header band    | `rgba(237,245,255,0.55)` | Faixa de topo de cada tela |

**Tipografia:**
- **Archivo SemiBold** — títulos de página, itens da sidebar, botões primários
- **Inter Regular / Medium / SemiBold** — corpo, rótulos de formulário, células de tabela

**Decisão:** reproduzir exatamente o sistema visual já definido nas telas existentes do Figma
(Login, Dashboard, Empresas, Demandas, Recibos, Recebimentos), garantindo consistência total
entre telas novas e existentes (RNF-011: contraste WCAG 2.1 AA).

### 2.3 Componentes Reutilizados

| Componente        | Especificação                                           | RNF relacionado |
|-------------------|---------------------------------------------------------|-----------------|
| Card              | `border-radius: 14px`, sombra `0 4px 6px rgba(0,0,0,.07)` | —            |
| Botão primário    | bg `#2643FF`, `border-radius: 10px`, h 46 px, Archivo 600 | RNF-006       |
| Input / Select    | bg `#F9FAFB`, border `#D1D5DC`, radius 10 px, focus ring azul | RNF-011  |
| Status badge      | Pílula colorida por estado (green/yellow/orange/red/gray) | —             |
| Barra de progresso| 6 px, radius 3 px, cor varia por estado (azul/verde/vermelho) | RF-020, RF-022 |
| Toast             | Feedback instantâneo após ações de salvar/cancelar     | RNF-006        |

---

## 3. Telas Criadas e Alinhamento com Requisitos

### Tela 1 — Login
| Elemento           | Requisito coberto          |
|--------------------|---------------------------|
| Campo e-mail + senha | RF-001                  |
| Botão "Entrar"     | RF-001, RNF-002            |
| Enter aciona login | RNF-006 (fluidez)          |
> Fluxo alternativo (FA-A01a) tratado via mensagem genérica, sem indicar qual campo falhou (segurança).

### Tela 2 — Dashboard
| Elemento                        | Requisito coberto           |
|---------------------------------|-----------------------------|
| 4 cards de KPIs                 | RF-022 — indicadores agregados |
| Tabela "Demandas em Atraso"     | RF-020, RF-021, RN-009       |
| Gráfico "Demandas por Setor"    | RF-021, RF-022               |
| Gráfico "Recebimentos do Mês"   | RF-037                       |
| Seletor de Competência          | RF-015                       |

### Tela 3 — Empresas (Listagem)
| Elemento                        | Requisito coberto            |
|---------------------------------|------------------------------|
| Busca por nome / CNPJ           | RF-010                       |
| Filtros regime e status         | RF-010                       |
| Coluna Status (Ativo/Inativo)   | RF-009, RN-003               |
| Botão Inativar com modal        | RF-009, RN-003               |
| Botão Reativar para inativos    | RF-009                       |

### Tela 4 — Cadastro de Empresa (2 abas)
**Aba 1 — Dados Cadastrais:**
| Elemento            | Requisito coberto            |
|---------------------|------------------------------|
| Razão Social, CNPJ  | RF-008, RN-016 (unicidade CNPJ) |
| Regime tributário   | RF-008                       |
| Máscara de CNPJ     | Usabilidade (RNF-006)        |
| Status Ativo/Inativo| RF-009                       |

**Aba 2 — Vínculos de Demanda:**
| Elemento               | Requisito coberto             |
|------------------------|-------------------------------|
| Checklist por setor    | RF-014, UC-E02                |
| Subtarefas opcionais   | RF-013                        |
| RN-010 (tipos por setor)| RN-010                       |

### Tela 5 — Demandas (com aba Tipos de Demanda)
| Elemento                      | Requisito coberto              |
|-------------------------------|--------------------------------|
| Filtro Competência/Setor/Status| RF-015, RF-016                |
| Cards Total/Concluídas/Em Andamento/Atrasadas | RF-022         |
| Progresso por linha (barra)   | RF-022, RF-018                 |
| Badge "Atrasada" em vermelho  | RF-020, RN-009                 |
| Clique na linha → modal detalhe | RF-017, RF-018, RF-019, RF-023 |
| Subtarefas interativas no modal | RF-018, RN-004               |
| Campo de observações          | RF-023                        |
| Aba Tipos de Demanda          | RF-012, RF-013                |

### Tela 6 — Recibos (Listagem)
| Elemento                  | Requisito coberto             |
|---------------------------|-------------------------------|
| Numeração REC-YYYY-NNN    | RF-025, RN-005                |
| Status Pendente/Parcial/Quitado/Cancelado | RF-024, RF-036 |
| Botão "Emitir Recibo"     | RF-024                        |
| Botão "Registrar Pagamento" | RF-029                      |
| Botão "2ª Via" PDF        | RF-028, RN-006                |
| Modal cancelar com motivo | RF-027, RN-006                |

### Tela 7 — Emitir Recibo (com Pré-visualização)
| Elemento                      | Requisito coberto              |
|-------------------------------|--------------------------------|
| Numeração automática          | RF-025, RN-005                 |
| Empresa + Competência         | RF-024                         |
| Datas emissão/vencimento      | RF-024                         |
| Preview ao vivo do recibo     | RF-026 (geração para impressão/digital) |
| Forma de pagamento            | RF-032                         |
| Botão "Emitir Recibo"         | RF-024, RF-026                 |

### Tela 8 — Recebimentos (Listagem)
| Elemento              | Requisito coberto               |
|-----------------------|---------------------------------|
| 4 cards financeiros   | RF-037                          |
| Filtros período/forma | RF-037, RF-029                  |
| Status Quitado/Parcial| RF-036, RF-035                  |
| Histórico de pagamentos | RF-037                        |

### Tela 9 — Registrar Recebimento
| Elemento                     | Requisito coberto               |
|------------------------------|---------------------------------|
| Seleção de recibo válido     | RF-030, RN-007                  |
| Exibição do saldo em aberto  | RF-034, RN-007                  |
| Data + Valor recebido        | RF-031                          |
| Forma de pagamento obrigatória | RF-032, RN-008                |
| Campo "Outro" condicional    | RF-033                          |
| Validação soma não excede recibo | RF-034, RN-007              |

### Tela 10 — Usuários (Listagem)
| Elemento                 | Requisito coberto               |
|--------------------------|---------------------------------|
| Tabela com perfil/setor  | RF-003, RF-004                  |
| Filtro por perfil/status | RF-003, RF-005                  |
| Inativar com confirmação | RF-003, RN-002                  |
| Reativar usuário inativo | RF-003                          |

### Tela 11 — Cadastro de Usuário
| Elemento               | Requisito coberto               |
|------------------------|---------------------------------|
| E-mail como identificador | RF-001, RF-002               |
| Senha com confirmação  | RNF-001 (hash seguro)           |
| 4 perfis de acesso     | RF-004, RN-002                  |
| Info box explicando perfis | RF-005, RN-002              |
| Status inicial         | RF-003                          |

### Tela 12 — Tipos de Demanda
| Elemento                  | Requisito coberto               |
|---------------------------|---------------------------------|
| Listagem com setor        | RF-012                          |
| Subtarefas listadas       | RF-013                          |
| Empresas vinculadas       | RF-014                          |
| Inativar/Reativar tipo    | RF-012, RN-003                  |
| Tabs por setor (filtro)   | RF-012                          |

### Tela 13 — Logs de Auditoria
| Elemento                       | Requisito coberto               |
|--------------------------------|---------------------------------|
| 4 KPIs (eventos, logins, críticos, falhas) | RF-038            |
| Filtros data + tipo de evento  | UC-M02                          |
| Tipos de evento com badges     | RF-038                          |
| Entidade afetada + IP          | RF-038, RNF-010                 |
| Paginação com retenção 5 anos  | RNF-010                         |
| Botão "Exportar CSV"           | RF-039                          |

---

## 4. Fluxos de Navegação Implementados

```
Login ──(Entrar)──► Dashboard
                       │
          ┌────────────┼────────────────────────────┐
          ▼            ▼                            ▼
       Empresas    Demandas                     Recibos
          │            │                            │
    Nova Empresa   [click linha]              Emitir Recibo
    ├─ Aba Dados   Modal detalhe              ├─ Form + Preview
    └─ Aba Vínculos └─ Subtarefas             └─ Salvar → volta
          │            └─ Aba Tipos                 │
    Salvar → volta                           [✕] Modal com motivo
                                                     │
                                              Recebimentos
                                                     │
                                           Registrar Recebimento
                                                     │
                                              Usuários
                                                     │
                                           Cadastro Usuário
                                                     │
                                             Auditoria
                                                     │
                                        Sidebar → Logout → Login
```

---

## 5. Decisões Técnicas da Ferramenta

### Figma como ferramenta base
- Arquivo base: `Hub-Accouting` (XdjLgcMrP75AU2ywE2aAVv)
- Sistema de componentes derivado das telas existentes (Login, Dashboard, Empresas, Demandas, Recibos, Recebimentos, Registrar Recebimentos)
- Frames em 1440×1024 px (padrão desktop, compatível com as telas existentes)
- Organização: telas existentes mantidas; novas telas adicionadas na sequência lógica do fluxo

### Protótipo navegável HTML
- Arquivo `index.html` gerado para validação de fluxos e apresentação
- Todas as interações do protótipo espelham as transições que seriam configuradas no Figma
- Permite navegação completa entre 13 telas sem servidor

### Cobertura de Requisitos MVP
- **39 RFs MVP cobertos:** RF-001 a RF-039
- **13 Casos de Uso representados:** UC-A01/A02/A03, UC-E01/E02/E03, UC-D01/D02/D03/D04, UC-H01/H02/H03, UC-M01/M02
- **12 Regras de negócio representadas visualmente:** RN-001 a RN-012

---

## 6. Requisitos Não Funcionais Endereçados no Design

| RNF    | Como foi endereçado no protótipo                                         |
|--------|--------------------------------------------------------------------------|
| RNF-001| Campo senha com type=password; hint sobre complexidade                   |
| RNF-002| Botão "Sair" explícito na sidebar (logout); info sobre expiração         |
| RNF-003| (Backend) UI não indica qual campo está errado no login (segurança)      |
| RNF-006| Todos os fluxos críticos alcançáveis em ≤ 10 cliques a partir do Dashboard |
| RNF-010| Tela de Auditoria exibe "Retenção: 5 anos" no rodapé da paginação        |
| RNF-011| Contraste entre texto e fundo ≥ 4.5:1 em todos os componentes            |
| RNF-012| Interface 100% em Português (Brasil); datas no formato DD/MM/AAAA        |

---

*Documento gerado como parte da Entrega 2 — Protótipos do Sistema SGEC.*
