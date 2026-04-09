import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  Ability,
  EvolutionChain,
  GenerationData,
  GenerationResponse,
  Move,
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  TypeData,
  TypeResponse,
  extractIdFromUrl,
} from '../models/pokemon';

const API_BASE = 'https://pokeapi.co/api/v2';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private http = inject(HttpClient);
  private cache = new Map<string, Pokemon>();

  /** Fetch paginated Pokémon list — returns { results, next } */
  fetchList(offset: number, limit: number = 20): Observable<{
    results: Pokemon[];
    next: string | null;
  }> {
    return this.http
      .get<PokemonListResponse>(`${API_BASE}/pokemon?limit=${limit}&offset=${offset}`)
      .pipe(
        switchMap((res) => {
          if (res.results.length === 0) {
            return of({ results: [] as Pokemon[], next: res.next });
          }
          const detailCalls = res.results.map((item) =>
            this.fetchByName(item.name)
          );
          return forkJoin(detailCalls).pipe(
            map((results) => ({ results, next: res.next }))
          );
        })
      );
  }

  /** Fetch one Pokémon by id or name. Uses cache when available. */
  fetchByName(idOrName: string | number): Observable<Pokemon> {
    const key = String(idOrName).toLowerCase();
    const cached = this.cache.get(key);
    if (cached) {
      return of(cached);
    }
    return this.http.get<Pokemon>(`${API_BASE}/pokemon/${key}`).pipe(
      map((pokemon) => {
        this.cache.set(String(pokemon.id), pokemon);
        this.cache.set(pokemon.name.toLowerCase(), pokemon);
        return pokemon;
      })
    );
  }

  /** Search by name — returns a single result or null if not found */
  searchByName(name: string): Observable<Pokemon | null> {
    if (!name || !name.trim()) return of(null);
    return this.fetchByName(name.trim().toLowerCase()).pipe(
      catchError(() => of(null))
    );
  }

  /** Fetch pokemon list by type */
  fetchByType(typeName: string): Observable<number[]> {
    return this.http
      .get<TypeResponse>(`${API_BASE}/type/${typeName.toLowerCase()}`)
      .pipe(
        map((res) =>
          res.pokemon
            .map((p) => extractIdFromUrl(p.pokemon.url))
            .filter((id) => id > 0 && id <= 1025)
        )
      );
  }

  /** Fetch pokemon list by generation */
  fetchByGeneration(generationId: number): Observable<number[]> {
    return this.http
      .get<GenerationResponse>(`${API_BASE}/generation/${generationId}`)
      .pipe(
        map((res) =>
          res.pokemon_species
            .map((p) => extractIdFromUrl(p.url))
            .filter((id) => id > 0)
        )
      );
  }

  /** Fetch details for multiple ids (batched, parallel) */
  fetchMany(ids: number[]): Observable<Pokemon[]> {
    if (ids.length === 0) return of([]);
    return forkJoin(ids.map((id) => this.fetchByName(id)));
  }

  // ==========================================================================
  // Public API matching the project spec naming.
  // These are the canonical methods other features should call.
  // ==========================================================================

  /**
   * Fetch a page of the Pokémon list from `/pokemon?limit&offset`.
   * Returns only the raw name/url pairs — use `getPokemon(name)` to hydrate.
   */
  getPokemonList(limit: number = 20, offset: number = 0): Observable<PokemonListResponse> {
    return this.http.get<PokemonListResponse>(
      `${API_BASE}/pokemon?limit=${limit}&offset=${offset}`
    );
  }

  /** Fetch full detail for a single Pokémon by id or name. Cached. */
  getPokemon(idOrName: string | number): Observable<Pokemon> {
    return this.fetchByName(idOrName);
  }

  /** Fetch species data (description, generation, evolution chain URL). */
  getPokemonSpecies(idOrName: string | number): Observable<PokemonSpecies> {
    const key = String(idOrName).toLowerCase();
    return this.http.get<PokemonSpecies>(`${API_BASE}/pokemon-species/${key}`);
  }

  /** Fetch the evolution chain tree by id. */
  getEvolutionChain(id: number | string): Observable<EvolutionChain> {
    return this.http.get<EvolutionChain>(`${API_BASE}/evolution-chain/${id}`);
  }

  /** Fetch a type with its damage relations and the list of Pokémon of that type. */
  getType(idOrName: string | number): Observable<TypeData> {
    const key = String(idOrName).toLowerCase();
    return this.http.get<TypeData>(`${API_BASE}/type/${key}`);
  }

  /** Fetch a generation with its Pokémon species list. */
  getGeneration(idOrName: string | number): Observable<GenerationData> {
    const key = String(idOrName).toLowerCase();
    return this.http.get<GenerationData>(`${API_BASE}/generation/${key}`);
  }

  /** Fetch details of a single move. */
  getMove(idOrName: string | number): Observable<Move> {
    const key = String(idOrName).toLowerCase();
    return this.http.get<Move>(`${API_BASE}/move/${key}`);
  }

  /** Fetch details of a single ability. */
  getAbility(idOrName: string | number): Observable<Ability> {
    const key = String(idOrName).toLowerCase();
    return this.http.get<Ability>(`${API_BASE}/ability/${key}`);
  }
}
