# Diagnosis Accuracy Test

Source: [issue #30](https://github.com/nshutilancelot3/Hinga_Project/issues/30)

## Method

20 labelled crop disease photos (from the public PlantVillage dataset) were
submitted one at a time through the live Hinga diagnosis page (`/diagnosis`).
For each photo, the disease predicted by the Plant.id integration was compared
against the photo's known, pre-existing label (taken from the dataset's folder
name).

**Scoring judgment call:** several predictions named the correct *causal
organism* (e.g. `Phytophthora` for Late blight, `Septoria` for Septoria leaf
spot) rather than the common disease name itself. We report both readings
rather than silently picking one:

- **Lenient**: a causal-genus match counts as correct, since it identifies the
  right underlying cause even if not phrased as the common disease name.
- **Strict**: only counted correct if the predicted name is essentially the
  same as the label; genus-only answers do not count.

Target: 70% or higher overall match rate.

## Results

| # | Image (label) | Predicted | Match (lenient) | Match (strict) | Notes |
|---|---|---|---|---|---|
| 1 | Corn (maize) Common rust | "Pucciniales" (rust fungus order) | Yes | No | Order-level, not disease-specific |
| 2 | Corn (maize) Common rust | "Pucciniales" | Yes | No | Same as #1 |
| 3 | Corn (maize) healthy | Healthy | Yes | Yes | Confidence 27% |
| 4 | Corn (maize) healthy | Healthy | Yes | Yes | Confidence reported as 0% - worth re-checking |
| 5 | Corn (maize) healthy | Healthy (insect feeding damage) | Yes | Yes | Confidence 3% |
| 6 | Potato healthy | "healthy" **and** "Peronospora" in the same response | No | No | Self-contradictory output - flagged below |
| 7 | Potato Late blight | "fungi" (too vague to count) | No | No | |
| 8 | Potato Late blight | "Phytophthora" (correct causal genus) | Yes | No | |
| 9 | Potato Late blight | "Phytophthora" | Yes | No | |
| 10 | Raspberry healthy | Healthy (insect feeding damage) | Yes | Yes | Confidence 5% |
| 11 | Squash Powdery mildew | "Erysiphaceae" (correct fungal family) | Yes | Yes | Confidence 84% |
| 12 | Strawberry Leaf scorch | "Diplocarpon" (correct causal genus) | Yes | No | Confidence 80% |
| 13 | Tomato healthy | "healthy" **and** "Saissetia" in the same response | No | No | Self-contradictory output - flagged below |
| 14 | Tomato Late blight | "Phytophthora" | Yes | No | Confidence 61% |
| 15 | Tomato Late blight | "Phytophthora" | Yes | No | Confidence 75% |
| 16 | Tomato Septoria leaf spot | "Peronospora" - a genuinely different disease | No | No | |
| 17 | Tomato Septoria leaf spot | "Septoria" (correct causal genus) | Yes | No | Confidence 26% |
| 18 | Tomato Septoria leaf spot | "Cladosporium" - a genuinely different disease | No | No | |
| 19 | Tomato Septoria leaf spot | "Pseudoperonospora" - a genuinely different disease | No | No | Confidence 73% |
| 20 | Tomato Septoria leaf spot | **"Diagnosis service unavailable"** | Excluded | Excluded | Request errored - not a real prediction; recommend re-testing this one photo |

## Summary

- Usable results: 19/20 (#20 excluded due to a service error, not a wrong diagnosis)
- **Lenient scoring**: 13 matches / 19 = **68.4%** - below target
- **Strict scoring**: 8 matches / 19 = **42.1%** - below target
- Target met (≥70%): **No, under either scoring standard**

## Notes

- **Genus-vs-disease naming** is the single biggest factor separating the two
  scores. Plant.id frequently returns the scientific name of the causal
  organism (e.g. `Phytophthora`, `Septoria`) rather than the common disease
  name a farmer would recognize (e.g. "Late blight", "Septoria leaf spot").
  Even under the lenient reading this only reaches 68.4%, short of the 70%
  target - worth discussing in the report as a real limitation of relying on
  Plant.id's raw output without a translation/mapping layer to common names.
- **Self-contradictory results (#6, #13)**: two photos got a response that
  simultaneously indicated "healthy" and named a specific disease. This
  suggests the `is_healthy` flag and the top disease suggestion can disagree
  within a single Plant.id response, which is a genuine finding worth
  including in the report's evaluation/limitations section, independent of
  the accuracy number.
- **Item #20 errored** rather than producing a wrong diagnosis (502 "Diagnosis
  service unavailable"). It was excluded from both counts rather than treated
  as a failure. Recommend re-running this one photo before finalizing the
  report; if a retest succeeds, add it as row #20 and recompute both rates
  out of 20.
- Photos and testing were sourced from the public PlantVillage dataset and run
  by a teammate through the live diagnosis page.
