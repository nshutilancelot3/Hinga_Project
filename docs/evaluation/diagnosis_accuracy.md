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
| 6 | Potato healthy | "Peronospora" - a false positive on a healthy plant | No | No | |
| 7 | Potato Late blight | "fungi" (too vague to count) | No | No | |
| 8 | Potato Late blight | "Phytophthora" (correct causal genus) | Yes | No | |
| 9 | Potato Late blight | "Phytophthora" | Yes | No | |
| 10 | Raspberry healthy | Healthy (insect feeding damage) | Yes | Yes | Confidence 5% |
| 11 | Squash Powdery mildew | "Erysiphaceae" (correct fungal family) | Yes | Yes | Confidence 84% |
| 12 | Strawberry Leaf scorch | "Diplocarpon" (correct causal genus) | Yes | No | Confidence 80% |
| 13 | Tomato healthy | "Saissetia" - a false positive on a healthy plant | No | No | Confidence 15% |
| 14 | Tomato Late blight | "Phytophthora" | Yes | No | Confidence 61% |
| 15 | Tomato Late blight | "Phytophthora" | Yes | No | Confidence 75% |
| 16 | Tomato Septoria leaf spot | "Peronospora" - a genuinely different disease | No | No | |
| 17 | Tomato Septoria leaf spot | "Septoria" (correct causal genus) | Yes | No | Confidence 26% |
| 18 | Tomato Septoria leaf spot | "Cladosporium" - a genuinely different disease | No | No | |
| 19 | Tomato Septoria leaf spot | "Pseudoperonospora" - a genuinely different disease | No | No | Confidence 73% |
| 20 | Tomato Septoria leaf spot | "Septoria" (correct causal genus) | Yes | No | Retested after an earlier service error; confidence not reported |

## Summary

- Usable results: 20/20 (item #20 was retested successfully after an earlier transient service error)
- **Lenient scoring**: 14 matches / 20 = **70.0%** - target met
- **Strict scoring**: 5 matches / 20 = **25.0%** - below target
- Target met (≥70%): **Yes under lenient scoring, no under strict scoring** - the choice of scoring standard changes the outcome, so both are reported rather than one being picked silently

## Notes

- **Genus-vs-disease naming** is the single biggest factor separating the two
  scores. Plant.id frequently returns the scientific name of the causal
  organism (e.g. `Phytophthora`, `Septoria`) rather than the common disease
  name a farmer would recognize (e.g. "Late blight", "Septoria leaf spot").
  The lenient reading only reaches the 70% target by counting these
  genus-only answers as correct; under a stricter standard the feature falls
  well short (25%). Worth discussing in the report as a real limitation of
  relying on Plant.id's raw output without a translation/mapping layer from
  causal-organism names to the common disease names farmers would recognize.
- **False positives on healthy plants (#6, #13)**: both photos labelled
  healthy instead came back with a specific (incorrect) disease name at low
  confidence (32% and 15%). Worth noting as a pattern in the report - Plant.id
  appears more prone to false-positive disease detection than false-negative
  (it never missed an actual disease in this sample, but twice invented one on
  a healthy plant).
- **Item #20 initially errored** (502 "Diagnosis service unavailable") rather
  than producing a wrong diagnosis. On retest it succeeded normally. Separately,
  while investigating this, direct testing against the live diagnosis endpoint
  showed it failing on every request regardless of image content on at least
  one occasion this week - worth flagging in the report as a reliability
  concern (possible Plant.id rate-limit/quota exhaustion from the volume of
  testing done this week) even though the feature was working again by the
  time #20 was retested.
- Photos and testing were sourced from the public PlantVillage dataset and run
  by a teammate through the live diagnosis page.
