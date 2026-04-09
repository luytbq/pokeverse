import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/browse/browse.component').then(
        (m) => m.BrowseComponent,
      ),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./components/search/search.component').then(
        (m) => m.SearchComponent,
      ),
  },
  {
    path: 'pokemon/:id',
    loadComponent: () =>
      import('./components/pokemon-detail/pokemon-detail.component').then(
        (m) => m.PokemonDetailComponent,
      ),
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('./components/compare/compare.component').then(
        (m) => m.CompareComponent,
      ),
  },
  {
    path: 'team',
    loadComponent: () =>
      import('./components/team-builder/team-builder.component').then(
        (m) => m.TeamBuilderComponent,
      ),
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./components/favorites/favorites.component').then(
        (m) => m.FavoritesComponent,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/trainer-profile/trainer-profile.component').then(
        (m) => m.TrainerProfileComponent,
      ),
  },
  {
    path: 'builder',
    loadComponent: () =>
      import('./components/pokemon-builder/pokemon-builder.component').then(
        (m) => m.PokemonBuilderComponent,
      ),
  },
];
