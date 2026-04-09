import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Pokemon, TYPE_COLORS } from '../../models/pokemon';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonCardComponent {
  readonly pokemon = input.required<Pokemon>();
  readonly isFavorite = input(false);
  readonly teamFull = input(false);
  readonly inTeam = input(false);

  readonly cardClick = output<Pokemon>();
  readonly addToFavorites = output<Pokemon>();
  readonly addToTeam = output<Pokemon>();

  readonly spriteUrl = computed(() => {
    const p = this.pokemon();
    return (
      p.sprites?.other?.['official-artwork']?.front_default ??
      p.sprites?.front_default ??
      ''
    );
  });

  readonly paddedId = computed(
    () => '#' + String(this.pokemon().id).padStart(4, '0'),
  );

  typeClass(typeName: string): string {
    return TYPE_COLORS[typeName] ?? 'bg-gray-400 text-white';
  }

  onCardClick(): void {
    this.cardClick.emit(this.pokemon());
  }

  onFavClick(evt: Event): void {
    evt.stopPropagation();
    this.addToFavorites.emit(this.pokemon());
  }

  onTeamClick(evt: Event): void {
    evt.stopPropagation();
    if (this.teamFull() || this.inTeam()) return;
    this.addToTeam.emit(this.pokemon());
  }
}
