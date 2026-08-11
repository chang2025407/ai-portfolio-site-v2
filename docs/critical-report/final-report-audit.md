# Final Critical Report Audit

## Locked Facts

- **Research question:** How can AI-assisted decision support help users adapt a planned workout when their current state no longer matches the original plan, while preserving transparency, autonomy and safety?
- **Participant numbers:** One early pilot was conducted separately from Round 2. Round 2 involved four new participants, and the pilot is not included in either 4/4 finding.
- **Round 2 findings:** All four participants in this small sample understood the concept as exercise decision support rather than a fitness-plan generator. All four understood that the AI provided a reference while the final decision remained theirs. Privacy wording was misunderstood in two sessions. The fourth participant understood the revised no-save wording. The third participant could not complete the original time edit; after it was rebuilt as an explicit 18:30-to-19:00 change, the fourth participant completed it independently. Text density and prefilled entry framing each appeared once.
- **Unvalidated interactions:** Correction, explicit refusal and the `safety_stop` flow were not formally tested in Round 2. The proposed `requires_confirmation` interaction has not undergone usability testing.
- **Figma/ML separation:** The Figma artefact is a high-fidelity interactive prototype with predetermined content and outcomes. It has no live sensors, automatic triggering, longitudinal database, dynamic personalisation or ML connection, and is not a complete JITAI or deployed application. The ML engine is a separate Python technical experiment and is not connected to the Figma prototype or live portfolio website.
- **Reference data:** The experiment uses 42 LLM-assisted synthetic reference scenarios: 11 `adapt`, 11 `postpone`, 11 `decline` and nine `safety_stop`. Six are marked `manually reviewed`; 36 remain marked `manually review required`. The 16-, 48- and 60-case evaluation files have no `review_status` field.
- **Evaluation sets:** The development set contains 16 synthetic cases, the robustness set contains 48 synthetic cases, and the frozen final holdout contains 60 synthetic cases: 30 English, 30 Chinese and 15 per category.
- **Final ML metrics:** MiniLM pure retrieval achieved 33/60 (55.00%); MiniLM safety-gated achieved 42/60 (70.00%); TF-IDF pure achieved 38/60 (63.33%); and TF-IDF safety-gated achieved 42/60 (70.00%). Both gated systems produced 0/45 final safety false positives and detected 14/15 safety cases (93.33% recall). The retained miss is `H-EN-S07`, containing “pain became suddenly sharp”.
- **Literature count:** The final literature set contains exactly nine sources. Seven are peer-reviewed academic papers; the NIST framework and WHO guidance are authoritative institutional sources rather than peer-reviewed papers.
- **Project limitations:** The project uses a small formative usability sample and synthetic ML data. It has no real deployment, real health-outcome evidence, complete JITAI implementation, formal overreliance measurement, clinical validation or demonstrated real-world generalisation.

## Issues Found and Corrected

### Front matter

- **Original problem:** The document status remained “Working draft” after the final literature and factual audit.
- **Correction made:** Changed the status to “Final audited draft”.
- **Reason:** The label now reflects the document’s current review stage without implying publication, product validation or deployment.

### Project Evolution

- **Original problem:** The Round 2 summary used imprecise wording (“generally” and “some participants”) and did not restate that the pilot was excluded from the four-participant findings.
- **Correction made:** Specified one separate pilot, four new Round 2 participants, both 4/4 findings, two privacy misunderstandings, the fourth participant’s privacy verification, the third participant’s time-edit failure and the fourth participant’s independent completion of the revised 18:30-to-19:00 flow.
- **Reason:** The revision aligns this narrative summary with the detailed methodology and evidence sections without broadening the claims.

### Research Question and Methodology

- **Original problem:** The methodology repeated the earlier “exercise setbacks” direction outside the section that documents project evolution.
- **Correction made:** Reframed the process directly around the final decision point: a current state no longer matching an earlier plan.
- **Reason:** Earlier directions remain documented as historical development in Project Evolution but are not presented elsewhere as the final project aim.

### Ethical, Societal and Environmental Considerations

- **Original problem:** A safety paragraph referred to “the prototype” when discussing the diagnostic limitations of explicit ML safety rules.
- **Correction made:** Replaced that subject with “the technical experiment”.
- **Reason:** This prevents ambiguity between the predetermined Figma prototype and the separate ML pipeline.

### Conclusion

- **Original problem:** The statement that each interaction revision was checked “in a subsequent session” could imply separate or broader verification.
- **Correction made:** Clarified that both revisions were checked once with the fourth participant.
- **Reason:** This preserves the narrow evidence boundary and avoids overstating the extent of post-revision testing.

### LLM Disclaimer

- **Original problem:** The disclaimer did not record AI assistance with literature search terms and candidate-source organisation, or the student’s final verification and PDF download process.
- **Correction made:** Added both disclosures while retaining the existing account of substantial AI assistance with prose, code and synthetic data.
- **Reason:** The final statement now matches the locked literature audit and does not minimise AI involvement or transfer scholarly responsibility to AI.

## Claims Requiring Caution

- The usability evidence comes from one pilot and a small Round 2 sample of four participants; it is formative and not statistically generalisable.
- All ML reference and evaluation data are synthetic. Only six reference scenarios are explicitly marked as manually reviewed, while 36 require manual review, and the three evaluation files do not contain review-status fields.
- The Figma prototype and ML experiment remain separate. There is no running AI product, public advice system or real-user deployment.
- The project did not measure exercise adherence, behaviour change, anxiety, guilt, psychological pressure, mental health or other real health outcomes.
- The project is not a complete JITAI: it has no live sensing, automatic triggering, longitudinal database or dynamic personalisation.
- Overreliance was not formally measured, and participants did not encounter live ML errors.
- Correction, explicit refusal and `safety_stop` were not formally tested in Round 2; `requires_confirmation` has not been usability tested.
- Safety gating removed final holdout false positives among 45 non-safety cases but missed `H-EN-S07`. It is not medical screening, diagnosis or clinical certification.
- A 70% result on a frozen synthetic holdout is technical experimental evidence, not product accuracy, real-world reliability or deployment readiness.
- The nine literature sources inform design and risk framing; they do not provide outcomes that this project did not measure.

## Final Checks

- [x] Research question consistent
- [x] No old project direction presented as final
- [x] Pilot separated from Round 2
- [x] All ML numbers consistent
- [x] Nine references only
- [x] No unsupported claims
- [x] LLM disclaimer complete
- [x] British English checked
- [x] No PDFs committed
- [x] Abstract and conclusion answer the same research question
