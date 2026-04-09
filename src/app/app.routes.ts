import { Routes } from '@angular/router';
import { BrowseComponent } from './components/browse/browse.component';
import { SearchComponent } from './components/search/search.component';
import { PokemonDetailComponent } from './components/pokemon-detail/pokemon-detail.component';
import { CompareComponent } from './components/compare/compare.component';
import { TeamBuilderComponent } from './components/team-builder/team-builder.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { TrainerProfileComponent } from './components/trainer-profile/trainer-profile.component';
import { PokemonBuilderComponent } from './components/pokemon-builder/pokemon-builder.component';

export const routes: Routes = [
  { path: '', component: BrowseComponent },
  { path: 'search', component: SearchComponent },
  { path: 'pokemon/:id', component: PokemonDetailComponent },
  { path: 'compare', component: CompareComponent },
  { path: 'team', component: TeamBuilderComponent },
  { path: 'favorites', component: FavoritesComponent },
  { path: 'profile', component: TrainerProfileComponent },
  { path: 'builder', component: PokemonBuilderComponent },
];
