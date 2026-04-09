import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { POKEMON_TYPES, TYPE_COLORS } from '../../models/pokemon';
import { REGIONS, TrainerProfile } from '../../models/trainer';

const TRAINER_PROFILE_KEY = 'pokeverse:trainer-profile';

@Component({
  selector: 'app-trainer-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './trainer-profile.component.html',
  styleUrl: './trainer-profile.component.scss',
})
export class TrainerProfileComponent {
  readonly regions = REGIONS;
  readonly types = POKEMON_TYPES;
  readonly typeColors = TYPE_COLORS;

  readonly profile = signal<TrainerProfile>(this.loadInitial());
  readonly savedMessage = signal<string>('');

  /** Live mutation target bound to ngModel. Stays in sync with preview via onChange. */
  model: TrainerProfile = { ...this.profile() };

  // URL pattern — matches http(s)://... or bare domain
  readonly urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/[^\s]*)?$/;

  onModelChange(): void {
    this.profile.set({ ...this.model });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      Object.values(form.controls).forEach((c) => c.markAsTouched());
      return;
    }
    try {
      localStorage.setItem(TRAINER_PROFILE_KEY, JSON.stringify(this.model));
      this.profile.set({ ...this.model });
      this.savedMessage.set('Profile saved successfully!');
      setTimeout(() => this.savedMessage.set(''), 3000);
    } catch {
      this.savedMessage.set('Failed to save profile.');
    }
  }

  resetForm(form: NgForm): void {
    form.resetForm({
      name: '',
      slogan: '',
      favoriteRegion: '',
      favoriteType: '',
      avatarUrl: '',
      twitter: '',
      github: '',
      bio: '',
    });
    this.model = this.emptyProfile();
    this.profile.set({ ...this.model });
  }

  private loadInitial(): TrainerProfile {
    if (typeof localStorage === 'undefined') return this.emptyProfile();
    try {
      const raw = localStorage.getItem(TRAINER_PROFILE_KEY);
      if (!raw) return this.emptyProfile();
      return { ...this.emptyProfile(), ...JSON.parse(raw) };
    } catch {
      return this.emptyProfile();
    }
  }

  private emptyProfile(): TrainerProfile {
    return {
      name: '',
      slogan: '',
      favoriteRegion: '',
      favoriteType: '',
      avatarUrl: '',
      twitter: '',
      github: '',
      bio: '',
    };
  }
}
