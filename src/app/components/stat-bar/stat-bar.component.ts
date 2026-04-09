import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-stat-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-bar.component.html',
  styleUrl: './stat-bar.component.scss',
})
export class StatBarComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number;
  @Input() max = 255;
  /** Optional comparison value. When set, this bar is highlighted if value > compareValue. */
  @Input() compareValue: number | null = null;
  /** When true, shrink layout for compare grid use. */
  @Input() compact = false;
  /** Reverse direction: bar fills from right-to-left (used for right-side compare card). */
  @Input() reverse = false;

  get percent(): number {
    const pct = (this.value / this.max) * 100;
    return Math.min(100, Math.max(0, pct));
  }

  get isWinner(): boolean {
    return this.compareValue != null && this.value > this.compareValue;
  }

  get isLoser(): boolean {
    return this.compareValue != null && this.value < this.compareValue;
  }

  get barColor(): string {
    if (this.value >= 150) return 'bg-emerald-500';
    if (this.value >= 100) return 'bg-lime-500';
    if (this.value >= 70) return 'bg-yellow-500';
    if (this.value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }
}
