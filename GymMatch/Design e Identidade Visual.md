# Design e Identidade Visual

## Conceito

Mobile-first, dark theme, identidade fitness. A interface foi projetada para ser usada com uma mão só, no celular, entre um exercício e outro.

## Paleta de cores

Todas as cores usam o espaço de cor **oklch** para maior consistência perceptual.

| Token | Cor | Uso |
|-------|-----|-----|
| `--primary` | Coral/vermelho `#e85a4f` | CTAs, botões principais, logo |
| `--primary-end` | Laranja `#f07c45` | Gradiente do primary |
| `--background` | Preto profundo | Fundo geral |
| `--card` | Cinza escuro | Cards, inputs, toasts |
| `--foreground` | Branco | Texto principal |
| `--muted-foreground` | Cinza claro | Textos secundários |
| `--success` | Verde | Toast de sucesso |
| `--destructive` | Vermelho | Toast de erro, ações destrutivas |

## Gradiente principal

```css
background: linear-gradient(135deg, #e85a4f, #f07c45);
```

Usado em: botões primários, header do logo, avatar da Lucia.

## Tipografia

- **Display** (títulos): fonte bold, tracking negativo
- **Body**: sans-serif padrão do sistema
- **Tamanhos**: escala regular do Tailwind

## Ícones

Biblioteca **Lucide React**. Ícone principal do app: `Dumbbell`.

## Favicon

SVG 32×32 com fundo gradiente coral/laranja em rounded rect e o ícone Dumbbell do Lucide em branco. Paths extraídos diretamente de `lucide-react/dist/esm/icons/dumbbell.js`.

## Componentes UI

shadcn/ui com customizações:
- `border-radius` aumentado (botões com `rounded-2xl`)
- Toasts com borda esquerda colorida por tipo (success/error/info/warning)
- Cards com `bg-card` e `border-border`

## Toasts (notificações)

Dark theme com borda lateral colorida:
- ✅ Sucesso: borda `--success` (verde)
- ❌ Erro: borda `--destructive` (vermelho)
- ℹ️ Info: borda `--primary` (coral)
- ⚠️ Aviso: borda amarela

---

*Ver também: [[Emails e Comunicação]]*
