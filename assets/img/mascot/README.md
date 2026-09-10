# Mascote w0q

- `monkey-rocket-idle.png`: cópia da referência fornecida pelo usuário, com transparência original (1672 × 941).
- `monkey-rocket-surprised.png`: mesma arte, com a expressão gerada aplicada somente dentro do rosto; todo o restante e a transparência vêm da referência original.
- `monkey-rocket.gif`: ciclo com repouso, reação, ignição, lançamento e retorno. 560 × 600, 25 fps, 133 quadros, transparência e repetição contínua.

O site usa os PNGs em camadas SVG e a sequência em `js/rocket-motion.js`. O GIF é uma exportação independente: o botão existente controla a animação GSAP, inclusive a versão com movimento reduzido.

O capacete, o braço e a chama são recortados nas coordenadas originais da imagem, sem redesenhar o personagem. Os primeiros 135 pontos da chama ficam presos ao bocal; só a cauda se alonga, com uma sobreposição de 25 pontos que impede uma abertura durante a ignição. O exportador verifica a junção em todos os quadros. Fumaça e partículas usam um conjunto fixo de elementos reutilizados a cada lançamento.

`background-ship.webp` é a nave decorativa inspirada no mascote, otimizada para 384 × 384; `background-ship.png` é sua matriz com transparência. Nas três páginas, um SVG reutiliza esse mesmo WebP em dois recortes: fuselagem e chama. A chama pulsa no eixo do bocal, sem mover a nave inteira ou carregar outra imagem.

`js/background-ship.js` usa um único tween GSAP para o voo em oito e a propulsão. A trajetória fica dentro da área visível, com margens para as curvas e a navbar, independentemente da rolagem do documento. O ciclo dura 26 segundos no desktop e 30 no mobile; a orientação acompanha a tangente da curva. Resize e Visual Viewport recalculam os limites, incluindo zoom e mudanças na área útil do navegador móvel. Abas ocultas pausam o efeito; movimento reduzido deixa a nave estática, com chama sem pulsação. A limpeza de listeners e tweens ocorre pelo contexto GSAP e pelo ciclo de vida da página.

## Gerar novamente o GIF

Ferramentas de desenvolvimento, sem dependências novas no site: Node.js, Playwright, gifenc e pngjs. Instale-as em uma pasta de ferramentas e configure `NODE_PATH` para o respectivo `node_modules`.

```powershell
npm.cmd install --prefix "$env:TEMP\w0q-mascot-tools" playwright gifenc pngjs
$env:NODE_PATH = "$env:TEMP\w0q-mascot-tools\node_modules"
```

Com Chromium instalado pelo Playwright, sirva a raiz do projeto (`python -m http.server 8765 --bind 127.0.0.1`) e execute em outro terminal:

```powershell
node tools/export-mascot.cjs http://127.0.0.1:8765
```

O exportador reutiliza o componente e a timeline de produção. A transparência do GIF é binária; os PNGs mantêm o canal alfa completo.

## Expressão alternativa

Criada com a ferramenta integrada imagegen. Prompt utilizado:

> Precise facial-expression edit of the PROVIDED ORIGINAL mascot (use this new image exclusively). Preserve this exact black-furred monkey, red-framed sunglasses, white helmet with red stripe and antenna, white/red W0Q spacesuit and backpack logo, black gloves and boots, pointing hand, bright red rocket and red/white exhaust flame. Preserve the exact composition, canvas aspect ratio, placement and size of every element. Change ONLY the small face inside the helmet: lift its red sunglasses slightly onto the brow revealing wider startled eyes; raise the eyebrows; change its smile into a surprised small open O mouth. Same tan muzzle and facial anatomy. Do not redesign any element, do not move/scale/rotate the head, do not alter the body or rocket, do not change labels or symbols. Genuine transparent alpha background matching input. No drawn checkerboard, no new text. This is a second perfectly aligned facial state for a web animation, NOT a new illustration.

Na preparação do asset, apenas a região facial desse resultado foi aplicada sobre o PNG original.

## Nave de fundo

Criada com imagegen integrado, com fundo alfa real; o WebP é uma versão reduzida para entrega na web. Prompt utilizado:

> Create a NEW transparent PNG game sprite, actual RGBA with alpha=0 outside the subject. Isolated single cartoon rocket spacecraft: glossy vivid red chunky teardrop fuselage, pointed rounded nose facing upper-right about 40 degrees above horizontal; oval black porthole with thick white surround and one small white specular dot; two swept red fins; thick near-black contour strokes; black nozzle ring and a very short attached red/pink/white flame pointing lower-left. Friendly premium cel-shaded illustration matching a cartoon astronaut monkey's red and white retro rocket. The spacecraft ALONE, no monkey, no rider, no letters or brand marks, no environment or scenery, NO checkerboard drawn anywhere, no shadow outside sprite. Center complete rocket on square transparent canvas with 15% blank transparent margin, no cropping. This image is an actual cutout sprite for a web background, not an image showing what a transparent sprite would look like.
