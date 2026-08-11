# Should I Work Out Today?

## Designing Transparent and User-Controlled AI Decision Support for Adapting Exercise Plans

**Student:** Li Chang  
**Programme:** MSc Applied Machine Learning for Creatives  
**Document status:** Final audited draft<br>
**Final project type:** High-fidelity interactive prototype supported by a separate machine-learning decision-engine experiment

# Abstract

This project investigated how AI-assisted decision support might help a user when an exercise plan made earlier no longer matches their available time, energy, motivation or physical state. It focused on this immediate decision because continuing the original plan should not be treated as the only acceptable outcome. The final work comprises a high-fidelity interactive Figma prototype and a separate machine-learning technical experiment rather than a complete application. Usability testing included one pilot and a second round with four new participants. In Round 2, 4/4 understood the concept as decision support rather than a fitness-plan generator, and 4/4 understood that the AI provided a reference while the final decision remained theirs. Testing also exposed ambiguous privacy language and a non-functional time-edit interaction, which were subsequently revised. The technical pipeline combined MiniLM sentence embeddings, cosine similarity, a TF-IDF baseline, explicit intent rules and safety gating. On a frozen 60-case synthetic holdout, both gated backends classified 42/60 cases correctly (70%), produced 0/45 final safety false positives among non-safety cases, and detected 14/15 safety cases. These results establish neither a complete product nor real-world generalisation or medical safety. Instead, the project offers formative interaction evidence, a transparent technical feasibility experiment and documented failure boundaries for further research.

# Introduction and Literature Review

## Exercise Motivation, Autonomy and Non-pressuring Support

Exercise plans are often made before the moment of action, while time, energy, motivation and physical sensation may change before execution. The problem is not simply how to secure compliance, but how to support a person in deciding what remains appropriate without treating continuation as the only successful outcome.

Self-determination theory offers a basis for examining this tension. Teixeira et al. (2012) reviewed 66 empirical studies connecting self-determination constructs with exercise and physical activity. More autonomous motivation showed comparatively consistent positive relationships with participation, although evidence for particular constructs was mixed and study designs and measures varied.

Ntoumanis and Moller (2025) report that related interventions often produce small-to-moderate effects, mediated principally by autonomous motivation, interpersonal need support and competence satisfaction, while identifying continuing conceptual and methodological debates. The limited implication here is to avoid guilt, pressure or obedience as the primary logic. `Adapt`, `postpone` and `decline` are legitimate outcomes rather than a moral ranking in which only exercise counts as success.

Neither source proves that the present interface is effective. The project did not measure exercise adherence, autonomous motivation, psychological need satisfaction, mental health or longer-term behaviour. The literature informs a non-pressuring design position; it does not supply outcomes that the project did not collect.

## Context-sensitive Physical-Activity Support

Nahum-Shani et al. (2018) describe just-in-time adaptive interventions as systems that alter support in response to changing internal and contextual states. Their framework distinguishes decision points, intervention options, tailoring variables and decision rules. These concepts help frame when a decision occurs, what information is relevant and how support might be selected.

Physical-activity JITAI evidence also requires caution. Hardeman et al. (2019) screened 2,200 titles, 840 abstracts and 169 full-text papers, ultimately including 19 papers reporting 14 unique JITAIs, of which six studies were randomised. Evidence for behavioural effects was mixed, and no included study was sufficiently powered to detect effects. Reported feasibility difficulties included technology, sensor reliability and the timing of messages. The review therefore supports the relevance of context-sensitive physical-activity support while showing that technical feasibility and behavioural value cannot be assumed.

The current project is not a complete JITAI. It has no real-time sensors, automatic trigger, longitudinal user database or dynamic personalisation. The Figma flow is initiated by a designed scenario, and the separate ML experiment classifies synthetic text rather than monitoring a user over time. JITAI literature is used here to frame changing state and explicit decision rules, not to claim that the prototype is a deployed or validated adaptive intervention.

## Human-Centred AI, Explanation and Overreliance

Amershi et al. (2019) developed 18 human–AI interaction guidelines through multiple evaluation phases, including 49 design practitioners applying them to 20 AI-infused products. The guidance addresses system capability, relevant information, correction, control and recovery from error. These concerns motivate a visible interpretation and options to accept, modify or reject the response.

Transparency is not achieved merely by exposing technical information. Miller (2019) argues that AI explanation should draw on how people generate, select and evaluate explanations. It is a human–AI interaction problem: information must respond to context rather than simply reveal more model detail. Matched examples, intent rules, similarity and override reasons preserve inspectable evidence, but do not establish understanding.

Overreliance further complicates the assumption that explanation produces good judgement. Buçinca, Malaya and Gajos (2021) conducted an experiment with 199 analysed participants and found that people could continue to accept AI suggestions when the AI was wrong. Cognitive forcing designs reduced overreliance compared with simpler explainable-AI approaches, but the designs that reduced it most also received less favourable subjective ratings. More active confirmation may therefore improve scrutiny while adding effort or friction.

These findings inform the prototype’s visible interpretation, accept–modify–reject choices, correction, explicit refusal and retention of the user’s final choice. The ML field `requires_confirmation` offers a possible way to expose uncertain classification rather than presenting it as authoritative. These remain design propositions with uneven evidence. Correction and explicit refusal were not formally tested in Round 2, and `requires_confirmation` has not undergone usability testing. Participants used predetermined Figma results rather than encountering live ML errors, and the project did not formally measure overreliance.

## Safety and Risk in Health-related AI

Exercise decisions can include fatigue, pain, dizziness and breathing difficulty, creating a health-related boundary. The World Health Organization (WHO, 2021) identifies six areas for ethical AI in health: autonomy; wellbeing and safety; transparency, explainability and intelligibility; responsibility and accountability; inclusion and equity; and responsive and sustainable systems. These are governance principles, not evidence that the prototype is safe.

The National Institute of Standards and Technology (NIST, 2023) similarly presents AI risk management as continuing work across GOVERN, MAP, MEASURE and MANAGE functions. Risk should be understood in context, evaluated throughout a system lifecycle and managed through documented action. A single accuracy figure cannot represent reliability, particularly when the cost and direction of errors differ.

The project’s technical sequence illustrates this narrower point. A revised hybrid system reached 100% on the 16-case development set, but that small result could not represent real performance. A 48-case robustness set then exposed intent confusion and unsafe authority given to similarity retrieval, prompting the safety-gated architecture. On the frozen 60-case holdout, both gated backends achieved 42/60 correct classifications (70%), produced 0/45 final `safety_stop` false positives among non-safety cases and detected 14/15 safety cases. The retained `H-EN-S07` case, in which pain was described as becoming suddenly sharp, demonstrates that explicit rules still fail on relevant language.

Safety gating is therefore a risk-reduction measure, not medical safety certification. The system cannot diagnose, screen for a condition or replace professional judgement. WHO and NIST are authoritative institutional guidance and frameworks rather than peer-reviewed project evaluations, and the project does not claim compliance with either.

## Research Gap and Project Position

The literature separately addresses autonomy-supportive exercise motivation, changing-state intervention design, human–AI interaction, explanation, overreliance and health-related AI risk. It does not resolve how these concerns should be combined when an earlier workout plan no longer matches a user’s current state. The project asks:

> How can AI-assisted decision support help users adapt a planned workout when their current state no longer matches the original plan, while preserving transparency, autonomy and safety?

The project translates autonomy support into `adapt`, `postpone` and `decline`; applies changing-state and decision-rule concepts to one decision; and turns human–AI principles into a visible, modifiable and rejectable interface. A separate ML experiment examines semantic retrieval, intent rules and safety gating. This is a design approach and technical feasibility investigation, not a new exercise theory, trained foundation model, demonstrated health impact or deployment-ready product. The Figma and ML work remained separate, and synthetic evaluation cannot establish real-world reliability.

# 1. Project Evolution

The project began as an exploration of how artificial intelligence might support people after an exercise setback. Three initial directions were considered: providing feedback after a missed session, adapting support when time or energy was limited, and responding to reduced confidence when progress felt slow. Early written supervision feedback suggested that the first direction was the clearest and most achievable within the available timeframe. It also raised an important question: what would make the system specifically relevant to exercise, rather than simply offering generic motivational advice?

This question led the project away from broad encouragement and towards more context-sensitive decision support. The initial concept focused on situations such as missing a planned workout, stopping early, or feeling disappointed with performance. At this stage, the proposed interaction allowed the AI to present its interpretation of the situation, while the user could correct the interpretation, reject the advice, request a different kind of support, or indicate that the response felt pressuring or too vague. This established several principles that remained central throughout the project: transparency, correction, refusal, low-pressure language and user control.

Through continued discussion, prototyping and scope evaluation, the project was narrowed further. Rather than addressing all forms of exercise setbacks, it focused on one specific decision moment: when a workout planned earlier no longer matched the user’s current physical or emotional state. For example, a user might have planned a demanding gym session but later feel tired, unmotivated, short of time or uncomfortable. The design question therefore became not how to persuade the user to exercise, but how to help them make an informed choice between adapting the session, postponing it, declining it for the day, or stopping because of a possible safety concern.

This change was important because it separated the project from conventional fitness applications. The final concept does not generate long-term workout plans, track performance or attempt to maximise adherence. Instead, it supports a single, uncertain decision while preserving the user’s autonomy. The interface was designed so that the AI’s interpretation remained visible and editable. Users could correct information, change the proposed time, reject a recommendation, choose a lower-pressure alternative or decline further encouragement. Privacy controls were also made explicit so that users could decide whether information from the interaction should be retained.

The high-fidelity Figma prototype was then tested through one early pilot and a second round involving four new participants; the pilot was not included in the Round 2 findings. All four participants in this small Round 2 sample understood the system as a decision-support tool rather than a workout planner, and all four understood that the final choice remained with the user. However, the testing also identified two important interaction problems. The original privacy wording was misunderstood in two sessions, so it was revised to state clearly that the current information would not be saved; the fourth participant understood the revised consequence independently. The third participant could not complete the original time-edit interaction, so it was rebuilt to show an explicit change from 18:30 to 19:00, which the fourth participant completed independently.

After the interaction design had been stabilised, a separate machine-learning experiment was developed to examine how the four decision outcomes could be technically supported. The first version used text embeddings and cosine similarity to retrieve semantically similar exercise scenarios. Evaluation showed that similarity alone could confuse adapting, postponing and declining, and could also create unsafe false positives. This led to a hybrid architecture combining semantic retrieval with explicit intention rules. A later robustness test exposed a more serious limitation: the retrieval model could classify harmless phrases such as “Today is chest day” as a safety case. The final architecture therefore introduced a safety gate, ensuring that `safety_stop` could only be produced by explicit safety rules rather than by semantic similarity alone.

The final project is therefore the result of several connected iterations: narrowing the research scope, refining the interaction through user testing, and revising the technical architecture through evaluation. It should be understood as a high-fidelity interactive prototype supported by a separate machine-learning decision-engine experiment, rather than as a fully deployed application.

# 2. Machine Learning Method

The machine-learning component was developed as an independent technical experiment, not as a production backend connected to the Figma prototype or live portfolio website. It examined whether four outcomes—`adapt`, `postpone`, `decline` and `safety_stop`—could be supported through text-based scenario retrieval and classification. The focus was technical feasibility, inspectable decision boundaries and failure modes, not real-world readiness or automated authority over whether someone should exercise.

The reference set contains 42 exercise scenarios: 11 labelled `adapt`, 11 `postpone`, 11 `decline` and nine `safety_stop`. All are disclosed as “LLM-assisted synthetic seed data”; they are not participant inputs and have not been medically validated. Each row has a review-status field. Six boundary examples are marked “manually reviewed”, while 36 remain marked “manually review required”. The complete set therefore cannot be described as having completed human review. Automated schema and pipeline tests do not establish that its semantic labels have been manually validated. This is a small, purpose-built seed set rather than a large or representative dataset, and its categories reflect this project’s decision structure.

The preferred retrieval backend uses `sentence-transformers/all-MiniLM-L6-v2`. It converts each reference text and incoming description into a 384-dimensional embedding. Because the vectors are normalised, their dot product provides cosine similarity. The engine returns the top three matches and forms a raw category prediction by aggregating their similarity with rank-based weighting. This creates a lightweight, inspectable semantic-similarity experiment. MiniLM was loaded as an existing model, not trained or fine-tuned; its vectors do not demonstrate understanding of a user’s bodily condition.

A second backend implements word and character TF-IDF with cosine similarity, combining word unigrams, word bigrams and character n-grams of two to five characters. It is both a fallback when the sentence-transformer package or model cannot load and a baseline for comparison. It tests whether a simpler lexical representation performs similarly on the small synthetic set. TF-IDF is neither a neural network nor generative AI, and keeps the pipeline runnable in constrained environments.

Initial evaluation showed that similarity alone did not consistently distinguish willingness to reduce an activity from cancellation or rescheduling. A transparent intent layer was therefore added. Requests for something shorter, lighter, lower effort or indoors support `adapt`; tomorrow, later or rescheduling support `postpone`; and cancelling today, refusing alternatives or asking the system to stop suggesting supports `decline`. These rules are inspectable interaction boundaries, not medical judgements. They can make `final_prediction` differ from `embedding_prediction_raw`, while `matched_intent_rule`, `decision_layer` and `override_reason` preserve why. Hybrid improvement therefore cannot be attributed to the embedding model alone.

The robustness audit exposed a further problem. Retrieval could assign `safety_stop` to harmless wording through surface similarity, including “Today is chest day.” The final architecture permits `safety_stop` only when an explicit safety rule is triggered. English and Chinese rules cover sudden or sharp pain, chest pain, dizziness, breathing difficulty, fainting, and unusual or worsening discomfort. They inspect nearby negation so that “I do not have chest pain” is not a positive match. If retrieval still predicts `safety_stop` without an explicit signal, the engine selects the highest-ranked non-safety category, sets `requires_confirmation` to `true`, and retains the raw prediction and override reason. This exposes the error. The rules are not a clinical standard, reliable medical screening or diagnosis.

Uncertainty is recorded through `top1_similarity`, `top2_similarity` and their `similarity_margin`. For retrieval-only decisions, provisional frozen thresholds set `requires_confirmation` when the best match is weak or insufficiently separated from the second. Output also includes `embedding_prediction_raw`, `best_non_safety_prediction`, `final_prediction`, `decision_layer`, matched rules and `override_reason`. These fields make the route inspectable and support future confirmation; they do not make similarity a calibrated probability or the classification an unquestionably correct answer.

The experiment is implemented in Python in the repository’s `ml/` directory. It uses fixed CSV and JSONL files, two backends, automated tests for retrieval, intent, safety gating and frozen evidence, and versioned JSON evaluation reports. The fixed evaluation set contains 16 cases, the robustness set 48, and the frozen final holdout 60. Generated embeddings, model caches and virtual environments are excluded from version control; no API key is involved. The engine remains separate from the portfolio interface and live user input.

Several methodological limitations follow from these choices. The reference data are small and synthetic, the labels were defined by the project’s design aims, and no real user input dataset was available. No new model was trained or fine-tuned, while explicit rules have a substantial influence on final performance. The experiment therefore cannot establish real-world generalisation, or show that its exercise suggestions or safety handling are medically correct. Its contribution is narrower: it makes a proposed technical pipeline, its decision boundaries and its errors available for inspection. The reported method must consequently be read alongside the subsequent Evaluation section rather than as evidence of product validity.

# 3. Machine Learning Evaluation and Findings

## 3.1 Development Evaluation

The fixed development set contained 16 independent synthetic cases, with four examples for each category. Its data file has no review-status field, so it cannot be treated as a manually verified benchmark. It was used to inspect the developing pipeline rather than to estimate generalisation. MiniLM pure retrieval classified 15/16 correctly (93.75%). The archived first-round MiniLM hybrid classified 13/16 (81.25%), while the revised hybrid reached 16/16. TF-IDF pure retrieval achieved 14/16 (87.50%) and its revised hybrid also reached 16/16. The rule-based safety override detected all four safety cases.

The three first-round errors exposed decision boundaries rather than general topic failures. A tired user willing to accept a shorter session and a pressured user requesting a lower-demand choice were both classified as `decline`; an explicit cancellation without rescheduling was classified as `postpone`. Explicit intent rules corrected these distinctions. However, 100% on 16 development cases is not evidence of model accuracy or real-world transfer. The set influenced development, and some improvement came from manually designed rules rather than embeddings, so it cannot serve as a final test.

## 3.2 Independent Robustness Evaluation

A subsequent robustness set contained 48 synthetic cases: 24 English and 24 Chinese, with 12 per category. Its data file likewise has no review-status field. It was created after the then-current model and rules were frozen, and introduced paraphrases, negation, mixed intentions, explicit safety language and phrases likely to cause false triggers.

MiniLM pure retrieval achieved 28/48 (58.33%): 75.00% in English and 41.67% in Chinese. Its hybrid reached 31/48 (64.58%), with 66.67% and 62.50% respectively. TF-IDF pure retrieval achieved 33/48 (68.75%): 70.83% in English and 66.67% in Chinese. Its hybrid reached 35/48 (72.92%), with 70.83% and 75.00%. The development score therefore did not persist under more varied wording. Language performance was unstable, and the simpler TF-IDF representation sometimes exceeded MiniLM. A pretrained semantic embedding did not automatically resolve project-specific intention boundaries.

The explicit safety rules detected 12/12 safety cases and produced no rule-level false positives across 36 non-safety cases. Nevertheless, before safety gating, retrieval could still determine the final category. MiniLM hybrid consequently produced 3/36 final safety false positives and TF-IDF hybrid produced 1/36. “I do not have chest pain” and “Today is chest day” illustrate the problem: the keyword rules did not fire, but semantic retrieval still returned `safety_stop`. This distinction showed that safe rule behaviour was insufficient while retrieval retained authority over the same outcome.

## 3.3 Safety-Gated Revision

The robustness failures directly motivated an architectural revision. A final `safety_stop` could no longer be produced by MiniLM or TF-IDF alone; it required an explicit safety-rule match. When raw retrieval still predicted `safety_stop` without such a signal, the engine retained that prediction, selected the highest-ranked non-safety category, set `requires_confirmation` to `true`, and recorded an `override_reason`. This reduced high-risk false positives without concealing retrieval errors. The trade-off is dependence on rule coverage: an unlisted or differently ordered safety expression may be missed. Safety gating therefore changed the risk boundary but did not resolve safety language comprehensively.

## 3.4 Frozen Final Holdout

After the safety-gated architecture was frozen, a final synthetic holdout of 60 cases was created: 30 English, 30 Chinese and 15 per category. Its file has no review-status field, and its results are synthetic experimental evidence rather than a manually validated real-world benchmark. It contained no exact repetitions of the 42 reference scenarios, 16 development cases or 48 robustness cases. Code, rules, data and expected labels were not changed after observing its results.

| Method | Overall | English | Chinese |
|---|---:|---:|---:|
| MiniLM pure | 33/60, 55.00% | 22/30 | 11/30 |
| MiniLM safety-gated | 42/60, 70.00% | 22/30 | 20/30 |
| TF-IDF pure | 38/60, 63.33% | 18/30 | 20/30 |
| TF-IDF safety-gated | 42/60, 70.00% | 20/30 | 22/30 |

Both gated systems produced zero final safety false positives among 45 non-safety cases. Their safety recall was 14/15 (93.33%); for `safety_stop`, precision was 1.00, recall 0.933 and F1 0.966. The single miss, `H-EN-S07`, contained the expression “pain became suddenly sharp”. It was classified as `adapt` because the frozen rule wording did not match this ordering. The failure was retained and was not used for further modification.

Although both gated backends reached 70%, neither resolved the remaining non-safety distinctions. Adaptation was still confused with postponement or refusal, while postponement and refusal were also interchanged. For example, a request to cut a routine in half was classified as `decline`, and a changed decision to remove a previously postponed session was classified as `postpone`. The complete failures remain in `final_holdout_results.json`; 70% should not be interpreted as high accuracy or deployment readiness.

## 3.5 Interpretation and Limitations

The comparison demonstrates why the development result was misleading: 100% on a small, development-facing set became 70% on frozen independent data. Hybrid decisions exceeded pure retrieval in the final holdout, supporting the value of explicit intent and safety boundaries, but not embedding performance alone. TF-IDF equalled or exceeded MiniLM in several comparisons, showing that added model complexity was not inherently beneficial for this small, project-specific synthetic corpus.

Safety gating eliminated final `safety_stop` false positives for non-safety holdout cases, yet missed one genuine safety expression. Likewise, `requires_confirmation` is an interface response to weak or conflicting retrieval evidence, not a guarantee of correctness. All evaluation inputs were synthetic, and their labels express this project’s design taxonomy rather than medical or exercise-science truth. The findings support further investigation of a transparent technical architecture, not real-world deployment. Finally, the ML evaluation examined classification behaviour, whereas Figma user testing examined whether people understood, controlled and used the interface. Neither form of evaluation can substitute for the other.

# 4. Research Question and Methodology

## 4.1 Research Question and Objectives

The final research question was:

> How can AI-assisted decision support help users adapt a planned workout when their current state no longer matches the original plan, while preserving transparency, autonomy and safety?

Here, *AI-assisted* means that computational support informs rather than makes the decision. *Decision support* concerns a specific mismatch, not long-term plan generation: fatigue, time, motivation or discomfort now makes an earlier workout plan unsuitable. Transparency keeps the system's interpretation and reasoning inspectable; autonomy leaves the final choice with the user; and safety stops recommendation when an explicit risk boundary is encountered.

The project pursued seven design objectives:

1. Make the system's interpretation of the user's state and plan visible.
2. Allow users to correct that interpretation without restarting the whole flow.
3. Represent four possible paths: `adapt`, `postpone`, `decline` and `safety_stop`.
4. Permit users to accept, modify, reject or stop a suggestion.
5. Avoid pressuring or morally judgemental exercise language.
6. Make data-retention choices and safety boundaries explicit.
7. Test interaction comprehension through a high-fidelity prototype, while separately examining technical classification through an ML experiment.

These were research aims, not guarantees of a completed product's behaviour.

## 4.2 Design and Prototyping Process

The iterative, user-centred process focused on one decision point: what to do when a current state no longer matches an earlier plan. This defined the scope around visible interpretation, correction and several outcomes.

A high-fidelity clickable Figma prototype represented the intended interaction and visual design. It was not a developed, deployed or longitudinally usable application: it had no live database, account system or ML connection. The flow made AI interpretation visible, allowed correction, offered acceptance, modification and rejection, and included lower-pressure alternatives, explicit refusal, planned-time editing, privacy choice and a safety boundary. The user's final choice remained authoritative, although not every branch was empirically tested.

## 4.3 Usability Testing

Usability evidence came from two separate stages: one early pilot and Round 2 with four new participants. The pilot is excluded from the later 4/4 findings. Round 2 examined product-purpose understanding, decision-support framing, final authority, main-flow completion, privacy choice and planned-time modification.

All four Round 2 participants described the concept as exercise decision support rather than a fitness-plan generator. All four also understood that the system provided a reference while the final decision remained theirs. These findings support the core framing for this small set; they do not establish statistical representativeness or repeated-use behaviour.

Two sessions exposed ambiguity in the original privacy-retention wording. It was revised to an explicit no-save choice, expressed as "do not save this information", and the fourth participant subsequently understood independently that the information would not be saved or used for future suggestions. Time editing produced a separate interaction failure: the third participant could not complete the original non-functional preview. The control was rebuilt as an explicit change from 18:30 to 19:00, after which the fourth participant completed the revised interaction independently.

Text density and the prefilled entry framing each appeared once. They were retained as monitor items rather than treated as repeated findings. Correction, explicit refusal and the `safety_stop` flow were not formally tested in Round 2. Consequently, the testing supports specific revisions and aspects of comprehension, not the claim that the complete prototype was validated.

## 4.4 Relationship Between the UX Prototype and ML Experiment

The study contains two separate forms of evaluation. The Figma prototype examined understanding, interaction clarity, autonomy, privacy wording and time modification. The ML experiment examined text classification, semantic retrieval, explicit intent rules, safety gating, synthetic performance and failure modes.

The ML engine was not connected to the Figma prototype or the live portfolio website. Participants did not interact with a running classifier; the prototype presented pre-designed content and outcomes. The ML work was a later, independent technical investigation. The prototype evaluated the interaction design, while the separate ML experiment evaluated a possible technical decision pipeline. The two strands complement one another, but usability findings cannot validate ML accuracy, and ML metrics cannot demonstrate that users understand or trust the interface.

## 4.5 Methodological Limitations

The participant group was small, and backgrounds were not systematically reported. Testing covered the main flow rather than long-term use; correction, explicit refusal and safety stopping remained untested. Figma outputs were predetermined, and responses may have been influenced by wording or facilitation. No statistical comparison of interface versions was made.

The technical evidence has different limitations. All ML inputs were synthetic, and the categories reflect the project's design taxonomy rather than medical or exercise-science truth. UX and ML evaluation therefore address different questions through different evidence. Together they cannot prove product effectiveness, improved exercise outcomes, real-world generalisation or medical safety.

Nevertheless, the methodology produced useful formative evidence. Usability sessions identified concrete privacy and time-edit problems that could be revised and checked, while technical evaluation exposed the limits of similarity-based classification and directly motivated the safety-gated architecture. These findings justify further investigation, but not deployment claims.

# 5. UX Findings and Discussion

## 5.1 Understanding the Product

Round 2 involved four new participants; the earlier pilot was reported separately and is not included in either 4/4 result. All four understood the concept as exercise decision support rather than a long-term fitness-plan generator. All four also understood that the system offered a reference while the final choice remained with the user. This suggests that the central positioning was intelligible within the tested core flow. The interface did not evidently lead these participants to believe that AI replaced their judgement, supporting the project's intended principle of support rather than command.

This is limited evidence. Four participants cannot represent the range of interpretations likely across different users, contexts or levels of familiarity with AI. The sessions concentrated on the principal decision sequence rather than repeated or long-term use. They therefore support the clarity of the framing for this small sample, not a general claim that every user would understand the product in the same way.

## 5.2 Autonomy, Transparency and Pressure

The final design expresses autonomy by keeping the AI interpretation visible for review and presenting acceptance, modification and rejection as possible responses. Lower-pressure alternatives allow the proposed action to change rather than merely softening its wording, while stopping or declining is treated as a complete outcome. The system does not define adherence to the original workout as the only success: `adapt`, `postpone` and `decline` are legitimate paths, and `safety_stop` takes priority over continuing exercise.

These features reflect principles developed through the project's iterations, but they were not all formally tested. Participants did state that the final choice remained theirs. However, Round 2 did not formally validate the correction flow, explicit refusal or the safety-stop flow. Their presence demonstrates a design intention, not proven ease of use or psychological effect. In particular, the study did not measure anxiety, guilt or perceived pressure, so it cannot show that the interface reduced any of them.

## 5.3 Privacy and Interaction Revisions

Two Round 2 sessions exposed misunderstanding in the original privacy language. Abstract retention and permission wording did not communicate its practical consequence clearly enough. The choice was therefore rewritten to state explicitly that the current information would not be saved. In one subsequent verification, the fourth participant independently understood that it would neither be retained nor used for future suggestions. This was one check of revised wording, not evidence that all four participants tested or understood the final version.

The time-edit interaction revealed a different problem. The third participant could not complete the original interaction because its preview did not provide a functional, visible change. This was an interface failure rather than evidence of inadequate participant ability. The control was rebuilt to show a clear transition from 18:30 to 19:00, and the fourth participant then completed it independently.

Together, these revisions indicate that visible state changes are more dependable than implied interactions, while privacy choices need to state their consequence directly. They also show why a single issue can merit immediate correction when it blocks a core flow, even though one occurrence cannot establish prevalence.

## 5.4 Unvalidated Interaction Claims

The current tests cannot establish whether correction is easy to use, whether users will actually refuse an AI suggestion, or whether a safety stop will be interpreted correctly. They do not show whether long-term use strengthens or weakens autonomy, whether dependence develops, how users respond when dynamic AI output is wrong, or whether different user groups share the same understanding. Nor can they show whether privacy trust would persist when real personal data were involved.

The Figma prototype presented predetermined content. Testing therefore concerned interface expression, flow comprehension and interaction clarity. It did not evaluate real-time model performance, backend reliability or the quality of personalised recommendations. Text density and prefilled entry framing each appeared once and remain monitor items rather than repeated findings. These boundaries prevent an exploratory usability study from being presented as validation of the entire system.

## 5.5 Design Implications

The UX evidence and the unresolved risks support seven working principles:

1. AI interpretation should be visible and correctable.
2. Recommendations should remain optional.
3. `Adapt`, `postpone` and `decline` should appear without moral ranking.
4. Privacy choices should state their practical consequence directly.
5. Changes to time or plan should produce visible confirmation.
6. Safety should interrupt ordinary recommendation logic.
7. Uncertain classifications should invite confirmation rather than appear authoritative.

The final principle connects the interface to the separate ML experiment: `requires_confirmation` offers a possible way to express technical uncertainty in the interaction. That specific response has not been usability tested. A future study should connect real ML output to a controlled prototype and examine how users understand, correct and act on uncertain or erroneous classifications.

Overall, the UX testing supports the product positioning and its central autonomy framing, while revealing actionable privacy and time-edit failures. The evidence remains formative and narrowly scoped. It does not justify describing the project as a validated, complete product.

# 6. Ethical, Societal and Environmental Considerations

## 6.1 Autonomy and Persuasive Pressure

Exercise technologies can imply that adherence is the only correct outcome, using guilt, pressure or moral judgement to shape behaviour. An AI recommendation may also be interpreted as a command, while repeated reliance could gradually transfer personal decisions to the system. This project responds by treating `adapt`, `postpone` and `decline` as legitimate choices rather than ranking refusal as failure. The interface exposes its interpretation, allows suggestions to be accepted, modified or rejected, leaves the final decision with the user and provides a route to stop further prompting.

These choices reduce coercive expression within the prototype, but they cannot show that dependency would not emerge through long-term use. Anxiety, guilt and psychological pressure were not formally measured, so the project provides no evidence of improved mental health.

## 6.2 Safety and Non-medical Boundaries

Descriptions of fatigue, discomfort, pain or breathing difficulty can have health significance, yet similarity models cannot reliably perform medical judgement. The robustness audit showed that ordinary language could be misclassified as `safety_stop`. The final safety-gated architecture therefore permits that outcome only through explicit safety rules; semantic retrieval alone cannot impose it.

On the frozen holdout, both gated backends produced 0/45 final safety false positives and detected 14/15 safety cases (93.33% recall). The retained miss contained “pain became suddenly sharp”. Zero false positives does not make the system safe: this single false negative demonstrates incomplete rule coverage. The rules are not clinical standards, and the technical experiment cannot diagnose, screen or replace professional medical advice. Deployment as a health decision tool would require specialist review, real-data evaluation and substantially stronger risk testing. The frozen failure has not been used for further tuning.

## 6.3 Privacy, Data and Synthetic Evidence

The usability sessions showed that abstract data-authorisation language could be misunderstood. Replacing it with a direct statement that the current information would not be saved made the practical consequence clearer in one subsequent verification. However, the Figma prototype had no database or long-term user-data storage and was not connected to the separate ML experiment, which used no participant health data.

The 42 reference scenarios, 16 development cases, 48 robustness cases and 60 holdout cases are all synthetic. An LLM assisted their generation. The repository marks six later boundary examples as manually reviewed, while 36 original reference rows remain marked “manually review required”; they must not be represented as fully reviewed participant evidence. The 16-, 48- and 60-case files contain no review-status field, so completed human review cannot be inferred for them. Synthetic data avoided collecting sensitive health information during this early experiment and enabled deliberate boundary and failure cases. Conversely, it cannot represent real language distributions, may reproduce generative and labelling biases, and cannot establish real-world generalisation.

## 6.4 Bias, Language and Accessibility

The project includes English and Chinese material, but robustness and holdout performance varied between languages. Bilingual coverage is therefore not evidence of cross-cultural reliability. Vocabulary, negation, metaphor and non-standard expression can alter classification, while the synthetic language coverage remains narrow. The four labels also encode project-defined decision boundaries that other cultures or users may not share. Direct statements may be easier to classify than indirect or idiomatic ones, and the small participant sample cannot reveal group-level differences.

No systematic accessibility evaluation was conducted. The prototype cannot be claimed suitable for people with visual, cognitive or other specific access needs. Future work should include screen-reader and keyboard testing, language simplification and testing with more diverse participants.

## 6.5 Environmental Considerations

The experiment did not train or fine-tune a new large model. It used pretrained MiniLM embeddings and also implemented a simpler TF-IDF baseline, which equalled or exceeded MiniLM in parts of the small synthetic evaluation. Greater model complexity was therefore not automatically beneficial. A responsible implementation should select the lowest computational complexity that meets the task, considering smaller local models or non-neural baselines rather than adopting expensive technology for an “AI” label.

No energy or carbon measurement was performed, so no reduction claim is possible. Model download, inference, development evaluation and hosting still carry environmental costs. Overall, transparency, user control, data minimisation and safety gating address some risks, but they are neither ethical nor safety certification. The evidence supports further research, not deployment as a real health product.

# 7. Conclusion

This project asked how AI-assisted decision support could help users adapt a planned workout when their current state no longer matched the original plan while preserving transparency, autonomy and safety. The findings suggest that such support should not attempt to make the decision for the user. Instead, it can make its interpretation visible, offer reversible and non-moralised alternatives, preserve refusal and interrupt ordinary recommendations when a safety boundary is detected.

The design outcome is a high-fidelity clickable Figma prototype, not a developed or deployed application. It represents four decision paths: `adapt`, `postpone`, `decline` and `safety_stop`. The interface exposes what the AI has understood and allows a suggestion to be accepted, modified or rejected, while the final choice remains with the user. In Round 2, all four new participants understood the concept as decision support rather than a fitness-plan generator, and all four understood that the AI provided a reference while they retained the final decision. Testing also identified ambiguous privacy wording and an ineffective time-edit interaction; both revisions were subsequently checked once with the fourth participant. These findings remain narrow. Correction, explicit refusal and safety stopping were not formally validated in Round 2.

The separate technical experiment combined MiniLM embeddings, cosine similarity, a TF-IDF baseline, explicit intent rules and safety gating. Perfect hybrid performance on the 16-case development set did not survive broader testing: the 48-case robustness set exposed substantial retrieval limitations. On the frozen 60-case holdout, both safety-gated backends classified 42/60 cases correctly (70%). They produced 0/45 final `safety_stop` false positives among non-safety cases and detected 14/15 safety cases (93.33%). The retained `H-EN-S07` miss shows that safety gating improved control over safety outputs without resolving rule coverage or the remaining category confusion.

The contribution is therefore a transparent, rejectable and safety-gated approach to exercise decision support; an independent technical feasibility experiment; and design principles derived from observed failures. It is not a validated health product, medical safety tool, deployed AI application, or evidence of improved adherence or mental health. The research supports continued exploration of transparent, user-controlled AI assistance, but the present evidence is insufficient for deployment in real health contexts.

# 8. Future Work

The first priority is data and safety review. The 36 reference scenarios still marked “manually review required” should be reviewed before further model claims are made. A clear labelling guide should define the boundaries between `adapt`, `postpone`, `decline` and `safety_stop`, and multiple reviewers should independently label a subset so that disagreement and consistency can be examined. Current synthetic labels should not be treated as ground truth. Safety language and rule coverage require specialist review, including the retained `H-EN-S07` failure.

Real-user language should then be studied under appropriate consent, ethical review and data-protection measures. Research should examine how people naturally describe fatigue, low motivation, pain, cancellation and rescheduling without collecting unnecessary health information. Data minimisation should govern what is requested and retained. No real-user material should enter the system without privacy and ethical review, and the current synthetic corpus should remain clearly separated from participant evidence.

UX testing should use a larger and more diverse sample and formally examine correction, explicit refusal, `safety_stop` and a future `requires_confirmation` interaction. It should also test responses to incorrect dynamic outputs, possible over-reliance, changes in perceived autonomy over time, and privacy wording when real data consequences exist. Alternative interface versions could be compared, although statistical significance should only be claimed if the design and sample size justify it.

Only after these steps should a controlled functional web prototype connect the frozen ML pipeline to the interface. It should first operate in a research environment, not as a public health-advice product. The interface should expose the raw interpretation, similarity-based confidence information clearly marked as uncalibrated, decision layer and override reason; low-confidence outputs should request confirmation. Any safety-related behaviour would require professional review.

Technical work could improve negation and contextual handling, investigate English-Chinese differences, examine better uncertainty thresholds, compare other lightweight classifiers, test rule coverage, explore calibration and establish failure monitoring. Increasing model complexity should not be assumed to improve performance. Accessibility work should include screen-reader testing, keyboard navigation, simplified-language variants and more diverse participants. Environmental evaluation should measure energy used by inference, development testing and hosting, comparing MiniLM and TF-IDF across both performance and computational cost.

The practical order is therefore: first complete data and safety review; second test the currently unvalidated interactions; third build and evaluate a controlled functional prototype; and only then consider whether broader deployment research is justified.

# 9. LLM Disclaimer

OpenAI ChatGPT and Codex contributed substantially to this project. They supported early ideation and scope discussion, comparison and narrowing of project directions, organisation of project evidence, drafting and editing interface wording, structuring this critical report, and generating and revising English prose. They also assisted with proposing literature search terms and organising candidate sources. The final nine sources were manually verified by the student through formal academic databases, publisher records or official institutional websites, and their PDFs were downloaded by the student. Codex also helped prepare implementation instructions and implement, debug and test the ML experiment, including documentation and evaluation scripts. Generative AI assisted the creation of synthetic scenarios and later helped identify factual inconsistencies in the report.

Early project discussions were distributed across multiple ChatGPT conversations and more than one account, and not every early conversation has been retained. Chat transcripts are therefore not treated as a complete supervisory record. The final Figma artefacts, user-testing records, GitHub code, checked-in data and frozen evaluation outputs form the principal factual basis for this report.

The data disclosure remains limited: the 42 reference scenarios are LLM-assisted synthetic data, of which six are marked “manually reviewed” and 36 remain marked “manually review required”. The 16 development, 48 robustness and 60 holdout files have no `review_status` field. None can be described as entirely human-validated evidence. Automated tests verify specified code behaviour, not the semantic correctness of every label.

Project direction and final scope were selected by the student. User testing was conducted and interpreted by the student, and generated suggestions were accepted, rejected or revised by the student. The student remains responsible for factual accuracy, ethical judgement and the final submission. AI generated a substantial proportion of initial prose and code; its outputs may contain errors, bias or unjustified certainty. Key claims and figures were consequently cross-checked against repository files and final artefacts rather than accepted from model output alone.

# References

Amershi, S., Weld, D., Vorvoreanu, M., Fourney, A., Nushi, B., Collisson, P., Suh, J., Iqbal, S., Bennett, P.N., Inkpen, K., Teevan, J., Kikin-Gil, R. and Horvitz, E. (2019) ‘Guidelines for Human-AI Interaction’, *Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems*, pp. 1–13. https://doi.org/10.1145/3290605.3300233

Buçinca, Z., Malaya, M.B. and Gajos, K.Z. (2021) ‘To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted Decision-making’, *Proceedings of the ACM on Human-Computer Interaction*, 5(CSCW1), article 188, pp. 1–21. https://doi.org/10.1145/3449287

Hardeman, W., Houghton, J., Lane, K., Jones, A. and Naughton, F. (2019) ‘A systematic review of just-in-time adaptive interventions (JITAIs) to promote physical activity’, *International Journal of Behavioral Nutrition and Physical Activity*, 16, article 31. https://doi.org/10.1186/s12966-019-0792-7

Miller, T. (2019) ‘Explanation in artificial intelligence: Insights from the social sciences’, *Artificial Intelligence*, 267, pp. 1–38. https://doi.org/10.1016/j.artint.2018.07.007

Nahum-Shani, I., Smith, S.N., Spring, B.J., Collins, L.M., Witkiewitz, K., Tewari, A. and Murphy, S.A. (2018) ‘Just-in-Time Adaptive Interventions (JITAIs) in Mobile Health: Key Components and Design Principles for Ongoing Health Behavior Support’, *Annals of Behavioral Medicine*, 52(6), pp. 446–462. https://doi.org/10.1007/s12160-016-9830-8

National Institute of Standards and Technology (2023) *Artificial Intelligence Risk Management Framework (AI RMF 1.0)*. Gaithersburg, MD: National Institute of Standards and Technology. NIST AI 100-1. https://doi.org/10.6028/NIST.AI.100-1

Ntoumanis, N. and Moller, A.C. (2025) ‘Self-determination theory informed research for promoting physical activity: Contributions, debates, and future directions’, *Psychology of Sport and Exercise*, 80, article 102879. https://doi.org/10.1016/j.psychsport.2025.102879

Teixeira, P.J., Carraça, E.V., Markland, D., Silva, M.N. and Ryan, R.M. (2012) ‘Exercise, physical activity, and self-determination theory: a systematic review’, *International Journal of Behavioral Nutrition and Physical Activity*, 9, article 78. https://doi.org/10.1186/1479-5868-9-78

World Health Organization (2021) *Ethics and governance of artificial intelligence for health*. Geneva: World Health Organization. Electronic ISBN 978-92-4-002920-0.
