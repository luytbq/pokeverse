import { Injectable, computed, signal } from '@angular/core';
import { Pokemon } from '../models/pokemon';
import { CustomPokemon, TrainerProfile } from '../models/trainer';

const FAVORITES_KEY = 'pokeverse:favorites';
const TEAM_KEY = 'pokeverse:team';
const CUSTOM_POKEMON_KEY = 'pokeverse:customPokemons';
const PROFILE_KEY = 'pokeverse:trainerProfile';
const MAX_TEAM_SIZE = 6;

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private readonly _favorites = signal<number[]>(this.loadFromStorage(FAVORITES_KEY));
  private readonly _team = signal<Pokemon[]>(this.loadFromStorage(TEAM_KEY));
  private readonly _customPokemons = signal<CustomPokemon[]>(
    this.loadFromStorage<CustomPokemon[]>(CUSTOM_POKEMON_KEY)
  );
  private readonly _trainerProfile = signal<TrainerProfile | null>(
    this.loadProfile()
  );

  /** In-memory Pokémon cache keyed by id. Not persisted. */
  private readonly _pokemonCache = signal<Map<number, Pokemon>>(new Map());

  readonly favorites = this._favorites.asReadonly();
  readonly team = this._team.asReadonly();
  readonly customPokemons = this._customPokemons.asReadonly();
  readonly trainerProfile = this._trainerProfile.asReadonly();
  readonly pokemonCache = this._pokemonCache.asReadonly();
  readonly isTeamFull = computed(() => this._team().length >= MAX_TEAM_SIZE);

  isFavorite(id: number): boolean {
    return this._favorites().includes(id);
  }

  toggleFavorite(id: number): void {
    const current = this._favorites();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    this._favorites.set(next);
    this.saveToStorage(FAVORITES_KEY, next);
  }

  addToFavorites(id: number): void {
    if (this.isFavorite(id)) return;
    const next = [...this._favorites(), id];
    this._favorites.set(next);
    this.saveToStorage(FAVORITES_KEY, next);
  }

  removeFromFavorites(id: number): void {
    const next = this._favorites().filter((x) => x !== id);
    this._favorites.set(next);
    this.saveToStorage(FAVORITES_KEY, next);
  }

  isInTeam(id: number): boolean {
    return this._team().some((p) => p.id === id);
  }

  addToTeam(pokemon: Pokemon): boolean {
    if (this.isTeamFull()) return false;
    if (this.isInTeam(pokemon.id)) return false;
    const next = [...this._team(), pokemon];
    this._team.set(next);
    this.saveToStorage(TEAM_KEY, next);
    return true;
  }

  removeFromTeam(id: number): void {
    const next = this._team().filter((p) => p.id !== id);
    this._team.set(next);
    this.saveToStorage(TEAM_KEY, next);
  }

  removeFromTeamAt(index: number): void {
    const next = [...this._team()];
    if (index < 0 || index >= next.length) return;
    next.splice(index, 1);
    this._team.set(next);
    this.saveToStorage(TEAM_KEY, next);
  }

  /** Replace the entire team (used for drag-drop reordering). */
  setTeam(team: Pokemon[]): void {
    const trimmed = team.slice(0, MAX_TEAM_SIZE);
    this._team.set(trimmed);
    this.saveToStorage(TEAM_KEY, trimmed);
  }

  /** Move a team slot from one index to another (reorder). */
  moveInTeam(fromIndex: number, toIndex: number): void {
    const next = [...this._team()];
    if (fromIndex < 0 || fromIndex >= next.length) return;
    if (toIndex < 0 || toIndex >= next.length) return;
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    this._team.set(next);
    this.saveToStorage(TEAM_KEY, next);
  }

  clearTeam(): void {
    this._team.set([]);
    this.saveToStorage(TEAM_KEY, []);
  }

  clearFavorites(): void {
    this._favorites.set([]);
    this.saveToStorage(FAVORITES_KEY, []);
  }

  // ==========================================================================
  // Custom Pokémon (fan-made) — persisted in localStorage
  // ==========================================================================

  addCustomPokemon(pokemon: CustomPokemon): void {
    const next = [...this._customPokemons(), pokemon];
    this._customPokemons.set(next);
    this.saveToStorage(CUSTOM_POKEMON_KEY, next);
  }

  updateCustomPokemon(id: string, patch: Partial<CustomPokemon>): void {
    const next = this._customPokemons().map((p) =>
      p.id === id ? { ...p, ...patch } : p
    );
    this._customPokemons.set(next);
    this.saveToStorage(CUSTOM_POKEMON_KEY, next);
  }

  removeCustomPokemon(id: string): void {
    const next = this._customPokemons().filter((p) => p.id !== id);
    this._customPokemons.set(next);
    this.saveToStorage(CUSTOM_POKEMON_KEY, next);
  }

  clearCustomPokemons(): void {
    this._customPokemons.set([]);
    this.saveToStorage(CUSTOM_POKEMON_KEY, []);
  }

  // ==========================================================================
  // Trainer Profile — persisted in localStorage
  // ==========================================================================

  setTrainerProfile(profile: TrainerProfile): void {
    this._trainerProfile.set(profile);
    this.saveToStorage(PROFILE_KEY, profile);
  }

  clearTrainerProfile(): void {
    this._trainerProfile.set(null);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(PROFILE_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  // ==========================================================================
  // Pokémon cache — in-memory only, shared across features
  // ==========================================================================

  getCachedPokemon(id: number): Pokemon | undefined {
    return this._pokemonCache().get(id);
  }

  cachePokemon(pokemon: Pokemon): void {
    const next = new Map(this._pokemonCache());
    next.set(pokemon.id, pokemon);
    this._pokemonCache.set(next);
  }

  cacheManyPokemon(pokemons: Pokemon[]): void {
    if (pokemons.length === 0) return;
    const next = new Map(this._pokemonCache());
    for (const p of pokemons) next.set(p.id, p);
    this._pokemonCache.set(next);
  }

  clearPokemonCache(): void {
    this._pokemonCache.set(new Map());
  }

  // ==========================================================================
  // Storage helpers
  // ==========================================================================

  private loadProfile(): TrainerProfile | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as TrainerProfile) : null;
    } catch {
      return null;
    }
  }

  private loadFromStorage<T>(key: string): T {
    if (typeof localStorage === 'undefined') return [] as unknown as T;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : ([] as unknown as T);
    } catch {
      return [] as unknown as T;
    }
  }

  private saveToStorage(key: string, value: unknown): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota errors */
    }
  }
}
