import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  GENERATIONS,
  POKEMON_TYPES,
  TYPE_COLORS,
} from '../../models/pokemon';
import { CustomPokemon } from '../../models/trainer';

const CUSTOM_POKEMON_KEY = 'pokeverse:custom-pokemon';
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

interface MoveOption {
  name: string;
  url: string;
}

/** Step 2 form-group validator: sum of six stats must be ≤ 600. */
const statsSumValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const g = group as FormGroup;
  const sum =
    (g.get('hp')?.value || 0) +
    (g.get('attack')?.value || 0) +
    (g.get('defense')?.value || 0) +
    (g.get('spAtk')?.value || 0) +
    (g.get('spDef')?.value || 0) +
    (g.get('speed')?.value || 0);
  return sum > 600 ? { statsSumExceeded: { sum, max: 600 } } : null;
};

/** Step 1 validator: secondary type must differ from primary. */
const distinctTypesValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const primary = group.get('primaryType')?.value;
  const secondary = group.get('secondaryType')?.value;
  if (secondary && primary && primary === secondary) {
    return { sameType: true };
  }
  return null;
};

/** Step 3 FormArray validator: no duplicate moves. */
const noDuplicateMovesValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const arr = control as FormArray;
  const values = arr.controls
    .map((c) => c.value)
    .filter((v): v is string => !!v);
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) return { duplicateMove: true };
    seen.add(v);
  }
  return null;
};

@Component({
  selector: 'app-pokemon-builder',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pokemon-builder.component.html',
  styleUrl: './pokemon-builder.component.scss',
})
export class PokemonBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly types = POKEMON_TYPES;
  readonly generations = GENERATIONS;
  readonly typeColors = TYPE_COLORS;
  readonly statKeys = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'] as const;
  readonly statLabels: Record<string, string> = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    spAtk: 'Sp. Atk',
    spDef: 'Sp. Def',
    speed: 'Speed',
  };

  readonly currentStep = signal<number>(1);
  readonly moveOptions = signal<MoveOption[]>([]);
  readonly saveMessage = signal<string>('');

  // Step 1: Basic Info
  readonly basicInfoForm: FormGroup = this.fb.group(
    {
      name: [
        '',
        {
          validators: [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(20),
            Validators.pattern(/^[^0-9]*$/),
          ],
          asyncValidators: [this.nameNotExistValidator()],
          updateOn: 'blur',
        },
      ],
      primaryType: ['', Validators.required],
      secondaryType: [''],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(200),
        ],
      ],
      generation: [null, Validators.required],
    },
    { validators: distinctTypesValidator }
  );

  // Step 2: Base Stats
  readonly statsForm: FormGroup = this.fb.group(
    {
      hp: [50, [Validators.required, Validators.min(1), Validators.max(255)]],
      attack: [50, [Validators.required, Validators.min(1), Validators.max(255)]],
      defense: [50, [Validators.required, Validators.min(1), Validators.max(255)]],
      spAtk: [50, [Validators.required, Validators.min(1), Validators.max(255)]],
      spDef: [50, [Validators.required, Validators.min(1), Validators.max(255)]],
      speed: [50, [Validators.required, Validators.min(1), Validators.max(255)]],
    },
    { validators: statsSumValidator }
  );

  // Step 3: Moves (FormArray)
  readonly movesForm: FormGroup = this.fb.group({
    moves: this.fb.array<FormControl<string | null>>(
      [this.fb.control<string | null>('', Validators.required)],
      noDuplicateMovesValidator
    ),
  });

  get moves(): FormArray<FormControl<string | null>> {
    return this.movesForm.get('moves') as FormArray<FormControl<string | null>>;
  }

  ngOnInit(): void {
    this.loadMoves();
  }

  // ─── Async validator ────────────────────────────────────────────────────
  private nameNotExistValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = (control.value || '').trim().toLowerCase();
      if (!value || value.length < 3) return of(null);
      return timer(400).pipe(
        switchMap(() =>
          this.http
            .get(`${POKEAPI_BASE}/pokemon/${value}`)
            .pipe(
              map(() => ({ nameExists: true }) as ValidationErrors),
              catchError(() => of(null))
            )
        )
      );
    };
  }

  private loadMoves(): void {
    this.http
      .get<{ results: MoveOption[] }>(`${POKEAPI_BASE}/move?limit=50`)
      .pipe(catchError(() => of({ results: [] })))
      .subscribe((res) => this.moveOptions.set(res.results));
  }

  // ─── Step 2 helpers ─────────────────────────────────────────────────────
  get statsSum(): number {
    const v = this.statsForm.value;
    return (
      (v.hp || 0) +
      (v.attack || 0) +
      (v.defense || 0) +
      (v.spAtk || 0) +
      (v.spDef || 0) +
      (v.speed || 0)
    );
  }

  get statsExceeded(): boolean {
    return this.statsSum > 600;
  }

  statPercent(key: string): number {
    const value = this.statsForm.get(key)?.value || 0;
    return Math.min(100, (value / 255) * 100);
  }

  // ─── Step 3 helpers ─────────────────────────────────────────────────────
  addMove(): void {
    if (this.moves.length >= 4) return;
    this.moves.push(this.fb.control<string | null>('', Validators.required));
  }

  removeMove(index: number): void {
    if (this.moves.length <= 1) return;
    this.moves.removeAt(index);
  }

  // ─── Navigation ─────────────────────────────────────────────────────────
  goToStep(step: number): void {
    if (step < 1 || step > 4) return;
    // Forward nav requires current step validity; backward nav is free.
    if (step > this.currentStep()) {
      if (!this.isStepValid(this.currentStep())) {
        this.markStepTouched(this.currentStep());
        return;
      }
    }
    this.currentStep.set(step);
  }

  nextStep(): void {
    this.goToStep(this.currentStep() + 1);
  }

  previousStep(): void {
    this.goToStep(this.currentStep() - 1);
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.basicInfoForm.valid;
      case 2:
        return this.statsForm.valid;
      case 3:
        return this.movesForm.valid;
      default:
        return true;
    }
  }

  private markStepTouched(step: number): void {
    const form =
      step === 1
        ? this.basicInfoForm
        : step === 2
          ? this.statsForm
          : this.movesForm;
    form.markAllAsTouched();
  }

  // ─── Save ──────────────────────────────────────────────────────────────
  save(): void {
    if (
      !this.basicInfoForm.valid ||
      !this.statsForm.valid ||
      !this.movesForm.valid
    ) {
      this.saveMessage.set('Please fix validation errors before saving.');
      return;
    }

    const basic = this.basicInfoForm.value;
    const stats = this.statsForm.value;
    const moves = (this.moves.value as Array<string | null>).filter(
      (m): m is string => !!m
    );

    const custom: CustomPokemon = {
      id: `custom-${Date.now()}`,
      name: basic.name,
      primaryType: basic.primaryType,
      secondaryType: basic.secondaryType || undefined,
      description: basic.description,
      generation: basic.generation,
      stats,
      moves,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(
        localStorage.getItem(CUSTOM_POKEMON_KEY) || '[]'
      ) as CustomPokemon[];
      existing.push(custom);
      localStorage.setItem(CUSTOM_POKEMON_KEY, JSON.stringify(existing));
      this.saveMessage.set('Saved! Redirecting…');
      setTimeout(() => this.router.navigate(['/favorites']), 800);
    } catch {
      this.saveMessage.set('Failed to save. Storage may be full.');
    }
  }
}
