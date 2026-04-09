import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { extractIdFromUrl } from '../../models/pokemon';

export interface EvoDetail {
  min_level: number | null;
  trigger: { name: string };
  item: { name: string } | null;
  happiness: number | null;
  time_of_day: string;
}

export interface EvoNode {
  species: { name: string; url: string };
  evolution_details: EvoDetail[];
  evolves_to: EvoNode[];
}

export interface EvolutionChainResponse {
  id: number;
  chain: EvoNode;
}

interface FlatNode {
  id: number;
  name: string;
  spriteUrl: string;
  condition: string;
}

@Component({
  selector: 'app-evolution-tree',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './evolution-tree.component.html',
  styleUrl: './evolution-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvolutionTreeComponent {
  readonly chain = input.required<EvoNode | null>();

  /** Each row in `stages` is one evolution stage (stage 0 = base). */
  readonly stages = computed<FlatNode[][]>(() => {
    const root = this.chain();
    return root ? this.flatten(root) : [];
  });

  /**
   * Flatten the chain into stages. Because evolution chains can branch
   * (e.g. Eevee), we walk level by level using BFS, but we render them as
   * rows so siblings line up horizontally.
   */
  private flatten(root: EvoNode): FlatNode[][] {
    const stages: FlatNode[][] = [];
    let level: { node: EvoNode; incomingCondition: string }[] = [
      { node: root, incomingCondition: '' },
    ];
    while (level.length) {
      stages.push(
        level.map(({ node, incomingCondition }) => {
          const id = extractIdFromUrl(node.species.url);
          return {
            id,
            name: node.species.name,
            spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            condition: incomingCondition,
          };
        })
      );
      const next: { node: EvoNode; incomingCondition: string }[] = [];
      for (const { node } of level) {
        for (const child of node.evolves_to) {
          next.push({
            node: child,
            incomingCondition: this.describeEvo(child.evolution_details[0]),
          });
        }
      }
      level = next;
    }
    return stages;
  }

  private describeEvo(d: EvoDetail | undefined): string {
    if (!d) return '';
    if (d.min_level) return `Lv. ${d.min_level}`;
    if (d.item) return `Use ${d.item.name.replace(/-/g, ' ')}`;
    if (d.trigger?.name === 'trade') return 'Trade';
    if (d.happiness) return 'Happiness';
    if (d.trigger?.name) return d.trigger.name.replace(/-/g, ' ');
    return '';
  }
}
