export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonType {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface PokemonAbility {
  ability: { name: string; url: string };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  other?: {
    'official-artwork'?: {
      front_default: string | null;
      front_shiny: string | null;
    };
    home?: {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: PokemonType[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  sprites: PokemonSprites;
  moves?: Array<{ move: { name: string; url: string } }>;
}

export interface TypeResponse {
  id: number;
  name: string;
  pokemon: Array<{
    pokemon: { name: string; url: string };
    slot: number;
  }>;
}

export interface GenerationResponse {
  id: number;
  name: string;
  pokemon_species: Array<{ name: string; url: string }>;
}

export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type PokemonTypeName = (typeof POKEMON_TYPES)[number];

export const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-gray-400 text-white',
  fire: 'bg-orange-500 text-white',
  water: 'bg-blue-500 text-white',
  electric: 'bg-yellow-400 text-gray-900',
  grass: 'bg-green-500 text-white',
  ice: 'bg-cyan-300 text-gray-900',
  fighting: 'bg-red-700 text-white',
  poison: 'bg-purple-600 text-white',
  ground: 'bg-yellow-700 text-white',
  flying: 'bg-indigo-400 text-white',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-white',
  rock: 'bg-yellow-800 text-white',
  ghost: 'bg-purple-800 text-white',
  dragon: 'bg-indigo-700 text-white',
  dark: 'bg-gray-800 text-white',
  steel: 'bg-gray-500 text-white',
  fairy: 'bg-pink-300 text-gray-900',
};

export const GENERATIONS = [
  { id: 1, name: 'Generation I (Kanto)' },
  { id: 2, name: 'Generation II (Johto)' },
  { id: 3, name: 'Generation III (Hoenn)' },
  { id: 4, name: 'Generation IV (Sinnoh)' },
  { id: 5, name: 'Generation V (Unova)' },
  { id: 6, name: 'Generation VI (Kalos)' },
  { id: 7, name: 'Generation VII (Alola)' },
  { id: 8, name: 'Generation VIII (Galar)' },
  { id: 9, name: 'Generation IX (Paldea)' },
];

export function extractIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : 0;
}

export interface SavedTeam {
  id: string;
  name: string;
  pokemonIds: number[];
  createdAt: number;
}

export type TeamSlots = (Pokemon | null)[];

/**
 * Pokémon type effectiveness chart (Gen VI+).
 * Key = attacking type. Value = map of defending type → damage multiplier.
 * Missing entries default to 1x effectiveness.
 */
export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// ============================================================================
// Extended interfaces: Detail, Species, Evolution, Move, Ability, Custom
// ============================================================================

/** Generic named resource reference used by most PokéAPI endpoints. */
export interface NamedAPIResource {
  name: string;
  url: string;
}

/**
 * Alias for `Pokemon` — the spec names the full-detail model `PokemonDetail`.
 * In this codebase `Pokemon` already includes stats/moves/abilities/sprites,
 * so `PokemonDetail` is kept as an alias for clarity in other modules.
 */
export type PokemonDetail = Pokemon;

/** Pokémon Species response (/pokemon-species/{id}). */
export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  generation: NamedAPIResource;
  evolution_chain: { url: string };
  evolves_from_species: NamedAPIResource | null;
  flavor_text_entries: FlavorTextEntry[];
  genera: Genus[];
  names: LocalizedName[];
  color: NamedAPIResource;
  shape: NamedAPIResource | null;
  habitat: NamedAPIResource | null;
  varieties: PokemonSpeciesVariety[];
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: NamedAPIResource;
  version: NamedAPIResource;
}

export interface Genus {
  genus: string;
  language: NamedAPIResource;
}

export interface LocalizedName {
  name: string;
  language: NamedAPIResource;
}

export interface PokemonSpeciesVariety {
  is_default: boolean;
  pokemon: NamedAPIResource;
}

/** Evolution Chain response (/evolution-chain/{id}). */
export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedAPIResource | null;
  chain: ChainLink;
}

export interface ChainLink {
  is_baby: boolean;
  species: NamedAPIResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionDetail {
  item: NamedAPIResource | null;
  trigger: NamedAPIResource;
  gender: number | null;
  held_item: NamedAPIResource | null;
  known_move: NamedAPIResource | null;
  known_move_type: NamedAPIResource | null;
  location: NamedAPIResource | null;
  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  needs_overworld_rain: boolean;
  party_species: NamedAPIResource | null;
  party_type: NamedAPIResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: NamedAPIResource | null;
  turn_upside_down: boolean;
}

/** Type resource (/type/{id}) — extended version with damage relations. */
export interface TypeData {
  id: number;
  name: string;
  damage_relations: TypeDamageRelations;
  pokemon: Array<{ slot: number; pokemon: NamedAPIResource }>;
  moves: NamedAPIResource[];
  generation: NamedAPIResource;
  names: LocalizedName[];
}

export interface TypeDamageRelations {
  no_damage_to: NamedAPIResource[];
  half_damage_to: NamedAPIResource[];
  double_damage_to: NamedAPIResource[];
  no_damage_from: NamedAPIResource[];
  half_damage_from: NamedAPIResource[];
  double_damage_from: NamedAPIResource[];
}

/** Alias for TypeData — the spec refers to this interface as "Type". */
export type Type = TypeData;

/** Generation resource (/generation/{id}). */
export interface GenerationData {
  id: number;
  name: string;
  abilities: NamedAPIResource[];
  names: LocalizedName[];
  main_region: NamedAPIResource;
  moves: NamedAPIResource[];
  pokemon_species: NamedAPIResource[];
  types: NamedAPIResource[];
  version_groups: NamedAPIResource[];
}

/** Move resource (/move/{id}). */
export interface Move {
  id: number;
  name: string;
  accuracy: number | null;
  effect_chance: number | null;
  pp: number | null;
  priority: number;
  power: number | null;
  damage_class: NamedAPIResource;
  effect_entries: MoveEffectEntry[];
  flavor_text_entries: MoveFlavorTextEntry[];
  generation: NamedAPIResource;
  names: LocalizedName[];
  target: NamedAPIResource;
  type: NamedAPIResource;
}

export interface MoveEffectEntry {
  effect: string;
  short_effect: string;
  language: NamedAPIResource;
}

export interface MoveFlavorTextEntry {
  flavor_text: string;
  language: NamedAPIResource;
  version_group: NamedAPIResource;
}

/** Ability resource (/ability/{id}). */
export interface Ability {
  id: number;
  name: string;
  is_main_series: boolean;
  generation: NamedAPIResource;
  names: LocalizedName[];
  effect_entries: AbilityEffectEntry[];
  effect_changes: unknown[];
  flavor_text_entries: AbilityFlavorTextEntry[];
  pokemon: AbilityPokemonEntry[];
}

export interface AbilityEffectEntry {
  effect: string;
  short_effect: string;
  language: NamedAPIResource;
}

export interface AbilityFlavorTextEntry {
  flavor_text: string;
  language: NamedAPIResource;
  version_group: NamedAPIResource;
}

export interface AbilityPokemonEntry {
  is_hidden: boolean;
  slot: number;
  pokemon: NamedAPIResource;
}

/** Stat resource (/stat/{id}) — the stat definition, not a Pokémon's value. */
export interface Stat {
  id: number;
  name: string;
  game_index: number;
  is_battle_only: boolean;
  move_damage_class: NamedAPIResource | null;
  names: LocalizedName[];
}

/** Shortcut for the 6 canonical base stat keys used throughout the app. */
export type BaseStatKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed';

// ----------------------------------------------------------------------------
// NOTE: the `CustomPokemon` interface for fan-made Pokémon lives in
// `./trainer.ts` alongside the `TrainerProfile` model.
// ----------------------------------------------------------------------------

/**
 * Slimmed view of the species response used by the Pokémon detail screen —
 * only the fields actually consumed by the UI.
 */
export interface SpeciesSummary {
  id: number;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
  evolution_chain: { url: string };
  generation: { name: string };
}

/**
 * Slimmed view of a move used by the Pokémon detail screen's move list.
 */
export interface MoveDetail {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
}
