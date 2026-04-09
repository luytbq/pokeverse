import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Pokemon, TYPE_COLORS } from '../../models/pokemon';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonCardComponent {
  @Input({ required: true }) pokemon!: Pokemon;
  @Input() isFavorite = false;
  @Input() teamFull = false;
  @Input() inTeam = false;

  @Output() cardClick = new EventEmitter<Pokemon>();
  @Output() addToFavorites = new EventEmitter<Pokemon>();
  @Output() addToTeam = new EventEmitter<Pokemon>();

  readonly typeColors = TYPE_COLORS;

  get spriteUrl(): string {
    return (
      this.pokemon.sprites?.other?.['official-artwork']?.front_default ??
      this.pokemon.sprites?.front_default ??
      ''
    );
  }

  get paddedId(): string {
    return '#' + String(this.pokemon.id).padStart(4, '0');
  }

  typeClass(typeName: string): string {
    return this.typeColors[typeName] ?? 'bg-gray-400 text-white';
  }

  onCardClick(): void {
    this.cardClick.emit(this.pokemon);
  }

  onFavClick(evt: Event): void {
    evt.stopPropagation();
    this.addToFavorites.emit(this.pokemon);
  }

  onTeamClick(evt: Event): void {
    evt.stopPropagation();
    if (this.teamFull || this.inTeam) return;
    this.addToTeam.emit(this.pokemon);
  }
}
