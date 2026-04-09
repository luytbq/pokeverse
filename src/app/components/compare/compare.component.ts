import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
} from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Pokemon, TYPE_COLORS } from '../../models/pokemon';
import { PokemonService } from '../../services/pokemon.service';
import { StateService } from '../../services/state.service';
import { StatBarComponent } from '../stat-bar/stat-bar.component';

interface TypeEffectiveness {
  weaknesses: string[];
  resistances: string[];
  immunities: string[];
}

interface TypeResponseLite {
  name: string;
  damage_relations: {
    double_damage_from: { name: string }[];
    half_damage_from: { name: string }[];
    no_damage_from: { name: string }[];
  };
}

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatBarComponent],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.scss',
})
export class CompareComponent implements OnInit {
  private http = inject(HttpClient);
  private pokemonService = inject(PokemonService);
  private state = inject(StateService);

  readonly left = new FormControl<string>('', { nonNullable: true });
  readonly right = new FormControl<string>('', { nonNullable: true });

  readonly leftPokemon = signal<Pokemon | null>(null);
  readonly rightPokemon = signal<Pokemon | null>(null);

  readonly leftEff = signal<TypeEffectiveness | null>(null);
  readonly rightEff = signal<TypeEffectiveness | null>(null);

  readonly locked = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly typeColors = TYPE_COLORS;

  /** All pokemon names for autocomplete (fetched once). */
  private allNames = signal<string[]>([]);

  readonly leftSuggestions = toSignal(
    this.buildSuggestions(this.left),
    { initialValue: [] as string[] }
  );
  readonly rightSuggestions = toSignal(
    this.buildSuggestions(this.right),
    { initialValue: [] as string[] }
  );

  readonly leftFocused = signal(false);
  readonly rightFocused = signal(false);

  readonly canCompare = computed(() =>
    !!this.left.value.trim() && !!this.right.value.trim() && !this.loading()
  );

  readonly leftTotal = computed(() => this.totalStats(this.leftPokemon()));
  readonly rightTotal = computed(() => this.totalStats(this.rightPokemon()));

  /** Stat rows joined so the template can render dual bars. */
  readonly statRows = computed(() => {
    const l = this.leftPokemon();
    const r = this.rightPokemon();
    if (!l || !r) return [];
    const leftMap = new Map(l.stats.map((s) => [s.stat.name, s.base_stat] as const));
    const rightMap = new Map(r.stats.map((s) => [s.stat.name, s.base_stat] as const));
    return STAT_ORDER.map((name) => ({
      name,
      label: STAT_LABELS[name],
      left: leftMap.get(name) ?? 0,
      right: rightMap.get(name) ?? 0,
    }));
  });

  ngOnInit(): void {
    this.loadAllNames();
  }

  private loadAllNames(): void {
    // One light call — names only. ~1300 items, ~60KB, cached by browser.
    this.http
      .get<{ results: { name: string; url: string }[] }>(
        'https://pokeapi.co/api/v2/pokemon?limit=1500'
      )
      .pipe(
        map((res) => res.results.map((r) => r.name)),
        catchError(() => of([] as string[]))
      )
      .subscribe((names) => this.allNames.set(names));
  }

  private buildSuggestions(control: FormControl<string>): Observable<string[]> {
    return control.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      map((query) => {
        const q = (query || '').trim().toLowerCase();
        if (q.length < 2) return [];
        return this.allNames()
          .filter((n) => n.includes(q))
          .slice(0, 8);
      })
    );
  }

  pickLeft(name: string): void {
    this.left.setValue(name);
    this.leftFocused.set(false);
  }

  pickRight(name: string): void {
    this.right.setValue(name);
    this.rightFocused.set(false);
  }

  swap(): void {
    const l = this.left.value;
    this.left.setValue(this.right.value);
    this.right.setValue(l);
    if (this.locked()) {
      // re-run the comparison with swapped values so the cards flip too.
      this.compare();
    }
  }

  compare(): void {
    const l = this.left.value.trim().toLowerCase();
    const r = this.right.value.trim().toLowerCase();
    if (!l || !r) return;
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      left: this.pokemonService.fetchByName(l).pipe(catchError(() => of(null))),
      right: this.pokemonService.fetchByName(r).pipe(catchError(() => of(null))),
    }).subscribe(({ left, right }) => {
      if (!left || !right) {
        this.error.set('One or both Pokémon could not be found.');
        this.loading.set(false);
        return;
      }
      this.leftPokemon.set(left);
      this.rightPokemon.set(right);
      this.locked.set(true);
      // Fetch type effectiveness in parallel but don't block the UI.
      this.computeEffectiveness(left).subscribe((e) => this.leftEff.set(e));
      this.computeEffectiveness(right).subscribe((e) => this.rightEff.set(e));
      this.loading.set(false);
    });
  }

  reset(): void {
    this.locked.set(false);
    this.leftPokemon.set(null);
    this.rightPokemon.set(null);
    this.leftEff.set(null);
    this.rightEff.set(null);
    this.error.set(null);
  }

  addLeftToTeam(): void {
    const p = this.leftPokemon();
    if (p) this.state.addToTeam(p);
  }

  addRightToTeam(): void {
    const p = this.rightPokemon();
    if (p) this.state.addToTeam(p);
  }

  isInTeam(p: Pokemon | null): boolean {
    return p ? this.state.isInTeam(p.id) : false;
  }

  isTeamFull(): boolean {
    return this.state.isTeamFull();
  }

  private totalStats(p: Pokemon | null): number {
    if (!p) return 0;
    return p.stats.reduce((acc, s) => acc + s.base_stat, 0);
  }

  private computeEffectiveness(p: Pokemon): Observable<TypeEffectiveness> {
    const typeCalls = p.types.map((t) =>
      this.http
        .get<TypeResponseLite>(t.type.url)
        .pipe(catchError(() => of(null as TypeResponseLite | null)))
    );
    return forkJoin(typeCalls).pipe(
      map((types) => {
        // Multiplicative stacking across the mon's types.
        const multipliers: Record<string, number> = {};
        for (const t of types) {
          if (!t) continue;
          for (const rel of t.damage_relations.double_damage_from) {
            multipliers[rel.name] = (multipliers[rel.name] ?? 1) * 2;
          }
          for (const rel of t.damage_relations.half_damage_from) {
            multipliers[rel.name] = (multipliers[rel.name] ?? 1) * 0.5;
          }
          for (const rel of t.damage_relations.no_damage_from) {
            multipliers[rel.name] = 0;
          }
        }
        const weaknesses: string[] = [];
        const resistances: string[] = [];
        const immunities: string[] = [];
        for (const [name, mult] of Object.entries(multipliers)) {
          if (mult === 0) immunities.push(name);
          else if (mult > 1) weaknesses.push(name);
          else if (mult < 1) resistances.push(name);
        }
        return { weaknesses, resistances, immunities };
      })
    );
  }

  typeBadgeClass(type: string): string {
    return TYPE_COLORS[type] ?? 'bg-gray-400 text-white';
  }

  spriteFor(p: Pokemon): string {
    return (
      p.sprites.other?.['official-artwork']?.front_default ||
      p.sprites.front_default ||
      ''
    );
  }
}
