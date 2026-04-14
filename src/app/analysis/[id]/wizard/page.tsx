'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft, Check, MessageCircle } from 'lucide-react';
import {
  GICS_GROUPS,
  BUSINESS_MODELS,
  COMPLEXITY_LEVELS,
  FISCAL_YEAR_LABELS,
  TRANSFORMATION_STATUS,
  TRANSFORMATION_TYPES,
} from '@/lib/schema/value-lists';

// ---------------------------------------------------------------------------
// Question definitions
// ---------------------------------------------------------------------------

type QuestionType = 'text' | 'number' | 'currency' | 'select' | 'multiselect' | 'boolean' | 'textarea';

interface Question {
  id: string;
  step: number;
  stepLabel: string;
  prompt: string;
  helpText?: string;
  type: QuestionType;
  options?: readonly string[];
  required?: boolean;
  backendField: string;
}

const QUESTIONS: Question[] = [
  // Step 1 - Company Profile
  {
    id: 'company_name',
    step: 1,
    stepLabel: 'Company Profile',
    prompt: 'What is the name of the company?',
    type: 'text',
    required: true,
    backendField: 'company.company_name',
  },
  {
    id: 'industry',
    step: 1,
    stepLabel: 'Company Profile',
    prompt: 'Which GICS industry sector best describes this company?',
    type: 'select',
    options: GICS_GROUPS,
    required: true,
    backendField: 'company.industry_gics_group',
  },
  {
    id: 'business_model',
    step: 1,
    stepLabel: 'Company Profile',
    prompt: 'What is the primary business model?',
    helpText: 'You can skip this if unsure.',
    type: 'select',
    options: BUSINESS_MODELS,
    backendField: 'company.business_model',
  },
  {
    id: 'regulatory_complexity',
    step: 1,
    stepLabel: 'Company Profile',
    prompt: 'How would you rate regulatory complexity?',
    type: 'select',
    options: COMPLEXITY_LEVELS,
    backendField: 'company.regulatory_complexity',
  },
  {
    id: 'operating_complexity',
    step: 1,
    stepLabel: 'Company Profile',
    prompt: 'How would you rate operating complexity?',
    type: 'select',
    options: COMPLEXITY_LEVELS,
    backendField: 'company.operating_complexity',
  },
  {
    id: 'pricing_complexity',
    step: 1,
    stepLabel: 'Company Profile',
    prompt: 'How would you rate pricing / premium complexity?',
    type: 'select',
    options: COMPLEXITY_LEVELS,
    backendField: 'company.pricing_premium_complexity',
  },

  // Step 2 - Financial Baseline
  {
    id: 'fiscal_year_label',
    step: 2,
    stepLabel: 'Financial Baseline',
    prompt: 'Which fiscal year does this data represent?',
    type: 'select',
    options: FISCAL_YEAR_LABELS,
    required: true,
    backendField: 'fiscal_years[0].fiscal_year_label',
  },
  {
    id: 'revenue',
    step: 2,
    stepLabel: 'Financial Baseline',
    prompt: 'What is the annual revenue?',
    helpText: 'Enter in USD.',
    type: 'currency',
    required: true,
    backendField: 'fiscal_years[0].revenue',
  },
  {
    id: 'total_it_spend',
    step: 2,
    stepLabel: 'Financial Baseline',
    prompt: 'What is the total IT spend?',
    type: 'currency',
    required: true,
    backendField: 'fiscal_years[0].total_it_spend',
  },
  {
    id: 'it_opex',
    step: 2,
    stepLabel: 'Financial Baseline',
    prompt: 'What is the IT operating expenditure (OpEx)?',
    helpText: 'Skip if you don\'t have this breakdown.',
    type: 'currency',
    backendField: 'fiscal_years[0].it_opex_spend',
  },
  {
    id: 'it_capex',
    step: 2,
    stepLabel: 'Financial Baseline',
    prompt: 'What is the IT capital expenditure (CapEx)?',
    type: 'currency',
    backendField: 'fiscal_years[0].it_capex_spend',
  },
  {
    id: 'it_da',
    step: 2,
    stepLabel: 'Financial Baseline',
    prompt: 'What is the IT depreciation and amortization (D&A)?',
    type: 'currency',
    backendField: 'fiscal_years[0].it_da_spend',
  },

  // Step 3 - Prior Year (optional)
  {
    id: 'has_prior_year',
    step: 3,
    stepLabel: 'Prior Year',
    prompt: 'Do you have prior year financial data to provide?',
    helpText: 'This enables trend analysis but is optional.',
    type: 'boolean',
    backendField: '_has_prior_year',
  },

  // Step 4 - Workforce
  {
    id: 'employee_count',
    step: 4,
    stepLabel: 'Workforce',
    prompt: 'What is the total employee count?',
    type: 'number',
    required: true,
    backendField: 'fiscal_years[0].employee_count',
  },
  {
    id: 'it_fte_count',
    step: 4,
    stepLabel: 'Workforce',
    prompt: 'How many IT FTEs (full-time equivalents)?',
    type: 'number',
    required: true,
    backendField: 'fiscal_years[0].it_fte_count',
  },
  {
    id: 'contractor_count',
    step: 4,
    stepLabel: 'Workforce',
    prompt: 'How many IT contractors?',
    helpText: 'Skip if unknown.',
    type: 'number',
    backendField: 'fiscal_years[0].contractor_count',
  },
  {
    id: 'contractor_spend',
    step: 4,
    stepLabel: 'Workforce',
    prompt: 'What is the total contractor spend?',
    type: 'currency',
    backendField: 'fiscal_years[0].contractor_spend',
  },

  // Step 5 - Transformation
  {
    id: 'transformation_status',
    step: 5,
    stepLabel: 'Transformation',
    prompt: 'Is a major transformation program currently active?',
    type: 'select',
    options: TRANSFORMATION_STATUS,
    backendField: 'fiscal_years[0].transformation_status',
  },
  {
    id: 'transformation_types',
    step: 5,
    stepLabel: 'Transformation',
    prompt: 'What types of transformation are underway?',
    helpText: 'Select all that apply.',
    type: 'multiselect',
    options: TRANSFORMATION_TYPES,
    backendField: 'fiscal_years[0].transformation_type',
  },
  {
    id: 'transformation_spend',
    step: 5,
    stepLabel: 'Transformation',
    prompt: 'What is the estimated transformation spend?',
    type: 'currency',
    backendField: 'fiscal_years[0].transformation_spend_estimate',
  },
  {
    id: 'roadmap_available',
    step: 5,
    stepLabel: 'Transformation',
    prompt: 'Is a technology roadmap available for upload?',
    type: 'boolean',
    backendField: 'fiscal_years[0].roadmap_available',
  },

  // Step 6 - File Upload prompt
  {
    id: 'has_files',
    step: 6,
    stepLabel: 'File Upload',
    prompt:
      'Do you have supporting files (financials, vendor lists, org charts, roadmaps) to upload?',
    helpText: 'You can upload files after completing the wizard.',
    type: 'boolean',
    backendField: '_has_files',
  },
];

const TOTAL_STEPS = 6;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WizardPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const question = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;
  const isLast = currentIndex === QUESTIONS.length - 1;

  const setAnswer = useCallback(
    (value: unknown) => {
      setAnswers((prev) => ({ ...prev, [question.id]: value }));
    },
    [question.id]
  );

  const currentAnswer = answers[question.id];

  const canProceed =
    !question.required || (currentAnswer != null && currentAnswer !== '');

  const handleNext = () => {
    if (isLast) {
      // TODO: wire up server action
      console.log('Wizard submitted:', answers);
      return;
    }

    // Skip prior year detail questions if user said no
    if (
      question.id === 'has_prior_year' &&
      currentAnswer !== true
    ) {
      // Jump to next step
      const nextStepIndex = QUESTIONS.findIndex(
        (q) => q.step === question.step + 1
      );
      if (nextStepIndex !== -1) {
        setCurrentIndex(nextStepIndex);
        return;
      }
    }

    setCurrentIndex((i) => Math.min(QUESTIONS.length - 1, i + 1));
  };

  const handleBack = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          IT Strategy Diagnostic
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guided walkthrough -- one question at a time.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {question.step} of {TOTAL_STEPS}: {question.stepLabel}
          </span>
          <span>
            {currentIndex + 1} / {QUESTIONS.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-input">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-xl border border-input bg-background p-8 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-4" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">
              {question.prompt}
            </p>
            {question.helpText && (
              <p className="text-sm text-muted-foreground">
                {question.helpText}
              </p>
            )}
            {question.required && (
              <p className="text-xs text-destructive">Required</p>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="ml-12">
          <QuestionInput
            question={question}
            value={currentAnswer}
            onChange={setAnswer}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="size-4" data-icon="inline-start" />
          Back
        </Button>

        {isLast ? (
          <Button onClick={handleNext} disabled={!canProceed}>
            <Check className="size-4" data-icon="inline-start" />
            Submit
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed}>
            {question.required ? 'Next' : 'Skip / Next'}
            <ChevronRight className="size-4" data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic question input
// ---------------------------------------------------------------------------

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (question.type) {
    case 'text':
      return (
        <Input
          autoFocus
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.form?.requestSubmit();
          }}
        />
      );

    case 'number':
      return (
        <Input
          autoFocus
          type="text"
          inputMode="numeric"
          value={
            value != null
              ? (value as number).toLocaleString('en-US')
              : ''
          }
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9]/g, '');
            onChange(cleaned ? parseInt(cleaned, 10) : null);
          }}
          placeholder="Enter a number"
        />
      );

    case 'currency':
      return (
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            autoFocus
            type="text"
            inputMode="numeric"
            className="pl-6"
            value={
              value != null
                ? (value as number).toLocaleString('en-US')
                : ''
            }
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.]/g, '');
              onChange(cleaned ? parseFloat(cleaned) : null);
            }}
            placeholder="0"
          />
        </div>
      );

    case 'select':
      return (
        <Select
          value={(value as string) ?? ''}
          onValueChange={(val) => onChange(val || null)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose one..." />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multiselect': {
      const selected = (value as string[]) ?? [];
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {question.options?.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2 cursor-pointer rounded-md border border-input px-3 py-2 text-sm transition-colors hover:bg-muted data-[checked=true]:border-primary data-[checked=true]:bg-primary/5"
                data-checked={checked}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => {
                    const next = checked
                      ? selected.filter((s) => s !== opt)
                      : [...selected, opt];
                    onChange(next.length > 0 ? next : null);
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    }

    case 'boolean':
      return (
        <div className="flex gap-3">
          <Button
            variant={value === true ? 'default' : 'outline'}
            onClick={() => onChange(true)}
            className="flex-1"
          >
            Yes
          </Button>
          <Button
            variant={value === false ? 'default' : 'outline'}
            onClick={() => onChange(false)}
            className="flex-1"
          >
            No
          </Button>
        </div>
      );

    case 'textarea':
      return (
        <Textarea
          autoFocus
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          rows={3}
        />
      );

    default:
      return null;
  }
}
