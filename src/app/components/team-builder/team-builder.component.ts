import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Pokemon,
  SavedTeam,
  TYPE_COLORS,
  POKEMON_TYPES,
} from '../../models/pokemon';
import { PokemonService } from '../../services/pokemon.service';
import { StateService } from '../../services/state.service';
import {
  TypeCoverageResult,
  TypeCoverageService,
} from '../../services/type-coverage.service';

const SAVED_TEAMS_KEY = 'pokeverse:savedTeams';
const MAX_TEAM_SIZE = 6;

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderComponent implements OnInit {
  private state = inject(StateService);
  private pokemonService = inject(PokemonService);
  private typeCoverage = inject(TypeCoverageService);
  private router = inject(Router);

  readonly team = this.state.team;
  readonly teamFull = this.state.isTeamFull;

  /** Pokémon drawn from favorites — source list for drag-drop. */
  readonly favoritesPool = signal<Pokemon[]>([]);
  readonly loadingFavorites = signal(false);

  /** Search panel state. */
  readonly searchQuery = signal('');
  readonly searchResult = signal<Pokemon | null>(null);
  readonly searching = signal(false);
  readonly searchError = signal<string | null>(null);

  /** Saved teams (localStorage). */
  readonly savedTeams = signal<SavedTeam[]>([]);
  readonly saveTeamName = signal('');

  readonly allTypes = POKEMON_TYPES;
  readonly typeColors = TYPE_COLORS;
  readonly MAX_TEAM_SIZE = MAX_TEAM_SIZE;

  /** 6 slot indices, always length 6 regardless of team size. */
  readonly slotIndices = [0, 1, 2, 3, 4, 5];

  readonly coverage = computed<TypeCoverageResult>(() =>
    this.typeCoverage.analyze(this.team())
  );

  readonly teamSize = computed(() => this.team().length);

  constructor() {
    // Load favorites → detail objects whenever favorite ids change.
    effect(() => {
      const ids = this.state.favorites();
      this.loadFavoritePool(ids);
    });
  }

  ngOnInit(): void {
    this.loadSavedTeams();
  }

  // ──────────────────────────────────────────────────────────────
  // Favorites pool
  // ──────────────────────────────────────────────────────────────

  private loadFavoritePool(ids: number[]): void {
    if (ids.length === 0) {
      this.favoritesPool.set([]);
      return;
    }
    this.loadingFavorites.set(true);
    this.pokemonService.fetchMany(ids).subscribe({
      next: (results) => {
        this.favoritesPool.set(results);
        this.loadingFavorites.set(false);
      },
      error: () => {
        this.loadingFavorites.set(false);
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Search panel
  // ──────────────────────────────────────────────────────────────

  onSearch(): void {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      this.searchResult.set(null);
      this.searchError.set(null);
      return;
    }
    this.searching.set(true);
    this.searchError.set(null);
    this.pokemonService.searchByName(q).subscribe({
      next: (result) => {
        this.searching.set(false);
        if (result) {
          this.searchResult.set(result);
        } else {
          this.searchResult.set(null);
          this.searchError.set(`No Pokémon found for "${q}".`);
        }
      },
      error: () => {
        this.searching.set(false);
        this.searchError.set('Search failed. Please try again.');
      },
    });
  }

  onSearchKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearch();
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResult.set(null);
    this.searchError.set(null);
  }

  addFromSearch(p: Pokemon): void {
    this.state.addToTeam(p);
  }

  // ──────────────────────────────────────────────────────────────
  // Drag & Drop
  // ──────────────────────────────────────────────────────────────

  /**
   * Drop handler for the team grid. Supports:
   *  - Reorder within team (same container).
   *  - Drop from favorites pool or search result into team.
   */
  onDropToTeam(event: CdkDragDrop<Pokemon[]>): void {
    const currentTeam = [...this.team()];

    if (event.previousContainer === event.container) {
      // Reorder within team.
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(currentTeam, event.previousIndex, event.currentIndex);
      this.state.setTeam(currentTeam);
      return;
    }

    // Coming from an external list (favorites pool or search).
    const pokemon = event.item.data as Pokemon;
    if (!pokemon) return;
    if (currentTeam.length >= MAX_TEAM_SIZE) return;
    if (currentTeam.some((p) => p.id === pokemon.id)) return;

    // Insert at the drop index (clamped to end).
    const insertAt = Math.min(event.currentIndex, currentTeam.length);
    currentTeam.splice(insertAt, 0, pokemon);
    this.state.setTeam(currentTeam);
  }

  onRemoveSlot(index: number): void {
    this.state.removeFromTeamAt(index);
  }

  onClearTeam(): void {
    if (this.teamSize() === 0) return;
    const ok = confirm('Clear the entire team?');
    if (!ok) return;
    this.state.clearTeam();
  }

  // ──────────────────────────────────────────────────────────────
  // Saved teams (localStorage)
  // ──────────────────────────────────────────────────────────────

  private loadSavedTeams(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(SAVED_TEAMS_KEY);
      const parsed: SavedTeam[] = raw ? JSON.parse(raw) : [];
      this.savedTeams.set(Array.isArray(parsed) ? parsed : []);
    } catch {
      this.savedTeams.set([]);
    }
  }

  private persistSavedTeams(teams: SavedTeam[]): void {
    try {
      localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams));
    } catch {
      /* ignore quota errors */
    }
  }

  onSaveTeam(): void {
    const name = this.saveTeamName().trim();
    if (!name) {
      alert('Please enter a name for your team.');
      return;
    }
    if (this.teamSize() === 0) {
      alert('Your team is empty.');
      return;
    }
    const newTeam: SavedTeam = {
      id: `team-${Date.now()}`,
      name,
      pokemonIds: this.team().map((p) => p.id),
      createdAt: Date.now(),
    };
    const next = [...this.savedTeams(), newTeam];
    this.savedTeams.set(next);
    this.persistSavedTeams(next);
    this.saveTeamName.set('');
  }

  onLoadSavedTeam(saved: SavedTeam): void {
    if (saved.pokemonIds.length === 0) return;
    this.loadingFavorites.set(true);
    this.pokemonService.fetchMany(saved.pokemonIds).subscribe({
      next: (results) => {
        // Preserve saved order.
        const byId = new Map(results.map((p) => [p.id, p]));
        const ordered = saved.pokemonIds
          .map((id) => byId.get(id))
          .filter((p): p is Pokemon => !!p);
        this.state.setTeam(ordered);
        this.loadingFavorites.set(false);
      },
      error: () => {
        this.loadingFavorites.set(false);
      },
    });
  }

  onDeleteSavedTeam(id: string): void {
    const next = this.savedTeams().filter((t) => t.id !== id);
    this.savedTeams.set(next);
    this.persistSavedTeams(next);
  }

  // ──────────────────────────────────────────────────────────────
  // View helpers
  // ──────────────────────────────────────────────────────────────

  typeBadgeClass(typeName: string): string {
    return this.typeColors[typeName] ?? 'bg-gray-400 text-white';
  }

  spriteOf(p: Pokemon): string {
    return (
      p.sprites?.other?.['official-artwork']?.front_default ??
      p.sprites?.front_default ??
      ''
    );
  }

  paddedId(p: Pokemon): string {
    return '#' + String(p.id).padStart(4, '0');
  }

  isInTeam(id: number): boolean {
    return this.state.isInTeam(id);
  }

  trackById(_index: number, p: Pokemon): number {
    return p.id;
  }

  trackSavedTeam(_index: number, t: SavedTeam): string {
    return t.id;
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
  }

  onSaveTeamNameChange(value: string): void {
    this.saveTeamName.set(value);
  }

  formatMultiplier(mult: number): string {
    if (mult === 0) return '0';
    if (Number.isInteger(mult)) return `${mult}x`;
    return `${mult.toFixed(2)}x`;
  }

  onSlotClick(p: Pokemon): void {
    this.router.navigate(['/pokemon', p.id]);
  }
}
