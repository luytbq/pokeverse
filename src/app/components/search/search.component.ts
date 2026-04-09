import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';
import {
  GENERATIONS,
  POKEMON_TYPES,
  Pokemon,
  PokemonTypeName,
  TYPE_COLORS,
} from '../../models/pokemon';
import { PokemonService } from '../../services/pokemon.service';
import { StateService } from '../../services/state.service';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [NgClass, FormField, PokemonCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  private pokemonService = inject(PokemonService);
  private state = inject(StateService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly allTypes = POKEMON_TYPES;
  readonly generations = GENERATIONS;
  readonly typeColors = TYPE_COLORS;

  /** Form model — generation is the gen id as a string ('' means "all"). */
  readonly model = signal({
    name: '',
    generation: '',
  });
  readonly searchForm = form(this.model);

  readonly selectedTypes = signal<PokemonTypeName[]>([]);
  readonly results = signal<Pokemon[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searched = signal(false);

  readonly favorites = this.state.favorites;
  readonly teamFull = this.state.isTeamFull;

  constructor() {
    // Re-run search whenever the model or selected types change.
    toObservable(this.model)
      .pipe(
        debounceTime(400),
        distinctUntilChanged(
          (a, b) => a.name === b.name && a.generation === b.generation,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.runSearch());

    // selectedTypes changes are user-driven (button clicks) — react via effect.
    effect(() => {
      // read to subscribe
      this.selectedTypes();
      // Defer so it runs after the model effect to avoid double-firing
      // when both change in the same tick.
      queueMicrotask(() => this.runSearch());
    });
  }

  toggleType(type: PokemonTypeName): void {
    const current = this.selectedTypes();
    if (current.includes(type)) {
      this.selectedTypes.set(current.filter((t) => t !== type));
    } else if (current.length < 2) {
      this.selectedTypes.set([...current, type]);
    }
  }

  isTypeSelected(type: PokemonTypeName): boolean {
    return this.selectedTypes().includes(type);
  }

  isTypeDisabled(type: PokemonTypeName): boolean {
    const current = this.selectedTypes();
    return current.length >= 2 && !current.includes(type);
  }

  reset(): void {
    this.model.set({ name: '', generation: '' });
    this.selectedTypes.set([]);
    this.results.set([]);
    this.searched.set(false);
    this.error.set(null);
  }

  private runSearch(): void {
    const { name: rawName, generation: genStr } = this.model();
    const name = rawName.trim().toLowerCase();
    const generation = genStr ? parseInt(genStr, 10) : null;
    const types = this.selectedTypes();

    // If nothing is set, clear the results.
    if (!name && !generation && types.length === 0) {
      this.results.set([]);
      this.searched.set(false);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.searched.set(true);

    // Name-only shortcut: direct lookup.
    if (name && types.length === 0 && !generation) {
      this.pokemonService.searchByName(name).subscribe({
        next: (p) => {
          this.results.set(p ? [p] : []);
          this.loading.set(false);
        },
        error: () => {
          this.results.set([]);
          this.loading.set(false);
        },
      });
      return;
    }

    // Build id sets from type + generation filters, intersect them.
    const idSets$: Observable<number[]>[] = [];
    for (const t of types) {
      idSets$.push(this.pokemonService.fetchByType(t));
    }
    if (generation) {
      idSets$.push(this.pokemonService.fetchByGeneration(generation));
    }

    const combine$: Observable<number[]> =
      idSets$.length === 0
        ? of<number[]>([])
        : idSets$.length === 1
          ? idSets$[0]
          : new Observable<number[]>((sub) => {
              Promise.all(
                idSets$.map(
                  (obs) =>
                    new Promise<number[]>((resolve, reject) => {
                      obs.subscribe({ next: resolve, error: reject });
                    }),
                ),
              )
                .then((arrays) => {
                  const [first, ...rest] = arrays;
                  const intersection = first.filter((id) =>
                    rest.every((arr) => arr.includes(id)),
                  );
                  sub.next(intersection);
                  sub.complete();
                })
                .catch((err) => sub.error(err));
            });

    combine$
      .pipe(
        switchMap((ids) => {
          // Cap results to avoid hammering the API.
          const limited = ids.slice(0, 60);
          return this.pokemonService.fetchMany(limited);
        }),
      )
      .subscribe({
        next: (pokemons) => {
          let filtered = pokemons;
          if (name) {
            filtered = filtered.filter((p) =>
              p.name.toLowerCase().includes(name),
            );
          }
          this.results.set(filtered);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Search failed. Please try again.');
          this.results.set([]);
          this.loading.set(false);
        },
      });
  }

  isFavorite(id: number): boolean {
    return this.state.isFavorite(id);
  }

  isInTeam(id: number): boolean {
    return this.state.isInTeam(id);
  }

  onCardClick(p: Pokemon): void {
    this.router.navigate(['/pokemon', p.id]);
  }

  onAddToFavorites(p: Pokemon): void {
    this.state.toggleFavorite(p.id);
  }

  onAddToTeam(p: Pokemon): void {
    this.state.addToTeam(p);
  }

  typeBadgeClass(t: string): string {
    return this.typeColors[t] ?? 'bg-gray-400 text-white';
  }
}
