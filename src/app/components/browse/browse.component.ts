import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Pokemon } from '../../models/pokemon';
import { PokemonService } from '../../services/pokemon.service';
import { StateService } from '../../services/state.service';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [PokemonCardComponent],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowseComponent implements OnInit {
  private pokemonService = inject(PokemonService);
  private state = inject(StateService);
  private router = inject(Router);

  readonly pokemons = signal<Pokemon[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(true);
  readonly error = signal<string | null>(null);

  private offset = 0;

  readonly favorites = this.state.favorites;
  readonly teamFull = this.state.isTeamFull;
  readonly skeletonArr = Array.from({ length: 8 });

  ngOnInit(): void {
    this.loadMore();
  }

  loadMore(): void {
    if (this.loading() || !this.hasMore()) return;
    this.loading.set(true);
    this.error.set(null);

    this.pokemonService.fetchList(this.offset, PAGE_SIZE).subscribe({
      next: ({ results, next }) => {
        this.pokemons.update((prev) => [...prev, ...results]);
        this.offset += PAGE_SIZE;
        this.hasMore.set(next !== null);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pokemons', err);
        this.error.set('Failed to load Pokémon. Please try again.');
        this.loading.set(false);
      },
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    const viewport = window.innerHeight;
    const fullHeight = document.documentElement.scrollHeight;
    if (scrollY + viewport >= fullHeight - 600) {
      this.loadMore();
    }
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

  retry(): void {
    this.error.set(null);
    this.loadMore();
  }
}
