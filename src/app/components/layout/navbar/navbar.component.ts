import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StateService } from '../../../services/state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly stateService = inject(StateService);

  navLinks = [
    { path: '/', label: 'Browse', icon: '📋' },
    { path: '/search', label: 'Search', icon: '🔍' },
    { path: '/compare', label: 'Compare', icon: '⚖️' },
    { path: '/team', label: 'Team', icon: '👥' },
    { path: '/favorites', label: 'Favorites', icon: '❤️' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/builder', label: 'Builder', icon: '⚙️' },
  ];
}
