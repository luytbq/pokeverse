import { Injectable } from '@angular/core';
import { Pokemon, TYPE_CHART, POKEMON_TYPES } from '../models/pokemon';

export interface TypeCoverageResult {
  /** Offensive coverage: for each defender type, the best x multiplier any team member can hit it for. */
  offensive: Record<string, number>;
  /** Defensive coverage: for each attacker type, the team's average damage taken multiplier. */
  defensive: Record<string, number>;
  /** Types the team hits super-effectively (offensive ≥ 2). */
  strongAgainst: string[];
  /** Types the team has no super-effective answer for (offensive < 2). */
  weakOffensively: string[];
  /** Types the team is vulnerable to defensively (average taken > 1). */
  defensiveWeaknesses: string[];
  /** Types the team resists on average (average taken < 1). */
  defensiveResistances: string[];
}

/**
 * Computes type effectiveness for a team of Pokémon.
 * Uses the Gen VI+ type chart from models/pokemon.ts.
 */
@Injectable({ providedIn: 'root' })
export class TypeCoverageService {
  /** Damage multiplier when `attacker` attacks a Pokémon of type `defender`. */
  private effectivenessVsType(attacker: string, defender: string): number {
    const row = TYPE_CHART[attacker];
    if (!row) return 1;
    const mult = row[defender];
    return mult === undefined ? 1 : mult;
  }

  /**
   * Total multiplier when `attacker` attacks a Pokémon with `defenderTypes` (1 or 2 types).
   * Multipliers from each defender type are multiplied together.
   */
  private effectivenessVsPokemon(
    attacker: string,
    defenderTypes: string[]
  ): number {
    return defenderTypes.reduce(
      (acc, t) => acc * this.effectivenessVsType(attacker, t),
      1
    );
  }

  analyze(team: Pokemon[]): TypeCoverageResult {
    const offensive: Record<string, number> = {};
    const defensive: Record<string, number> = {};

    for (const defenderType of POKEMON_TYPES) {
      offensive[defenderType] = 0;
    }
    for (const attackerType of POKEMON_TYPES) {
      defensive[attackerType] = 0;
    }

    if (team.length === 0) {
      return {
        offensive,
        defensive,
        strongAgainst: [],
        weakOffensively: [],
        defensiveWeaknesses: [],
        defensiveResistances: [],
      };
    }

    // Offensive: for each defender type, find the best multiplier any
    // team member's attacking types can do against it.
    for (const defenderType of POKEMON_TYPES) {
      let best = 0;
      for (const pokemon of team) {
        for (const slot of pokemon.types) {
          const mult = this.effectivenessVsType(slot.type.name, defenderType);
          if (mult > best) best = mult;
        }
      }
      offensive[defenderType] = best;
    }

    // Defensive: for each attacker type, average multiplier the team takes.
    for (const attackerType of POKEMON_TYPES) {
      let total = 0;
      for (const pokemon of team) {
        const defenderTypes = pokemon.types.map((t) => t.type.name);
        total += this.effectivenessVsPokemon(attackerType, defenderTypes);
      }
      defensive[attackerType] = total / team.length;
    }

    const strongAgainst = Object.entries(offensive)
      .filter(([, m]) => m >= 2)
      .map(([t]) => t);

    const weakOffensively = Object.entries(offensive)
      .filter(([, m]) => m < 1)
      .map(([t]) => t);

    const defensiveWeaknesses = Object.entries(defensive)
      .filter(([, m]) => m > 1)
      .map(([t]) => t);

    const defensiveResistances = Object.entries(defensive)
      .filter(([, m]) => m < 1)
      .map(([t]) => t);

    return {
      offensive,
      defensive,
      strongAgainst,
      weakOffensively,
      defensiveWeaknesses,
      defensiveResistances,
    };
  }
}
