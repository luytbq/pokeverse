import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-stat-bar',
  standalone: true,
  imports: [NgClass],
  templateUrl: './stat-bar.component.html',
  styleUrl: './stat-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatBarComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly max = input(255);
  /** Optional comparison value. When set, this bar is highlighted if value > compareValue. */
  readonly compareValue = input<number | null>(null);
  /** When true, shrink layout for compare grid use. */
  readonly compact = input(false);
  /** Reverse direction: bar fills from right-to-left (used for right-side compare card). */
  readonly reverse = input(false);

  readonly percent = computed(() => {
    const pct = (this.value() / this.max()) * 100;
    return Math.min(100, Math.max(0, pct));
  });

  readonly isWinner = computed(() => {
    const cmp = this.compareValue();
    return cmp != null && this.value() > cmp;
  });

  readonly isLoser = computed(() => {
    const cmp = this.compareValue();
    return cmp != null && this.value() < cmp;
  });

  readonly barColor = computed(() => {
    const v = this.value();
    if (v >= 150) return 'bg-emerald-500';
    if (v >= 100) return 'bg-lime-500';
    if (v >= 70) return 'bg-yellow-500';
    if (v >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  });
}
