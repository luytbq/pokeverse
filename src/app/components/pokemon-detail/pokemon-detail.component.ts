import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Pokemon, TYPE_COLORS } from '../../models/pokemon';
import { PokemonService } from '../../services/pokemon.service';
import { StateService } from '../../services/state.service';
import { StatBarComponent } from '../stat-bar/stat-bar.component';
import { AbilityTooltipComponent } from '../ability-tooltip/ability-tooltip.component';
import {
  EvoNode,
  EvolutionChainResponse,
  EvolutionTreeComponent,
} from '../evolution-tree/evolution-tree.component';

interface SpeciesResponse {
  id: number;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
  evolution_chain: { url: string };
  generation: { name: string };
}

interface MoveDetail {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatBarComponent,
    AbilityTooltipComponent,
    EvolutionTreeComponent,
  ],
  templateUrl: './pokemon-detail.component.html',
  styleUrl: './pokemon-detail.component.scss',
})
export class PokemonDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private pokemonService = inject(PokemonService);
  private state = inject(StateService);

  readonly pokemon = signal<Pokemon | null>(null);
  readonly species = signal<SpeciesResponse | null>(null);
  readonly evolutionRoot = signal<EvoNode | null>(null);
  readonly moves = signal<MoveDetail[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showShiny = signal(false);

  readonly typeColors = TYPE_COLORS;
  readonly statLabels = STAT_LABELS;

  readonly orderedStats = computed(() => {
    const p = this.pokemon();
    if (!p) return [];
    const byName = new Map(p.stats.map((s) => [s.stat.name, s.base_stat] as const));
    return STAT_ORDER.map((name) => ({
      name,
      label: STAT_LABELS[name] ?? name,
      value: byName.get(name) ?? 0,
    }));
  });

  readonly statTotal = computed(() =>
    this.orderedStats().reduce((acc, s) => acc + s.value, 0)
  );

  readonly flavorText = computed(() => {
    const sp = this.species();
    if (!sp) return '';
    const entry = sp.flavor_text_entries.find((e) => e.language.name === 'en');
    return entry ? entry.flavor_text.replace(/\f|\n/g, ' ') : '';
  });

  readonly isFavorite = computed(() => {
    const p = this.pokemon();
    return p ? this.state.isFavorite(p.id) : false;
  });

  readonly isInTeam = computed(() => {
    const p = this.pokemon();
    return p ? this.state.isInTeam(p.id) : false;
  });

  readonly isTeamFull = this.state.isTeamFull;

  readonly currentSprite = computed(() => {
    const p = this.pokemon();
    if (!p) return '';
    const art = p.sprites.other?.['official-artwork'];
    if (this.showShiny()) {
      return (
        art?.front_shiny ||
        p.sprites.front_shiny ||
        art?.front_default ||
        p.sprites.front_default ||
        ''
      );
    }
    return art?.front_default || p.sprites.front_default || '';
  });

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.paramMap
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
          this.pokemon.set(null);
          this.species.set(null);
          this.evolutionRoot.set(null);
          this.moves.set([]);
          this.showShiny.set(false);
        }),
        map((params) => params.get('id') ?? ''),
        switchMap((id) => this.loadAll(id))
      )
      .subscribe({
        next: ({ pokemon, species, evolution, moves }) => {
          this.pokemon.set(pokemon);
          this.species.set(species);
          this.evolutionRoot.set(evolution);
          this.moves.set(moves);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to load Pokémon');
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadAll(id: string): Observable<{
    pokemon: Pokemon;
    species: SpeciesResponse;
    evolution: EvoNode | null;
    moves: MoveDetail[];
  }> {
    const pokemon$ = this.pokemonService.fetchByName(id);
    const species$ = this.http.get<SpeciesResponse>(
      `https://pokeapi.co/api/v2/pokemon-species/${id}`
    );
    // Parallel fetch — combineLatest/forkJoin on the two initial calls.
    return forkJoin({ pokemon: pokemon$, species: species$ }).pipe(
      switchMap(({ pokemon, species }) => {
        const evolution$ = this.http
          .get<EvolutionChainResponse>(species.evolution_chain.url)
          .pipe(
            map((res) => res.chain),
            catchError(() => of(null as EvoNode | null))
          );
        const moves$ = this.loadMoves(pokemon);
        return forkJoin({
          pokemon: of(pokemon),
          species: of(species),
          evolution: evolution$,
          moves: moves$,
        });
      })
    );
  }

  private loadMoves(pokemon: Pokemon): Observable<MoveDetail[]> {
    const moveRefs = (pokemon.moves ?? []).slice(0, 20);
    if (moveRefs.length === 0) return of([]);
    const calls = moveRefs.map((m) =>
      this.http
        .get<{
          name: string;
          type: { name: string };
          power: number | null;
          accuracy: number | null;
        }>(m.move.url)
        .pipe(
          map((res) => ({
            name: res.name,
            type: res.type.name,
            power: res.power,
            accuracy: res.accuracy,
          })),
          catchError(() =>
            of({ name: m.move.name, type: 'normal', power: null, accuracy: null })
          )
        )
    );
    return forkJoin(calls);
  }

  toggleShiny(): void {
    this.showShiny.update((v) => !v);
  }

  toggleFavorite(): void {
    const p = this.pokemon();
    if (!p) return;
    this.state.toggleFavorite(p.id);
  }

  addToTeam(): void {
    const p = this.pokemon();
    if (!p) return;
    this.state.addToTeam(p);
  }

  typeBadgeClass(type: string): string {
    return TYPE_COLORS[type] ?? 'bg-gray-400 text-white';
  }

  formatMoveName(name: string): string {
    return name.replace(/-/g, ' ');
  }
}
