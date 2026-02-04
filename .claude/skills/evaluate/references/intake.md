# Intake Questionnaire Pipeline Reference

This reference file contains all intake questionnaire-specific details for the evaluate skill.

## Pipeline Information

- **ID**: `intake`
- **Name**: Intake Questionnaire (Therapy Readiness)
- **Description**: Guided intake experience that helps users explore whether therapy might be right for them, generating personalized reflections and completion outputs

## Pipeline Architecture

The intake questionnaire differs from DAP notes in several key ways:

| Aspect | DAP Notes | Intake Questionnaire |
|--------|-----------|---------------------|
| Input | Single session narrative | Multi-step Q&A conversation |
| Output | Single structured note | Multiple outputs: reflections + completion |
| Flow | One-shot generation | Iterative (9 questions + completion) |
| Evaluation | Compare note to source | Assess quality of each reflection + final outputs |

## CLI Commands

### Generate Synthetic Intake Flow
```bash
cd packages/data && bun run src/bin/cli.ts intake synthetic --scenario ambivalent
```

**Options**:
- `--scenario TYPE`: Scenario type (ambivalent, ready, pastNegative, externalPressure, notRightTime)
- `--count N`: Number of flows to generate
- `--listScenarios, -l`: List available scenarios

### Run Evaluation
```bash
cd packages/data && bun run src/bin/cli.ts intake evaluate
```

**Options**:
- `--input FILE`: Path to synthetic intake JSON (uses latest if not specified)
- `--scenario TYPE`: Scenario to evaluate
- `--model MODEL`: Model to use for evaluation (opus, sonnet, haiku)

## Alternative Testing Methods

### Web Interface Testing

```bash
# Start the web app
cd apps/web && pnpm dev

# Navigate to http://localhost:3000/intake
# Complete the questionnaire manually
# Observe reflections and completion outputs
```

### API Testing with curl

```bash
# Start the web app first
cd apps/web && pnpm dev

# Start a new intake
curl -X POST http://localhost:3000/api/intake/start \
  -H "Content-Type: application/json" \
  -d '{"intakeType": "therapy_readiness"}'

# Process a step (example for question 1)
curl -X POST http://localhost:3000/api/intake/step \
  -H "Content-Type: application/json" \
  -d '{
    "intakeType": "therapy_readiness",
    "stepIndex": 0,
    "priorAnswers": [],
    "currentAnswer": "I feel stuck and overwhelmed at work"
  }'
```

### Direct Library Testing

```bash
# In packages/data, you can test the builder functions directly
cd packages/data
bun -e "
import { processIntakeStep, getFirstQuestion } from './src/lib/intake/builder.js';

const result = await processIntakeStep({
  intakeType: 'therapy_readiness',
  stepIndex: 0,
  priorAnswers: [],
  currentAnswer: 'I feel stuck and overwhelmed at work'
});
console.log(JSON.stringify(result, null, 2));
"
```

## File Paths

| Purpose | Path |
|---------|------|
| Reflection System Prompt | `packages/data/src/prompts/intake/reflection-system.md` |
| Reflection User Prompt | `packages/data/src/prompts/intake/reflection-user.md` |
| Completion System Prompt | `packages/data/src/prompts/intake/completion-system.md` |
| Completion User Prompt | `packages/data/src/prompts/intake/completion-user.md` |
| Intake Definitions | `packages/data/src/lib/intake/definitions.ts` |
| Intake Builder | `packages/data/src/lib/intake/builder.ts` |
| Web UI | `apps/web/app/intake/` |
| API Routes | `apps/web/app/api/intake/` |

## Expert Persona

When evaluating intake questionnaire outputs, adopt the perspective of a **Therapy Readiness Assessment Specialist** with:

- **Experience**: 15+ years in intake assessment and patient engagement
- **Background**:
  - Licensed clinical psychologist
  - Expertise in motivational interviewing
  - Trained in health communication and patient education
- **Expertise**:
  - Pre-therapy engagement and readiness assessment
  - Non-diagnostic supportive communication
  - Plain language health literacy
  - User experience in mental health technology
- **Focus**: Creating a warm, validating experience that empowers informed decision-making without pressure

## Evaluation Criteria

The intake questionnaire generates two types of outputs that need separate evaluation:

### Part A: Reflection Quality (50% of total)

Each question's reflection should be evaluated on:

#### A1. Empathic Accuracy (15% weight)

Evaluates how well the reflection captures the meaning behind the user's answer.

**What to look for**:
- Reflects back meaning, not just words
- Demonstrates understanding of emotional subtext
- Avoids misinterpretation or projection
- Captures nuance and complexity

**Score Guide**:
- 9-10: Deeply resonant, captures unspoken meaning
- 7-8: Accurate reflection with good empathy
- 5-6: Somewhat accurate, misses some nuance
- 3-4: Surface-level or partially misunderstands
- 1-2: Misreads or ignores the answer

#### A2. Normalization & Validation (15% weight)

Evaluates how well the reflection helps the user feel less alone.

**What to look for**:
- Normalizes the experience ("Many people feel...")
- Validates uncertainty and ambivalence as natural
- Avoids minimizing or dismissing
- Doesn't over-pathologize or dramatize

**Score Guide**:
- 9-10: User would feel deeply understood and normal
- 7-8: Good normalization, appropriately validating
- 5-6: Some normalization present but formulaic
- 3-4: Misses opportunities to validate
- 1-2: Dismissive, minimizing, or pathologizing

#### A3. Appropriate Brevity (10% weight)

Evaluates whether reflections are concise yet meaningful.

**What to look for**:
- 1-2 sentences maximum
- No unnecessary elaboration
- No advice or recommendations
- No generic filler ("Thanks for sharing!")

**Score Guide**:
- 9-10: Perfect length, every word counts
- 7-8: Appropriate length, minor trimming possible
- 5-6: Slightly too long or padded
- 3-4: Too verbose or too thin
- 1-2: Way too long or meaningless

#### A4. Tone Consistency (10% weight)

Evaluates maintenance of warm, professional, non-clinical tone.

**What to look for**:
- Human and warm, not clinical
- Professional without being cold
- No diagnostic language or labels
- No "you should" or advice-giving
- Treats hesitation as wisdom, not resistance

**Score Guide**:
- 9-10: Feels like a thoughtful friend who understands therapy
- 7-8: Good tone with minor slips
- 5-6: Inconsistent tone
- 3-4: Too clinical or too casual
- 1-2: Inappropriate tone throughout

### Part B: Completion Output Quality (50% of total)

The three completion outputs (personalized brief, first session guide, experiments) should be evaluated together:

#### B1. Personalization (15% weight)

Evaluates how well outputs are tailored to the user's specific answers.

**What to look for**:
- References specific things user shared
- Connects patterns across answers
- Addresses their stated hesitations
- Aligns with their readiness level
- Not generic or boilerplate

**Score Guide**:
- 9-10: Feels written specifically for this person
- 7-8: Good personalization with specific references
- 5-6: Some personalization, some generic
- 3-4: Mostly generic with light customization
- 1-2: Could apply to anyone

#### B2. Actionability (15% weight)

Evaluates practical usefulness of the guidance provided.

**What to look for**:
- First session guide has concrete steps
- Experiments are specific and doable
- Example phrases are realistic and useful
- Guidance is clear enough to follow
- Not vague platitudes

**Score Guide**:
- 9-10: User could act on this immediately
- 7-8: Mostly actionable with clear guidance
- 5-6: Some useful guidance, some vague
- 3-4: Mostly vague, limited practical value
- 1-2: No actionable content

#### B3. Appropriate Boundaries (10% weight)

Evaluates that outputs stay within appropriate scope.

**What to look for**:
- No diagnosis or diagnostic language
- No promises about therapy outcomes
- No pressure to start therapy
- No replacement for actual therapy
- Experiments are safe and reversible

**Score Guide**:
- 9-10: Perfect boundaries maintained
- 7-8: Good boundaries with minor overreach
- 5-6: Some boundary issues
- 3-4: Crosses into inappropriate territory
- 1-2: Acts like therapy/diagnosis

#### B4. Empowerment Over Pressure (10% weight)

Evaluates that outputs support informed choice, not conversion.

**What to look for**:
- Emphasizes user's agency
- Respects "not the right time" answers
- Frames experiments as optional
- Treats ambivalence as valid
- No guilt, shame, or urgency

**Score Guide**:
- 9-10: User feels empowered, not pressured
- 7-8: Good empowerment with minor pressure
- 5-6: Some pressure present
- 3-4: Feels pushy toward therapy
- 1-2: Manipulative or guilt-inducing

## Iteration Log Format

When logging iterations for intake evaluation, use this format:

```markdown
## Iteration N - YYYY-MM-DD

### Evaluation Scores (Before → After)
- Overall: X/10 → Y/10

#### Reflection Quality
- Empathic Accuracy: X/10 → Y/10
- Normalization & Validation: X/10 → Y/10
- Appropriate Brevity: X/10 → Y/10
- Tone Consistency: X/10 → Y/10

#### Completion Output Quality
- Personalization: X/10 → Y/10
- Actionability: X/10 → Y/10
- Appropriate Boundaries: X/10 → Y/10
- Empowerment Over Pressure: X/10 → Y/10

### Changes Made
1. [Prompt file]: [Specific change]
2. [Prompt file]: [Specific change]

### Reasoning
[Why these changes were made based on evaluation feedback]

### Expected Impact
[Which dimensions should improve and why]

### Actual Impact
[To be filled after re-evaluation]
```

## Good Output Examples

### Good Reflection Examples

**User answer**: "I feel stuck and don't know why. Work is fine, relationships are okay, but something feels off."

**Good reflection**: "That sense of 'something's off' without a clear cause is surprisingly common - it often signals that something beneath the surface is ready for attention."

**Why it's good**:
- Reflects the meaning (stuck without clear cause)
- Normalizes ("surprisingly common")
- Reframes positively (ready for attention)
- Appropriate length (one sentence)
- No advice or labels

### Good Completion Output Example

**Personalized Brief** (excerpt):
"Based on what you've shared, you're noticing a pattern of pushing through until burnout hits - while your coping strategies (exercise, talking to friends) help in the moment, they haven't shifted the underlying cycle. Many people find that therapy helps them understand these patterns differently, not by working harder at them but by stepping back to see what's driving them..."

**Why it's good**:
- References specific user answers (pushing through, burnout, exercise)
- Normalizes without pathologizing
- No promises, uses "many people find"
- Explains therapy mechanism relevantly

## Poor Output Examples

### Poor Reflection Examples

**User answer**: "I feel stuck and don't know why."

**Poor reflection**: "Thank you for sharing that. It sounds like you're experiencing some difficult emotions. Have you considered that this might be related to depression or anxiety? Therapy can definitely help with these issues!"

**Problems**:
- Generic opener ("Thank you for sharing")
- Introduces diagnostic labels (depression, anxiety)
- Gives advice ("Therapy can definitely help")
- Makes promises
- Pressures toward therapy
- Too long

### Poor Completion Output Example

**Poor personalized brief** (excerpt):
"Starting therapy is an important step in your mental health journey. Based on your answers, you would benefit from cognitive behavioral therapy to address your negative thought patterns and avoidance behaviors. We recommend scheduling an appointment as soon as possible..."

**Problems**:
- Diagnostic language ("negative thought patterns", "avoidance behaviors")
- Prescriptive ("you would benefit from CBT")
- Pressure language ("as soon as possible")
- Not personalized to their specific answers
- Acts like a clinician

## Testing Scenarios

When evaluating intake quality, test with diverse user profiles:

### Scenario 1: Highly Ambivalent
- Answers reflect uncertainty throughout
- Selects "Just exploring" for readiness
- Multiple hesitations selected
- Completion should respect ambivalence, not push

### Scenario 2: Ready but Practical Concerns
- Clear problem articulation
- Ready to try therapy
- Hesitations are logistical (cost, time)
- Completion should address practical concerns

### Scenario 3: Past Negative Experience
- Mentions past therapy didn't help
- Hesitation includes "Past negative experience"
- Reflections should validate without dismissing past
- Completion should address how to find better fit

### Scenario 4: External Pressure
- Mentions others suggesting therapy
- Less clarity on personal motivation
- Completion should emphasize agency and choice

## Error Handling

| Error | Solution |
|-------|----------|
| API not responding | Ensure `pnpm dev` is running in apps/web |
| Missing API key | Set `ANTHROPIC_API_KEY` environment variable |
| Invalid intake type | Use `therapy_readiness` (only type available) |
| Step index out of range | Valid range is 0-8 for 9 questions |

## Tips for Effective Intake Evaluation

1. **Test the full flow** - Individual reflections matter, but flow coherence matters too
2. **Use diverse test inputs** - Test with ambivalent, ready, and uncertain personas
3. **Check completion personalization** - Does it reference specific answers or feel generic?
4. **Watch for tone drift** - Reflections can start well but become formulaic
5. **Test edge cases** - What happens with very brief or very detailed answers?
6. **Evaluate experiments carefully** - They should be safe, optional, and relevant
