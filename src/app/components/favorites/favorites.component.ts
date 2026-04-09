import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Pokemon } from '../../models/pokemon';
import { PokemonService } from '../../services/pokemon.service';
import { StateService } from '../../services/state.service';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, PokemonCardComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent implements OnInit {
  private state = inject(StateService);
  private pokemonService = inject(PokemonService);
  private router = inject(Router);

  readonly favoriteIds = this.state.favorites;
  readonly pokemons = signal<Pokemon[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly count = computed(() => this.favoriteIds().length);
  readonly isEmpty = computed(() => this.count() === 0);
  readonly teamFull = this.state.isTeamFull;
  readonly skeletonArr = Array.from({ length: 8 });

  constructor() {
    // Re-fetch whenever the favorites list changes (add/remove/clear).
    effect(() => {
      const ids = this.favoriteIds();
      this.loadFavorites(ids);
    });
  }

  ngOnInit(): void {
    // effect() in constructor already triggers initial load.
  }

  private loadFavorites(ids: number[]): void {
    if (ids.length === 0) {
      this.pokemons.set([]);
      this.error.set(null);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.pokemonService.fetchMany(ids).subscribe({
      next: (results) => {
        // Preserve the order of the favorites list.
        const byId = new Map(results.map((p) => [p.id, p]));
        const ordered = ids
          .map((id) => byId.get(id))
          .filter((p): p is Pokemon => !!p);
        this.pokemons.set(ordered);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load favorites. Please try again.');
        this.loading.set(false);
      },
    });
  }

  onCardClick(pokemon: Pokemon): void {
    this.router.navigate(['/pokemon', pokemon.id]);
  }

  onRemove(pokemon: Pokemon): void {
    this.state.removeFromFavorites(pokemon.id);
  }

  onAddToTeam(pokemon: Pokemon): void {
    this.state.addToTeam(pokemon);
  }

  onClearAll(): void {
    if (this.isEmpty()) return;
    const ok = confirm('Clear all favorites? This cannot be undone.');
    if (!ok) return;
    this.state.clearFavorites();
  }

  isInTeam(id: number): boolean {
    return this.state.isInTeam(id);
  }

  trackById(_index: number, p: Pokemon): number {
    return p.id;
  }
}
