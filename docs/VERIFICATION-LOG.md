# Verification log

Every figure in `src/domain` was transcribed without access to the gazette. On
2026-09-10 the authoritative document arrived (TMPR8, 4/9/25 version, Housing & Urban
Planning Department). This records what was checked against it and what came back.

**Headline: three transcriptions were verified exactly right, and twelve real bugs were
found — nine of which made the engine permit or charge more than the byelaws allow.**

That ratio matters. The engine was not uniformly wrong, and the two secondary web
sources consulted before the document arrived were *both wrong* about the one rule they
described. Verification has to be against the source, not against consensus.

---

## Resolved

### V-001 — Front setback derived from plot area — ENGINE CORRECT
Two web sources claimed the front margin was driven by abutting road width. The gazette
table at Para 3.2.4.1 is keyed on **plot area**, exactly as the engine had it:

| Plot area | Front | Rear | Side-1 | Side-2 | Typology |
|---|---|---|---|---|---|
| Up to 150 | 1 | 0 | 0 | 0 | Row-housing |
| >150 to 300 | 3 | 1.5 | 0 | 0 | Row-housing |
| >300 to 500 | 3 | 3 | 0 | 0 | Row-housing |
| >500 to 1200 | 4.5 | 4.5 | 1.5 | 0 | Semi-detached |
| >1200 | 6 | 6 | 1.5 | 1.5 | Detached |

**Closed. No change required.** Both secondary sources were wrong; one appears to have
blended in another state's development control rules.

### V-002 — Telescopic FAR ladder — ENGINE CORRECT
Three mutually inconsistent ladders existed before consolidation. The one retained
matches the gazette exactly: 150 @ 2.0, >150–300 @ 1.8, >300–500 @ 1.75, >500–1200 @ 1.5,
>1200 @ 1.25. **Closed. No change required.**

### High-rise progressive setbacks — ENGINE CORRECT
Para 3.2.4.9 matches the engine at every band, including the >51 m row (15/12/12/12).
Note the scope qualifier: the table applies to occupancies *other than* single/multi
units. **Closed.**

---

### V-004 — Compounding schedule — SIX ERRORS, ALL FIXED
Chapter 16 read in full: 16.1.3 (offences that shall not be compoundable), 16.2 (the
compoundable-limits table), 16.3.3–16.3.7 (calculation and realisation), and the
Schedule of Compounding Fee at 16.3.8 (Rule No 4) with its five Notes.

The engine's model was a reconstruction, and it was wrong in six ways. See B-007 to
B-012 below. **Closed** — every figure in `src/domain/compounding.ts` now carries its
gazette quote, and `compounding.schedule` is marked `confidence: 'gazette'`.

One ambiguity survives and is recorded as **V-004b**: Item 10 charges "@Rs. 6132/- per
running meter of height (measured as per periphery of existing building) per floor".
The parenthetical says the running metres are the building's perimeter, which makes the
charge perimeter × floors; read literally, "per running meter of height" would make it
the metres of excess height. The two readings differ by orders of magnitude. The engine
charges the larger and prints the other on the line item, so the figure is never quietly
low.

#### How the column-B setback cell was resolved
The gazette's compoundable-limits table prints column B's setback rule once and leaves
the rear and side rows visually blank. That is either "the same rule applies" or "not
specified", and the difference decides whether a 30 m building may compound a rear
setback at all.

The document's own XML settles it. In the column-B cells for the Front, Rear and Side
rows, `tcBorders` carries `top=nil` and `bottom=nil` — no horizontal rules are drawn
between them — while the cell below (Ground Coverage & FAR) restores its top border. In
Word that is a vertically merged cell, and its single line of text governs all three
faces: *"10 percent of setback area (maximum up to a width of 1-meter), subject to
Fire NOC."* The contrast with the Building Height row is decisive: there column B
carries an explicit `-`. The drafter distinguishes "same rule" from "not allowed", and
uses a dash for the second.

---

## Bugs found and fixed

### B-001 — Max FAR ceiling was ignored (over-permission)
The gazette sets **Max FAR = 2.0 in every band** of the plotted residential table. The
engine added a purchasable increment on top of the telescopic base and so permitted up
to 2.4. It over-permitted on every plot below about 1200 m² — up to **105 m² of floor
area that cannot be sanctioned**.
*Fixed: the ceiling now comes from the table and purchasable FAR is the gap beneath it.*

### B-002 — Group housing Base FAR escalated with road width
The engine raised Base FAR 1.75 → 2.5 as the road widened. The gazette holds Base FAR
**flat** (1.5 built-up, 2.5 non-built-up) and uses road width to set **Max** FAR
(9–12 m → 2.0, >12–18 m → 3.0, >18–24 m → 3.0, >24–45 m → 5.25, >45 m → unrestricted).
Base and ceiling were conflated.
*Fixed: base is a property of occupancy and area type; road width sets the ceiling.*

### B-003 — Commercial FAR had the same inversion
Gazette: base 1.5 built-up / 1.75 non-built-up; Max FAR ≤12 m → 2.1, >12–24 m → 3.0,
>24–45 m → 5.0, >45 m → unrestricted. *Fixed alongside B-002.*

### B-004 — Green-building FAR applied in the wrong place
Chapter 9.3 grants 3% / 5% / 7% "additional FAR **on availed FAR**", and states five
times that it is "**over and above the MFAR**". The engine folded it into Base FAR and
then capped the result — understating the entitlement while consuming purchasable
headroom the gazette does not touch. The percentages themselves were right.
*Fixed: granted above the ceiling.*

### B-005 — Commercial setbacks missing the >3000 m² band
The gazette has five bands; the engine had four, so any commercial plot above 3000 m²
received 6/3/3/3 where 12/6/6/6 is required — **half the required front setback**.
*Fixed.*

### B-006 — Height ceiling followed occupancy instead of plot size
Gazette 3.2.4.1: "for all single/multi-units less than 300 square meters plot size,
three floors with stilts up to 15 meter … and on plots above 300 square meters, four
storeys with stilts up to 17.5-meter height". The engine capped single-unit dwellings at
15 m regardless of plot size, under-permitting height on plots above 300 m².
*Fixed: the ceiling follows the plot.*

### B-007 — A 10% "administrative surcharge" that does not exist
The engine added `ADMIN_SURCHARGE_FRACTION = 0.10` on top of every assessed fee.
Chapter 16 levies no such surcharge. 16.3.4.2 mentions "Other fees prescribed by the
Authority" without quantifying them, which is not a licence to invent 10%.
*Fixed: the total is the sum of the line items and nothing more.*

### B-008 — One fee basis where the gazette has two
Every deviation was priced as a multiple of the circle rate. The schedule at 16.3.8 has
**two** bases — a rupee rate per square metre (Items 1, 3, 5–10 and Note-1) and a
percentage of the price of land (Items 2, 4, 11, 12) — and Item 3 charges *both at once*
("Rs. 491 per sqm. and 50% of required land price for additional floor area"). Collapsing
them made every quote wrong, mostly far too low: the engine charged residential excess
FAR at 50% of the circle rate where the gazette charges 50% of the land price **plus**
₹491/m².
*Fixed: each head carries its own basis.*

### B-009 — The whole rear setback was compoundable for everyone
`COMPOUNDABLE_SETBACK_LIMITS.rear = 1.0` let any building fill its entire rear setback.
The gazette grants that only to **residential plots up to 500 m², and only "in cases
where proper provisions have been made for light and ventilation"**. A residential plot
above 500 m² gets 10%; every non-residential use gets 10%; column B gets 10% capped at
1 m. *Fixed, with the condition surfaced rather than assumed.*

### B-010 — No setback was compoundable above 15 m
`assessSetbackFaces` used `required.isHighRise ? 0 : limit`, making every high-rise
setback shortfall a flat violation. Column B of the 16.2 table allows 10% of the setback
area, up to a width of 1 m, subject to Fire NOC. This one erred toward refusal rather
than permission, but it told applicants to demolish work the byelaws would regularise.
*Fixed.*

### B-011 — A 10% height deviation was allowed where the gazette allows none
`COMPOUNDABLE_HEIGHT_LIMIT = 0.10` was applied universally. Column B of the 16.2 table
prints **"-"** against Building Height: above 15 m, and in group housing at any height,
excess height is not compoundable at all. The engine was quoting a price for something
that has to come down. *Fixed: the limit is 0 in column B.*

### B-012 — Nine fee heads and both caps were missing entirely
Not modelled: the Item 1 plot-size bands (₹25 / 38 / 50 / 62 per m²); Item 1F's
**₹1,22,640 per compoundable unit**; Item 4 (basement); Items 5–8 (room height, width,
area, light and ventilation); Item 9 (compound wall, with its ₹5,000 floor); Items 11–12
(land division); Note-1 (porch, balcony, chhajja at ₹491/m²); Note-2 (10% of the impact
fee); Note-3 (half rate for 80(G) charitable and public institutions); Note-4 (annual
cost-index revision of the per-m² heads only). Also missing: the **absolute 1.0 m cap**
that sits alongside the 25% front allowance, and the cap on compoundable units. And only
7 of the 13 offences at 16.1.3 were represented.
*Fixed: all thirteen bars, all thirteen fee items, and all five notes.*

Two calculation rules were also absorbed. 16.3.6.1 — "only the residential rate of the
land shall be taken into consideration" — means the land rate does not change with the
building's use; the *multipliers* carry the use, not the rate. And the note under the
16.2 FAR row — "Construction in front, rear and side setbacks shall be counted while
calculating the maximum permissible compoundable area" — means the setback allowance and
the 10%-of-FAR allowance are **one allowance**, not two. The engine now says so.

---

## Still open

### V-003 — Non-commercial occupancies routed to the commercial FAR matrix
Offices, hospitals, schools, assembly and industrial uses still read the commercial
road-width table because no separate matrix has been extracted yet. The gazette has
per-occupancy tables; they have not been transcribed.

### V-004b — Item 10's quantity is ambiguous in the gazette
"@Rs. 6132/- per running meter of height (measured as per periphery of existing
building) per floor". Perimeter × floors, or metres of excess height? The engine charges
the larger and prints the alternative on the line item. Settling this needs an
authority's worked example, not a re-reading.

### V-006 — The thirteen non-compoundable bars are modelled but not collected
`NonCompoundableFlags` carries all thirteen offences at 16.1.3 and each one ends the
assessment. Nothing in the app sets them: whether the plot is disputed, whether the Fire
NOC was obtained, whether the land is a filled pond are facts about the site and its
clearances, not about the drawing. Advanced mode has to ask. Until it does, the fee is
quoted on the assumption that none of the thirteen applies, and that assumption is
stated in the caveats.

### V-005 — Occupancy thresholds are inferred
Minimum road widths, plot sizes and parking ratios for the sixteen occupancies were
reasoned from the four that existed, not read from the gazette.

### Not yet modelled
- Built-up versus non-built-up area type is now in the FAR engine but not in the UI, so
  every project is assessed as built-up — the more restrictive reading.
- Para 3.2.4.9 Note-1: on a plot facing two roads of different widths, the side facing
  the **wider** road is the front.
- Para 3.2.4.9 Note-2: an alternative compliance path trading ground-floor setback
  against upper-floor stepping.
- Table Note-2 on corner plots distinguishes new layouts from already-approved ones.

---

## Method

One entry per claim. Record what the engine asserts, what challenges it, what evidence
was seen, and what would settle it. **Close an entry only against the gazette text**, and
quote the clause when you do.
