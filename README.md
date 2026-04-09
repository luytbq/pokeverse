# Pokeverse

Project này được tạo ra nhằm mục đích học tập các pattern trong modern Angular.
Code được viết bởi Claude. Sử dụng bộ skill official của Angular (https://github.com/angular/skills).

Sử dụng API miễn phí của PokeAPI (https://pokeapi.co/) để lấy dữ liệu về Pokemon.

## Tech stack

- **Angular 21** (standalone, signals, signal forms)
- **TypeScript 5.9**
- **Tailwind CSS 3** cho styling
- **@angular/cdk** cho drag & drop (Team Builder)
- **RxJS** cho async flows + interop với signals

## Modern Angular patterns được sử dụng

### Standalone bootstrap (không NgModule)

App được khởi tạo bằng `bootstrapApplication()` với providers thuần signal-based, không còn `AppModule` hay `AppRoutingModule`.

- [`src/main.ts`](src/main.ts) — `bootstrapApplication`, `provideRouter`, `provideHttpClient`
- [`src/app/app.component.ts`](src/app/app.component.ts) — standalone root component

### Lazy-loaded routes

Mỗi route được nạp riêng qua `loadComponent`, giúp giảm initial bundle size.

- [`src/app/app.routes.ts`](src/app/app.routes.ts)

### Signal-based inputs / outputs

Tất cả component nhận data đều dùng `input()` / `input.required()` / `output()` thay vì decorator `@Input` / `@Output`. Component pair với `ChangeDetectionStrategy.OnPush`.

- [`src/app/components/pokemon-card/pokemon-card.component.ts`](src/app/components/pokemon-card/pokemon-card.component.ts)
- [`src/app/components/stat-bar/stat-bar.component.ts`](src/app/components/stat-bar/stat-bar.component.ts)
- [`src/app/components/ability-tooltip/ability-tooltip.component.ts`](src/app/components/ability-tooltip/ability-tooltip.component.ts)
- [`src/app/components/evolution-tree/evolution-tree.component.ts`](src/app/components/evolution-tree/evolution-tree.component.ts) — `input()` + `computed()` thay cho input setter

### Signals cho state management

`signal()`, `computed()`, `effect()` được dùng làm primitive cho mọi local state. Service cũng expose state dạng signal để các component subscribe trực tiếp trong template.

- [`src/app/services/state.service.ts`](src/app/services/state.service.ts) — favorites, team, persist vào localStorage
- [`src/app/components/pokemon-detail/pokemon-detail.component.ts`](src/app/components/pokemon-detail/pokemon-detail.component.ts) — nhiều `computed()` cho ordered stats, flavor text, sprite hiện tại
- [`src/app/components/browse/browse.component.ts`](src/app/components/browse/browse.component.ts) — infinite scroll với signal-based loading state

### Signal Forms (Angular 21)

Form mới dùng `form()` factory với một writable signal làm model, bind UI bằng directive `[formField]` thay cho `FormControl` / `FormGroup`.

- [`src/app/components/search/search.component.ts`](src/app/components/search/search.component.ts) — search form với debounced reactive trigger qua `toObservable(model)`
- [`src/app/components/compare/compare.component.ts`](src/app/components/compare/compare.component.ts) — autocomplete suggestions từ signal model

### New control flow (`@if`, `@for`, `@switch`)

Toàn bộ template đã chuyển sang built-in control flow mới, bỏ hẳn `*ngIf` / `*ngFor` / `*ngSwitch`.

- [`src/app/components/browse/browse.component.html`](src/app/components/browse/browse.component.html)
- [`src/app/components/pokemon-detail/pokemon-detail.component.html`](src/app/components/pokemon-detail/pokemon-detail.component.html)
- [`src/app/components/evolution-tree/evolution-tree.component.html`](src/app/components/evolution-tree/evolution-tree.component.html)

### `inject()` function

Mọi service / `ActivatedRoute` / `HttpClient` / `DestroyRef` đều được lấy qua hàm `inject()` thay vì constructor injection.

- [`src/app/components/pokemon-detail/pokemon-detail.component.ts`](src/app/components/pokemon-detail/pokemon-detail.component.ts)
- [`src/app/services/pokemon.service.ts`](src/app/services/pokemon.service.ts)

### RxJS interop với signals

`toObservable()` để lấy stream từ signal, `takeUntilDestroyed()` để auto-cleanup subscription mà không cần `OnDestroy`.

- [`src/app/components/search/search.component.ts`](src/app/components/search/search.component.ts)
- [`src/app/components/compare/compare.component.ts`](src/app/components/compare/compare.component.ts)

### Service `providedIn: 'root'`

Tất cả service đều là tree-shakable và inject từ root injector.

- [`src/app/services/pokemon.service.ts`](src/app/services/pokemon.service.ts) — wrap PokeAPI với in-memory cache
- [`src/app/services/state.service.ts`](src/app/services/state.service.ts) — favorites, team, persistent state
- [`src/app/services/auth.service.ts`](src/app/services/auth.service.ts)
- [`src/app/services/type-coverage.service.ts`](src/app/services/type-coverage.service.ts)

### Drag & drop (CDK)

Team Builder cho phép kéo-thả Pokémon giữa các slot bằng `@angular/cdk/drag-drop`.

- [`src/app/components/team-builder/team-builder.component.ts`](src/app/components/team-builder/team-builder.component.ts)

## Cấu trúc thư mục

```
src/app/
├── components/         # tất cả standalone components
│   ├── browse/         # Pokédex grid + infinite scroll
│   ├── search/         # signal forms search & filter
│   ├── pokemon-detail/ # chi tiết một Pokémon
│   ├── compare/        # so sánh hai Pokémon
│   ├── team-builder/   # drag-and-drop team
│   ├── favorites/      # danh sách yêu thích
│   ├── trainer-profile/
│   ├── pokemon-builder/
│   ├── pokemon-card/   # reusable card component
│   ├── stat-bar/       # reusable stat bar
│   ├── ability-tooltip/
│   ├── evolution-tree/
│   └── layout/navbar/
├── services/           # state, http, auth, type coverage
├── models/             # type definitions cho PokeAPI
└── app.routes.ts       # lazy-loaded routes
```

## Chạy project

```bash
npm install
npm start          # ng serve, http://localhost:4200
npm run build      # production build
```

## Spec

Spec gốc của project nằm ở [`Pokeverse-spec.md`](Pokeverse-spec.md).
