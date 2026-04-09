import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

interface AbilityEffectEntry {
  effect: string;
  short_effect: string;
  language: { name: string };
}

interface AbilityResponse {
  name: string;
  effect_entries: AbilityEffectEntry[];
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
}

// Simple module-level cache (avoids hammering PokéAPI for the same ability).
const abilityCache = new Map<string, Observable<string>>();

@Component({
  selector: 'app-ability-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './ability-tooltip.component.html',
  styleUrl: './ability-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilityTooltipComponent {
  readonly name = input.required<string>();
  readonly url = input<string | null>(null);
  readonly isHidden = input(false);

  private http = inject(HttpClient);

  readonly hovered = signal(false);
  readonly description = signal<string>('Loading…');
  readonly displayName = computed(() => this.name().replace(/-/g, ' '));

  private loaded = false;

  onEnter(): void {
    this.hovered.set(true);
    if (this.loaded) return;
    this.loaded = true;
    this.fetchDescription().subscribe((text) => this.description.set(text));
  }

  onLeave(): void {
    this.hovered.set(false);
  }

  private fetchDescription(): Observable<string> {
    const endpoint =
      this.url() ?? `https://pokeapi.co/api/v2/ability/${this.name().toLowerCase()}`;
    const cached = abilityCache.get(endpoint);
    if (cached) return cached;
    const req$ = this.http.get<AbilityResponse>(endpoint).pipe(
      map((res) => {
        const englishShort = res.effect_entries.find(
          (e) => e.language.name === 'en'
        )?.short_effect;
        const englishLong = res.effect_entries.find(
          (e) => e.language.name === 'en'
        )?.effect;
        const flavor = res.flavor_text_entries.find(
          (f) => f.language.name === 'en'
        )?.flavor_text;
        return (
          englishShort ||
          englishLong ||
          flavor?.replace(/\f|\n/g, ' ') ||
          'No description available.'
        );
      }),
      catchError(() => of('Failed to load description.')),
      shareReplay(1)
    );
    abilityCache.set(endpoint, req$);
    return req$;
  }
}
