# Verification log

Every figure in `src/domain` was transcribed without access to the gazette. On
2026-09-10 the authoritative document arrived (TMPR8, 4/9/25 version, Housing & Urban
Planning Department). This records what was checked against it and what came back.

**Headline: fourteen transcriptions verified exactly right, and fifty-three real bugs found.**

**All eighteen chapters have now been read against the gazette.** What remains unread is the
appendices — and Appendices 8, 9, 10, 11 and 14 are already named by the structural and
licensing rules, so they are not a long tail: they are forms the engine cites and has never seen.

**The rule graph is built** (`docs/RULE-GRAPH-PLAN.md`, outcome section). **Seven of the
fifty-three bugs were found by it rather than by reading** — B-044, B-045 and B-046 from the
act of declaring what each rule reads and establishes, and B-050 to B-053 by asking the graph
where the conflict query had never looked (V-061). That question turned up two setback tables
the gazette prints and the engine had never held. It is the only part of this log not found
by a person reading the gazette.

The plan for reading the remaining chapters is in `docs/VERIFICATION-STRATEGY.md`.

That ratio matters. The engine was not uniformly wrong, and the two secondary web
sources consulted before the document arrived were *both wrong* about the one rule they
described. Verification has to be against the source, not against consensus.

---

## Resolved

### V-048 — Chapter 16's figures confirmed against the paginated chapter — ENGINE CORRECT
Every figure, every rate and the whole structure of the compounding engine survived the
check. What failed was only the numbering (B-040) and one missing note (B-041).

Two confirmations are worth recording because they were the hardest calls in V-004:

**The column-B merge.** The limits table leaves column B visibly blank for the rear and side
setback rows. V-004 decided from the docx XML — cells with nil top and bottom borders — that
this is a *vertically merged* cell, so column B's single rule ("10 percent of setback area,
maximum up to a width of 1-meter, subject to Fire NOC") governs all three faces rather than
the front alone. The PDF geometry says the same thing independently: in those two rows the
column-B cell **is not present in the row at all**, where every other row has one.

And the fee schedule confirms it a third way, from the other side of the chapter. Item 2A
gives three different rates by face — front 100%, side 75%, rear 50% of land price. Item 2B
reads *"On **all sides** of buildings >15-meter height and Group Housing except multi-units"*
with **one** rate. The schedule treats column-B buildings as having a single rule for every
face, exactly as the limits table does.

Three independent sources — docx merge metadata, PDF cell geometry, and the fee schedule's
own structure — agreeing on a cell that is printed blank. That is as well established as
anything in this repository.

**The "-" in the Building Height row.** Column B carries an explicit dash where the merged
cells carry nothing, which is what makes the merge reading safe: the drafter distinguishes
"same rule as above" from "not allowed". The engine already relied on that distinction.

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

### Chapter 10's two figures that were already right — ENGINE CORRECT
Against Clause 10.1.3, two things the engine had carried without a source came back exact.

**The 15 m threshold, and its exclusivity.** `HIGH_RISE_THRESHOLD_M = 15` applied as
`height > 15` matches "Multi-storied buildings having more than 15 meters height" precisely,
including the strict inequality — a building standing at exactly 15.0 m is outside limb (a).
Worth noting because the Chapter 2 completion clause states the same threshold **inclusively**
("15-meters and more high"), so the two are genuinely different tests and the engine happened
to hold the right one for Chapter 10 (V-037).

**The twenty-one minimum standards.** `byelawsData.ts` listed all twenty-one items of Clause
10.2.1 in the gazette's own order, correctly. What it lacked was the Note that follows them,
which is the operative part: they are *not* a universal checklist, and which apply is assessed
on covered area, height and occupancy. Added.

**Closed. No change required to either figure.**

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

### B-013 — Max FAR ignored area type
The gazette prints a separate FAR row for every occupancy in each of "(Built up)" and
"(Non-Built up)", and the ceilings differ. Group housing 2(a) built-up runs
2.0 / 3.0 / 3.0 / 5.25; 2(b) non-built-up runs 5.0 / 5.0 / 8.75 — and has **no band below
12 m**, so a new layout carries no group housing on a 9 m road where a built-up area does.
Shops 3(a) run 2.1 / 3.0 / 5.0 against 3(b) 2.45 / 3.5 / 6.0.

The engine held one ladder per occupancy and applied the built-up ceilings to both,
understating a new layout's entitlement by up to 3.5 FAR. The Base FAR split
(1.5 / 2.5 and 1.5 / 1.75) was already correct — only the ceilings were missed, and the
doc comment above the ladder had *recorded* the non-built-up figures without wiring them
in. *Fixed: both ladders are keyed on area type, and `ceilingFar` is now on the result so
the ladder can be tested against the table it came from.*

This one is also why `RuleInput` gained `areaType`. Nothing anywhere declared area type
as an input that drives the answer, so the omission was invisible outside the numbers —
the same failure mode as V-001.

### B-014 — Multi-unit plotted development was exempt from the EWS/LIG reservation
Clause 4.3.1 applies to *"all housing projects (except affordable housing schemes) having
**more than one unit**"*. The engine's `triggersEwsLig` was true only for group housing and
mixed use, and **false for multi-unit plotted development** — a building of several flats
on one plot, which plainly has more than one unit. It was silently exempted from a
mandatory 20% social-housing obligation.
*Fixed: the flag is now `multiUnitHousing`, named after the gazette's own trigger, and
true for `res_multi`.*

### B-015 — The shelter fee was offered at any scheme size (over-permission)
The engine presented the shelter fee as an unconditional alternative to building the
units. Clause 4.3.1 allows it only *"For plots less than 4 Ha"*. **At four hectares and
above the gazette offers no buy-out at all** — the units have to be built. The engine was
telling the largest schemes, exactly the ones the reservation exists for, that they could
pay their way out.
*Fixed: `SHELTER_FEE_MAX_PLOT_SQM = 40,000`, and above it the finding is marked
non-negotiable.*

### B-016 — Wrong clause, and a missing exemption
The finding cited *Chapter 4.1.2 (Social Housing)*. Clause 4.1.2 is **Minimum Plot Size**;
the rule is 4.3.1, the minimum carpet areas 4.3.3, and the fee formula 4.3.11. Clause 4.4
Note-2's exemption for affordable-housing schemes was not modelled at all.

The one thing that was right: the fee formula. *"Shelter Fees = 10% of [(total number of
dwelling units) X (minimum EWS dwelling unit carpet area + minimum LIG dwelling unit carpet
area) X Circle Rate]"* matches what the engine had. The unit count factors out, so the fee
now has an exact per-unit form — 6.5 × circle rate — that can be quoted without knowing how
many units a scheme will hold.

### B-017 — Four thresholds held only their built-up value
Chapter 4 states several thresholds separately for a built-up area and a new layout, and
**the built-up figure is the laxer one**. The engine held only that figure:

| | Engine had | Built-up | New layout |
|---|---|---|---|
| Single dwelling, min road (4.1.3) | 4 m | 4 m | **9 m** |
| Single dwelling, min plot (4.1.2) | 30 m² | no restriction | **40 m²** |
| Group housing, min road (4.2.3) | 9 m | 9 m | **12 m** |
| Group housing, min plot (4.2.2) | 1000 m² | 1000 m² | **1500 m²** |

The single-dwelling minimum plot of 30 m² matched neither column. This is the same shape as
B-013 — a rule that varies by area type, flattened to one value — and it is why
`ProjectState` now carries `areaType` and the FAR engine finally receives it instead of
defaulting to built-up on every project.
*Fixed: thresholds are `number | Record<AreaType, number>`, resolved through `forArea()`.*

### B-018 to B-021 — Chapter 5 thresholds
| | Engine had | Gazette |
|---|---|---|
| `com_shop.maxHeightM` | 15 m | **No restriction** (5.2.4: *"There shall be no restriction on building height for commercial buildings i.e. shops, commercial complex, shopping malls"*) |
| `com_bazaar.maxHeightM` | 15 m | **No restriction** (5.1.3(i)) |
| `com_shop.minRoadWidthM` | 6 m | **6 m built-up, 9 m new layout** (5.2.3) |
| `com_shop.minPlotAreaSqm` | 0 | **10 m²** — retail shops are *">10 to 100"* (5.2.2) |

The two height ceilings were over-restrictive rather than over-permissive, which is the
rarer direction, but they still told people to cut a building that the byelaws do not cap.
The road width is the same area-type flattening as B-017.

### B-022 — Bazaar street was assessed against the wrong setback table entirely
Clause 5.1.5 gives bazaar street its own front setback ladder keyed on **road width**:

| Road (m) | 12 | 18 | 24 | 30 | 36 | 45 | 76 |
|---|---|---|---|---|---|---|---|
| Front open space (m) | 3.0 | 4.5 | 6.0 | 6.0 | 7.5 | 7.5 | 9.0 |

Every other setback table in the byelaws is keyed on plot area or building height, and the
engine routed `com_bazaar` to the commercial plot-area ladder — which answers a different
question and therefore gave an unrelated number on every bazaar-street plot.

The gazette prints this table **twice**, at 5.1.5 and again at Clause 3.2.4.3 Note-3
(*"also defined in Chapter-5"*). Both printings were compared cell by cell and are
identical.
*Fixed: a `bazaar_street` setback table, and `resolveRequiredSetbacks` now takes road
width. The other three faces still fall back to Clause 3.2.4, and a building over 15 m
still goes to the fire-tender ladder.*

### B-023 — Mixed use was assessed on the table written for shops
Clause 8.1.3.1 gives mixed-use development its own BFAR/PFAR/PPFAR/MFAR table. The engine
routed `mixed_use` to `road_width_commercial`, which is rows 3(a)/3(b) — *"Shops /
Convenience Shopping / Commercial Units"*:

| | Engine had (commercial) | Gazette (Clause 8.1.3.1) |
|---|---|---|
| Base FAR, built-up | 1.5 | **2.0** |
| Base FAR, new layout | 1.75 | **2.5** |
| Max FAR, built-up | 2.1 / 3.0 / 5.0 / UR | **2.0 / 4.0 / 4.5 / UR** |
| Max FAR, new layout | 2.45 / 3.5 / 6.0 / UR | **2.5 / 5.0 / 6.25 / UR** |

On a 1000 m² plot facing an 18 m road that is 500 m² of base floor area the byelaws allow
and the engine refused — a quarter of the entitlement. This is the same fault as **B-022**,
one table standing in for another, and Chapter 3 does not catch it because **Chapter 3's
FAR matrix has no mixed-use row at all**. Clause 8.1.3.1 is the only table the byelaws
print for the use, which is why the contradiction inside it (V-025) has no second reading
to be checked against.
*Fixed: `MIXED_USE_MAX_FAR`, `BASE_FAR.mixed_use` and a `road_width_mixed_use` basis.*

### B-024 — Three mixed-use thresholds the gazette does not impose
Clause 8.1.3 states every development standard once per permissible location, and three of
the engine's figures appear in none of the five columns:

| | Engine had | Gazette (Clause 8.1.3) |
|---|---|---|
| `minPlotAreaSqm` | 300 m² | **No restriction**, in all five locations |
| `parkingEcsPer100Sqm` | 1.75 | **"As per proposed higher use"** — a pointer, not a ratio |
| `maxHeightM` | ∞ | **"Not restricted"** — already right |

The plot minimum is the same over-restriction as Clause 7.1.2 in Chapter 7, and it bites
hardest on exactly the plots the clause is most permissive about: a mixed-use zone
explicitly contemplates plots **up to 100 m²**, which the engine rejected outright.

Parking is worse than wrong, it is invented. 1.75 ECS/100 m² is below the ratio of every
commercial use that can sit inside a mixed-use building, so it under-provided parking for
all of them. The engine now carries 3.0 — the highest ratio it holds, which is the only
reading of *"higher use"* a single field can express. See V-024 for what that still misses.
*Fixed: `minPlotAreaSqm` 0, `parkingEcsPer100Sqm` 3.0.*

### B-025 — Industry carried a minimum plot size the gazette does not impose
Clause 7.1.2: *"There is no restriction on the minimum plot size for industrial buildings,
flatted factories, data centres and MSME units."* The engine required **200 m²** for light
industry and **1000 m²** for general industry.

### B-026 — The general-industry road minimum was double the gazette's
Clause 7.1.3 gives industrial buildings and MSME units **9 m in an industrial use zone**
and 7 m in an agriculture use zone; flatted factories and data centres need 12 m. The
engine required **18 m** for general industry — twice what the byelaws ask, on a threshold
that decides whether a project is permissible at all.

Both of these erred toward refusal. That direction is rarer in this codebase and no less
wrong: a lawful industrial project on a 9 m road in an industrial zone was being told to
find a wider road.

`ind_warehouse` is deliberately untouched. Warehousing is Sl. 12 of Chapter 3's commercial
matrix, not a Chapter 7 use, so Clause 7.1 does not govern it.

### B-027 — The 12 m bar on buying FAR was applied to two cases the gazette exempts
`PURCHASABLE_FAR_MIN_ROAD_WIDTH = 12` was enforced on every occupancy without exception.
Chapter 9 states the bar and then immediately carves two holes in it:

| | Engine had | Gazette |
|---|---|---|
| Group housing, built-up area | 12 m | **9 m** (Clause 9.2.1(ii), second sentence) |
| Residential plotted development | 12 m | **No road-width condition at all** (Clause 9.2.3 Note 1) |

The plotted exception is the wider of the two and the easier to miss, because it is printed
not with the bar but under a different table three pages later: *"calculation of purchasable
FAR is not dependent on the width of the approach road and will be allowed on minimum 9-m
/7.5-m or 4.0-m road as the case may be."* Chapter 3's telescopic ladder gives every plotted
band a maximum of 2.0 against a base as low as 1.25, so on a plot over 1200 m² the engine was
withholding **0.75 FAR** — 900 m² of floor area on a 1200 m² plot — from a house on a lane,
which is the overwhelmingly common case for plotted development.

Both exemptions run the same way: the engine refused purchases the byelaws allow. Nothing
in the gazette's own text makes the 12 m figure a floor for these two uses, so this is not
an ambiguity resolved strictly — it is a rule read without its exceptions, which is exactly
the failure mode the architecture research names.
*Fixed: `canPurchaseFarAt()` in `far.ts`, called by `resolveBaseFar`. The caveat it emits
now names the threshold that actually applied rather than a constant.*

### B-028 — The 500 m² gate was attached to the wrong limb of Clause 10.1.3
`fireNocAbove500Sqm` was a boolean on every occupancy, true for all fifteen
non-single-dwelling uses, and the engine required a fire clearance when
`isHighRise || (fireNocAbove500Sqm && area > 500)`. Clause 10.1.3 has three limbs and the
area belongs to exactly one of them:

> (a) Multi-storied buildings having more than 15 meters height.
> (b) Special buildings like educational, institutional, assembly, business, mercantile,
> industrial, storage and hazardous buildings as defined in National Building Code as
> amended from time to time.
> (c) Mixed occupancies with any of the aforesaid occupancies having more than 500 square
> meter covered area.

Limb (b) carries **no threshold at all**. A school, a clinic, a shop, an office, a
workshop or a godown needs a Fire Safety Certificate at any size. The 500 m² qualifies
limb (c) only, and the Chapter 2 NOC schedule (Para 2.2.3, row 7, Fire Department) restates all three
limbs in the same words — two independent statements in the gazette, agreeing.

The engine applied (c)'s threshold to (b)'s occupancies and (b)'s occupancy list to
residential. Measured across the taxonomy at 10 m height:

| | 100 m² | 300 m² | 500 m² | 900 m² |
|---|---|---|---|---|
| Twelve NBC group B–J uses | not required → **required** | → **required** | → **required** | unchanged |
| `res_multi`, `res_group_housing` | unchanged | unchanged | unchanged | required → **not required** |

The first row is the one that matters. A 300 m² nursery school or neighbourhood clinic was
told it needed no fire clearance, and Clause 16.1.3(vii) makes a missing Fire NOC one of
the thirteen offences that **cannot be compounded at any price** — so the engine was
routing people toward a building that could never afterwards be regularised. The second
row is the mirror error and costs only time.

*Fixed: `fireNocAbove500Sqm` is replaced by `nbcGroup` on every occupancy, and
`assessFireSafety` in `src/domain/fire.ts` evaluates the three limbs separately and names
which one fired. Thirty-nine tests in `fire.test.ts`.*

### B-029 — A non-negotiable block on a rule that is not in the gazette
The engine blocked any building over 15 m on a road narrower than 12 m, with
`nonNegotiable: true`, headlined *"A building over 15 m needs a 12 m road for fire
engines"* and cited to **"Chapter 8.1.2 (Fire Egress and Access)"**. Chapter 8 is Mixed-Use
and Transit-Oriented Development. It has no clause 8.1.2 about fire.

Chapter 10 is where such a rule would live, and reading it is what settles the question:
it does not state one. Its only definition of access, at Clause 10.2.1, carries no width —

> Access to the building shall mean the availability of means of approach to each floor of
> the building or to nearest point of the building in case of emergency-situation for
> firefighting and/or rescue operations **at least from one side** like-road or permanent
> open space etc.

Searching the whole gazette for the figure finds one 12 m road minimum, and it is a
condition on **podium parking** (Para 3.3.4.9: minimum plot 1500 m², minimum road 12 m) — not
on height, and not about fire. The width the byelaws actually do state for firefighting is
6.0 m, kept motorable and clear all round (Para 3.3.4.7).

A fabricated non-negotiable block is worse than a missing rule: it tells someone their
project cannot be sanctioned when the byelaws do not say so, and `nonNegotiable` means the
app offers them no way out.
*Fixed: demoted to `attention`, restated against Clause 10.2.1 and the 6 m motorable
surround, and cited to both. The open question of whether a minimum exists elsewhere —
in the UP Fire and Emergency Services Rules 2024, which are not in this repository — is
V-033.*

### B-030 — Three clause references pointing at the wrong chapters
Reading Chapter 10 turned up three attributions that were not merely imprecise but pointed
somewhere else entirely. None changes a number; all three would send a reviewer to the
wrong page.

| Where | Cited | Actually |
|---|---|---|
| `findings.ts` fire finding | Chapter 8 (Fire Safety) | Clause 10.1.3 |
| `findings.ts` parking finding | Chapter 10 (Parking) | Para 3.3.4.3 |
| `registry.ts` `parking.ecs-ratios` | Chapter 10 (Table 10.1) | Para 3.3.4.3 |

Chapter 10 contains **no tables at all** — the extractor reports zero for all three pages —
so "Table 10.1" cannot be a transcription slip from a real table. `byelawsData.ts` carried
the same misreading of 10.1.3 in its chapter summary and in row 7 of the NOC schedule, and
gave the chapter's page range as 113–116 where the gazette prints 113–115.
*Fixed: all corrected, and the parking rule now carries V-032 as a challenge.*


---

### B-031 — The purchasable FAR charge dropped the divisor and flattened the coefficient
Chapter 9 was read, `assessPurchaseFee` was written against Clause 9.2.5 and tested against
the gazette's own worked example — and `findings.ts` went on computing the fee inline:

```
const charge = extra * project.circleRate * 0.4;
```

Two errors, in opposite directions:

**The divisor is missing.** Clause 9.2.5 is `C = Le × Rc × P` where `Le = FP ÷ Base FAR`.
`extra` is FP, the floor area. Multiplying it by the rate charges for floor area where the
clause charges for the *land that floor area would have needed* — over-stating the fee by a
factor of the base FAR. On the gazette's own example that is ₹7,00,00,000 against the
₹2,80,00,000 the gazette prints, **2.5× too much**.

**The coefficient is not 0.40 for everyone.** P runs from 0.20 (community facilities) to
1.0 (commercial premium). A flat 0.40 under-charges commercial purchasable by a fifth and
commercial *premium* purchasable by 60%, and over-charges community facilities by double.

Nor was the tranche split at all: everything above base FAR was priced as ordinary
purchasable FAR, when Clause 9.2.5 prices the premium tranche at up to 2.5× that rate.

| Case | Engine had | Gazette |
|---|---|---|
| Group housing 2000 m², 30 m road, new layout, 16000 m² proposed | ₹15,40,00,000 | **₹9,52,00,000** |
| Commercial complex 1000 m², 30 m road, 4000 m² proposed | ₹3,50,00,000 | **₹4,08,33,333** |

Both directions in two adjacent cases, which is why "it errs safe" was never available as a
defence here. This is the fee a user budgets against.

*Fixed: `findings.ts` calls `assessPurchaseFee`. `splitPurchasedFar` divides the headroom
into the two tranches using Clause 9.2.3 columns (3) and (4) — 20% / 50% / 100% / 100% of
base FAR by road band — cheaper tranche first, which is the order the gazette's example
avails them in. `findings.test.ts` now asserts the app reproduces that example to the rupee
end to end, not just in the unit test.*

---

### B-032 — A non-compoundable bar that cited an unread chapter, and so never fired
`NonCompoundableFlags.earthquakeMeasuresMandatory` has carried the comment *"ch. 11.8"*
since the compounding engine was written. Chapter 11 had not been read, so nothing could
set it, and the fee was quoted on the assumption that seismic requirements never bind.

Clause 11.8.1(i) states the trigger outright:

> Earthquake-proof construction requirements will be applicable to buildings with **more
> than 3 floors including ground floor or more than 12 meters in height** and all
> infrastructure facilities with **land cover of more than 500 square meters**.

The height limb is computable from a field the project model already has, and it catches
the commonest building in the state: stilt plus three floors stands at 15 m, and Para
3.3.4.8 makes stilt parking mandatory for multi-units. The engine said nothing about
seismic design on any of them.

**The rule is confirmed by a second printing.** Chapter 3 states it again — *"Buildings
more than 3 floors including the ground floor or more than 12 meters high and buildings
related to important infrastructure facilities with more than 500 square meters of ground
cover"* — and the two agree on all three figures. Two independent printings agreeing is the
strongest confirmation this document offers and it has happened only twice in eleven
chapters. The sole difference is *land cover* against *ground cover*, which is V-036's
ambiguity and not a difference in the threshold.

*Fixed: `src/domain/structural.ts`, and a seismic finding that names the Appendix-8, -9 and
-10 certificates the permit application must carry, the Clause 11.3 peer review above 50 m,
and the Clause 11.5 audit cycle.*

---

### B-033 — The last of the three bars that cited an unread chapter
`NonCompoundableFlags.accessibilityMandatory` carried the comment *"ch. 12"* and, like bar
(vi) before it, nothing could set it because Chapter 12 had not been read. Clause 12.2(a)
settles it in one sentence:

> These regulations are applicable to all buildings and facilities used by the public such
> as educational, institutional, assembly, commercial, business, mercantile buildings,
> multi-units and group housing. **It shall not apply to single unit residential dwellings.**

**What is not in that sentence is the point.** The fire certificate turns on height and
area; seismic design turns on height, floors and ground cover. Accessibility sets **no
height, no floor count and no area threshold at all** — it turns on use alone. So it is the
only one of the three that is fully computable from what the project model already holds,
and the only one that reaches a **single-storey shop**, which neither of the others touches.

Thirteen of the sixteen occupancies are caught. Only a single dwelling is excluded, and
that exclusion is the gazette's own words rather than an inference.

*Fixed: `src/domain/accessibility.ts`, twenty-one dimensional requirements as a checklist,
and a finding that states the Clause 16.1.3(xii) consequence.*

### B-034 — Reading the exclusion off the NBC group would have excused every hotel
Caught before it shipped, by printing the verdict for all sixteen occupancies rather than
trusting the mapping.

Chapter 12's six named categories are NBC groups B to F exactly, so keying the rule on
`nbcGroup` looked clean. It is wrong in one place. **NBC 2016 puts hotels in group A-4** —
residential — and the engine duly returned *"single unit residential dwelling, excluded"*
for `com_hotel`.

A hotel is not a single unit residential dwelling. It is close to the paradigm case of a
building used by the public, and Clause 12.2(c) names *"waiting areas, coffee shops, display
areas, service areas, ticket counters, refreshment stands"* — a hotel lobby, itemised.

The exclusion is narrow and literal and has to be read that way: it reaches a dwelling, not
everything the Code files under group A. `assessAccessibility` now takes the byelaws' own use
category alongside the NBC group, and the two disagree in exactly one place.

*The general lesson is the cheap one: an occupancy mapping that looks clean in the aggregate
should still be printed row by row before it is believed.*

### B-035 — The wrong solar system, required on the other one's trigger
Chapter 13 states two solar obligations, one clause apart, and the engine had them fused
into a single rule keyed on plot area.

| | Clause | Trigger | System |
|---|---|---|---|
| Gazette | 13.2.3.1 | plot **500 m² and above**, any use | **Photovoltaic** power generation |
| Gazette | 13.2.3.2 | six **named building categories** with a hot water installation, no size threshold | **Solar water heating** |
| Engine | "Chapter 13.2" | plot **above** 500 m² | Solar water heating |

So the engine took the photovoltaic clause's threshold and required a solar thermal
collector against it. Three consequences, in increasing order of seriousness:

- **A 600 m² house** was told to install solar water heating. The gazette asks it for
  photovoltaics, and asks it for water heating not at all — a dwelling is in none of the six
  categories at any plot size. The applicant who complies as instructed is still in breach.
- **A 400 m² hotel** was told nothing. Clause 13.2.3.2 binds it whatever its plot, and
  hotels are the first category the clause names.
- **A plot of exactly 500 m²** fell through both readings: `> 500` against "500 sqm and
  above".

There was also a figure in the finding's own text — *"rooftop solar thermal sized for at
least 100 litres/day per 100 m² of built-up area"* — that is **in no clause of the gazette**.
The only capacity Chapter 13 states is the Category-B condition: *"solar water heater of
minimum capacity 10 litres/4 persons (2.5 litres per capita)"*, and that is a per-capita
figure, not a per-area one. Same shape as B-029: a number with no source, presented in the
same typeface as the ones that have one.

*Fixed: `hasSolarPv` is now a separate field from `hasSolarHeating`, because they are
separate systems answering separate clauses. A test asserts that no finding anywhere in the
engine ever says "100 litres" again.*

### B-036 — A mandatory provision excused at exactly the threshold
Clause 13.1.2 requires roof-top rainwater harvesting *"in plots of all uses of **300 square
meters and more** area (including group housing)"*. The engine applied `plotArea > 300`, so
a plot standing at 300.0 m² was told the requirement did not reach it.

Narrow, but it is the second time this exact error has been found — the fire certificate's
15 m limb is the strict inequality the gazette writes and the completion clause's is not
(V-037) — and here the gazette's words are unambiguous.

Two conditions the engine also dropped, both of which change the answer:

- **The collective recharge network.** Clause 13.1.2(f) lifts the requirement in the
  100–300 m² band *only* where the rainwater from a group of buildings flows into the
  scheme's network, and says that above 300 m² *"it shall be mandatory for the building
  owner to install rainwater harvesting system himself"*. The engine stated the rule
  unconditionally in both directions.
- **Waterlogged areas.** The clause excepts them, and then says what happens instead:
  *"Ground water recharging system should not be adopted in areas with water logging
  problem, but arrangements can be made to collect rainwater received from the roofs of
  buildings."* The exception is from recharge, not from the obligation. An app that reports
  it as a blanket exemption would authorise nothing at all on a waterlogged site.

*Fixed: the comparison is inclusive, and both conditions are surfaced — the waterlogged
question as an unknown the project model does not hold rather than as a default.*

### B-037 — The one thing in Chapter 13 that stops a permission being issued was not modelled
Seven of the chapter's nine sections end in a table headed *"Environmental Conditions
required for buildings"*, keyed on **built-up area** in four categories from 5,000 m² up.
None of them was in the engine, and one of them is not a design condition at all:

> **Clause 13.8, Category-B and above:** "No development permission shall be given to the
> Building and Construction projects, until getting Environment Clearance from SEIAA (State
> Level Environment Impact Assessment Authority) as required under the Environmental Impact
> Assessment notification-2006 and amended from time to time."

Every project above **20,000 m² of built-up area** needs a clearance from a different
authority before the Development Authority may grant permission at all, and the app was
telling such projects they could proceed. It is also the one obligation in this chapter that
no fee and no redesign substitutes for, which is why it is filed under *Getting it
sanctioned* rather than under services.

The categories carry sixteen other conditions the prose never mentions, several of them
computable: **one recharge bore per 5,000 m² of built-up area**; unpaved area at 20% of the
recreational open spaces; 1% of connected load from renewables; fly ash as a building
material; the DG-set exhaust at 10 m or 3 m above the building; compensatory plantation at
**1:3**; an organic waste composter at 0.3 kg per tenement per day; and an Environment
Monitoring Committee to keep the whole lot operational above 50,000 m².

*Fixed: `classifyEnvironmental` places the project, `conditionsFor` returns what binds it,
and the clearance is a finding of its own. The phasing rule is stated with it — the
clearance is needed before the **first** phase is approved, not before the phase that
crosses the threshold.*


---

### B-038 — The app never said who is allowed to sign the drawings
Chapter 14 makes it a gate, not advice. Clause 14.1: *"Every building/ development work for
which permission is sought under the Code **shall** be planned, designed, and supervised by
licensed persons."* Nothing in the engine had ever expressed that, in an app whose three
user types include an architect and an LTP.

The competence limits are plain numbers and every one of them is computable:

| Role | May take | Clause |
|---|---|---|
| Supervisor | Residential, plot ≤100 m², ≤2 storeys or ≤7.5 m — **whole permit** | 14.2.4.2(a) |
| Engineer | Structural details, plot ≤500 m², ≤5 storeys or ≤16.0 m | 14.2.2.2(b) |
| Structural engineer | All buildings, without limit | 14.2.3.2 |
| Architect | All building-permit plans except services of a multi-storied or special building; layouts to 2 ha (1 ha metro) | 14.2.1.2 |
| Town planner | Layouts of all areas | 14.2.5.2 |
| Landscape architect | Required at ≥5 ha, ≥2 ha in a metro city | 14.2.6.2 |
| Urban designer | Required above 5 ha, or a campus above 2 ha | 14.2.7.2 |
| Utility service engineers | Required for every multi-storied or special building | 14.2.8 |

**The supervisor row is the one worth surfacing.** It is the only route the byelaws offer
that is cheaper than an architect, it is capped tightly, and nobody who needed it would find
it by reading Chapter 14 — the app now tells a 90 m², 7 m house that one licensed supervisor
can prepare and sign the whole application.

Clause 14.4 adds the only staffing ratio in the byelaws: **one site civil engineer per
2500 m² supervised.**

*Fixed: `src/domain/licensing.ts` and a procedure finding on every assessment.*

### B-039 — Three 19-column tables that the flattened text reduced to two columns
The experience tables at 14.4 are 19 columns wide with horizontally merged cells. The
flattened text places each value in the first column of its span and blanks the rest, so
five of the six seismic-zone columns read as empty — the same failure that lost Clause 15.3
entirely (V-008), rotated ninety degrees.

The spans were recovered from the cell bounding boxes in `chapter-14.json`, by testing which
zone header falls inside which value cell:

```
Zone-1 x[239–279] ┐
Zone-2 x[290–317] ├─ inside value cell x[233.4–359.4]   → first figure
Zone-3 x[328–354] ┘
Zone-4 x[365–402] ┐
Zone-5 x[413–476] ┘─ inside value cell x[359.4–481.5]   → second figure
Zone-6 x[487–517]  ─ inside cell x[481.5–522.4], which is EMPTY
```

So each banded row carries **two** figures and not one, and Zone-6's blank is a real,
distinct cell rather than an artifact of the merge. The bottom row of each table is a single
cell spanning all six zones, which is why it carries no zone split.

Read from the flattened text alone, a structural engineer in a Zone-4 district would have
been given the Zone-1 requirement — 3 years where the table asks for 5, and 7 where it asks
for 9. *This is the third time the geometry has held a rule the text lost, and the second
time this week.*

---

### B-040 — Ninety-one wrong clause numbers in the chapter every fee comes from
Chapter 16 was read in full before the per-chapter PDFs existed, from the flattened docx —
which **drops clause numbering entirely**, carrying the sentence but not the "16.3.2" above
it. Every clause number in the compounding engine was therefore written from context rather
than read. `docs/RULE-GRAPH-PLAN.md` flagged this and asked for the PDF specifically. It was
right to.

The gazette's actual structure, from the paginated chapter:

| Engine cited | Content | Gazette | |
|---|---|---|---|
| **16.1.3** ×38 | the thirteen non-compoundable bars | **16.3.2** | no 16.1.3 exists |
| **16.2** ×38 | the compoundable-limits table | **16.3.3** | 16.2 exists — it is "Compounding of Offences" |
| **16.3.6.1** ×8 | cost of land | **16.3.7(c)** | 16.3.6 is "Demolition" |
| 16.3.6.2 | highest category use | 16.3.7(d) | |
| 16.3.7.1 | additional parking | 16.3.7(f) | 16.3.7 is lettered (a)–(h), not numbered |
| 16.3.7.2 ×2 | purchasable FAR charges | 16.3.7(e) | |
| 16.3.7.3 | basement of another use | 16.3.7(g) | |
| 16.3.7.4 | projections | 16.3.7(h) | |
| 16.3.4.2 | instalments at MCLR+1% | 16.3.5(ii) | |
| **16.3.8** ×48 | the Schedule (Rule No 4) | **16.3.8** | correct all along |

**Ninety-one references corrected.** The 16.2 case is the worst of them: it is not a number
that fails to resolve, it is a number that resolves to a *different real clause*, so a
reviewer looking it up finds a clause about who may compound an offence where they expected
a table of limits.

**The app was already contradicting itself in public.** `src/data/byelawsData.ts`, which
drives the byelaws navigator, has carried 16.3.2, 16.3.3 and 16.3.8 since it was written. A
user could read "16.3.2 — 13 Absolute Non-Compoundable Offences" on one screen and "Clause
16.1.3(vi)" on a finding about the same rule on another.

*Fixed across `compounding.ts`, `findings.ts`, `registry.ts` and the domain tests, with five
new citations anchored to the paginated chapter and a test that fails on any Chapter 16
clause number the chapter does not contain.*

### B-041 — Schedule Note (vi) was missing, and it is the one that connects two chapters
The last note on the last page of Chapter 16:

> Purchasable and Premium Purchasable FAR shall be applicable in **already constructed
> buildings submitted for compounding**. Such provision shall be availed only after ensuring
> the requisite statutory approvals, structural stability, fire and life safety
> requirements, parking and other provisions of building byelaws.

This is the provision that lets a compounding applicant reach Chapter 9 at all, and the
engine did not have it. Read with Note (v) — the authority shall not compound beyond the
maximum permissible FAR and shall ensure demolition of the excess *before* considering
purchasable FAR — the sequence is: **demolish above MFAR, buy up to MFAR, compound the
rest**, with Clause 16.3.7(e) then charging a compounding fee on top and waiving the
purchase charge on the first 10%.

It sits after the schedule tables on the final page, and the flattened text ran it together
with the preceding note.

*Fixed: `NOTE6_PURCHASABLE_FAR_CONDITIONS` holds the five conditions.*

---

### B-042 — The EV share of parking was read as the charger count
The parking finding computed `evBays = ceil(requiredEcs × 0.2)` and told the user that many
bays "must have EV charging points". Chapter 17 states two different quantities and the
engine had collapsed them into one.

**Clause 17.1** sets the *vehicle* share: charging infrastructure is provided "only for EVs,
which is currently assumed to be **20% of all 'vehicle holding capacity'/'parking capacity'**
at the premise". That is a count of cars, not of chargers.

**Clause 17.1.2.1** then says how many chargers serve them:

| Vehicle | Slow | Fast |
|---|---|---|
| 4Ws / cars | 1 per **3** EVs | 1 per **10** EVs |
| 3Ws | 1 per 2 EVs | — |
| 2Ws | 1 per 2 EVs | — |
| PV (buses) | — | 1 per 10 EVs |

So a 30-bay office has 6 EVs, and those 6 are served by **2 slow chargers and 1 fast** — not
by 6 charging points. The engine over-stated the slow-charger requirement roughly threefold
and **had no concept of a fast charger at all**, on a chapter whose whole point is that fast
charging is the expensive part.

**The bigger omission is the load.** Clause 17.1 requires the premises to carry "an
additional power load, equivalent to the power required for all charging points to be
operated simultaneously, with a safety factor of **1.25**". Nothing computed it. On a 200-bay
mall that is 14 slow and 4 fast chargers — **425 kW of additional sanctioned load** at the
minimum ratings Clause 17.8 admits. A DISCOM sanction of that size is a long-lead item, and
an applicant who first learns of it at submission has lost months.

*Fixed: `src/domain/ev-charging.ts`, with the five charger models of Clause 17.8, the three
space norms, and the load stated explicitly as a floor rather than a specification.*

---

### B-043 — A clearance that gates the occupancy certificate, and the engine had never heard of it
Chapter 18 introduces the **IBS NOC from the state TERM cell** — the Telecom Enforcement
Resource and Monitoring cell — and the engine modelled nothing of it.

Clause 18.3 makes it an occupancy gate in terms as plain as the fire certificate's:

> Occupancy-cum-Completion certificate to a building to be granted **only after** ensuring
> that the CTI as per the prescribed standards is in place, and an undertaking by the
> Architect or Engineer to be insisted to certify that building has ensured common access to
> all digital infrastructure to all Service providers.

**And the duty to apply is the applicant's, not the Authority's.** Clause 18.5.1.1(b) says
the Local Authority liaises with the TERM cell — and then: *"Separate communication from the
applicant shall be needed to secure the IBS NOC."* An applicant who reads the first half and
assumes the liaison is the application has not applied, and finds out when the building is
finished and cannot be occupied.

The clearance is needed **twice**: on the plan submitted for approval, with a Service Plan
certified by a telecom networking hardware consultant and an undertaking that the
infrastructure will be shared; and again at the joint site inspection of the completed
building.

What the chapter states in its own right, rather than deferring to NBC 2016 Part 8 Section 6:

| | |
|---|---|
| Telecom room, coverage ≤465 m² | 3.0 m × 2.4 m |
| 465–930 m² | 3.0 m × 3.4 m |
| Above 930 m² | An additional room to the same norms |
| Small building, coverage ≤93 m² | Wall or self-contained cabinets |
| 93–465 m² | Shallow room 0.6 × 2.6 m, or walk-in 1.3 × 1.3 m |
| Per service provider, beside the entrance facility | 1.2 m × 1.83 m |
| Conduit to the distribution frame | 100 mm, encased |
| MDF room proportion | between 1:1 and 2:1 |

Two things are worth telling an applicant outright, because both cut the other way from what
they would assume: Clause 18.5.5 charges **no fee** for the IBS or FTTx network, and Clause
18.5.3 **exempts the equipment** from any ULB or Development Authority permission. The
obligation is on the building plan, not on the hardware.

*Fixed: `src/domain/telecom.ts` and a procedure finding on every assessment.*

### B-044 — The height ceiling reported the laxer of the two clauses that give one
Found by the rule-graph declaration, before the conflict query ran a line. Declaring
`produces: ['maxHeight']` on two rules made it a question worth asking which one the app
actually reported — and it reported only one.

V-010 records that Clause 3.2.4.1 keys the plotted-residential ceiling on **plot size** and
Clause 4.1.4 on **unit count**, that nothing subordinates either, and that the engine
therefore applies `Math.min` of the two. It does — in `setbacks.ts`, which computes
`maxHeight = Math.min(definition.maxHeightM, plotted.maxHeight)` and returns it on
`RequiredSetbacks`. **`findings.ts` never read it.** The height finding took
`occupancy.maxHeightM` alone, which is Clause 4.1.4's limb.

That is the laxer figure on every plot under 300 m²:

| | Clause 3.2.4.1 | Clause 4.1.4 | Reported | Should be |
|---|---|---|---|---|
| Multi-unit, 200 m² plot | **15 m** | 17.5 m | 17.5 m | 15 m |
| Single unit, 400 m² plot | 17.5 m | **15 m** | 15 m | 15 m |

A multi-unit on a 200 m² plot — permissible, the minimum being 150 m² — was cleared at
17.5 m against a ceiling Clause 3.2.4.1 puts at 15. The mirror case was already right, by
coincidence: Clause 4.1.4 happens to be the stricter limb there.

No test covered it. The suite had cases for both clauses separately and none for a project
where they disagree, which is the case the whole of V-010 is about.

*Fixed: `plottedHeightCeiling` exported from `src/domain/setbacks.ts`; the height finding
now takes the stricter and names both clauses when they differ.*

### B-045 — Ten of twenty-nine registered rules never reached a finding
The register exists so that a figure carries its source. `sourced(finding, ruleId)` attaches
it — and the rule id was hard-coded per **code branch** rather than taken from the rule that
actually produced the number. Six tables can answer "what setback?" and four can answer "how
much floor area?"; every answer was stamped with the first of each.

Counting mechanically against `registry.ts`, **ten rules were never named by any finding**,
and two of those stampings actively misreported:

- A warehouse's FAR verdict cited `far.telescopic-residential` — confidence `gazette`, no
  dispute — when the figure came from `far.road-width-commercial`, whose confidence is
  **`inferred`** and which carries V-003's challenge that ten occupancies read a table
  written for shops. **V-003 was invisible at runtime on every occupancy it applies to**,
  which is the opposite of what the V-003 entry claims.
- A 25 m building assessed on the progressive high-rise ladder at Clause 3.2.4.9 cited
  `setback.plotted-residential`, Table 3.2.1.

The `clause` string on these findings was right throughout — it comes from the resolver.
Only the machine-readable provenance was wrong, which is why reading the UI would never
have shown it.

*Fixed: `BaseFarResult.rule` and `RequiredSetbacks.rule` carry the register entry that
produced the figures, and `findings.ts` sources from them. Four rules remain unattributed —
`ev.charging-infrastructure`, `far.green-incentive`, `far.purchasable-commercial` and
`far.tod` — because their numbers are folded into another rule's finding rather than
carried by one of their own. A test pins that list so a rule joining it is deliberate.*

### B-046 — The lower ceiling governs, except in the six bands nobody had enumerated
**Found by the conflict query**, and the first thing it found that no one had.

`CROSS_CHAPTER_MAX_FAR_CONFLICTS` lists six bands where Chapter 3 and a per-chapter table
disagree on Max FAR, and states the policy plainly: *"the engine keeps the LOWER ceiling,
so no project is told it may build more than the most restrictive reading allows."* All six
are bands where Chapter 3 is the lower one.

Nobody had looked for the bands where Chapter 3 is the **higher** one. There are six, and
in every one the engine kept Chapter 3 — against its own stated policy, and against
standing rule 4:

| Use | Area type | Band | Chapter 3 | Printed chapter row | |
|---|---|---|---|---|---|
| Bazaar street | built-up | ≤12 m | 2.1 | **1.5** (5.1.4) | −0.6 |
| Commercial units >100 m² | built-up | ≤12 m | 2.1 | **1.5** (5.2.5) | −0.6 |
| Shopping malls | built-up | ≤12 m | 2.1 | **2.0** (5.2.5) | −0.1 |
| Hotels | built-up | ≤12 m | 2.1 | **2.0** (5.3.5) | −0.1 |
| Bazaar street | new layout | ≤12 m | 2.45 | **1.75** (5.1.4) | −0.7 |
| Commercial units >100 m² | new layout | ≤12 m | 2.45 | **1.75** (5.2.5) | −0.7 |

Every one sits in the ≤12 m band, which is why it survived: below 12 m Clause 9.2.1(ii)
bars the purchase and the ceiling collapses to base FAR, so nothing reaches the user.
**At exactly 12 m the gate opens and the ceiling does not collapse** — a 400 m² bazaar plot
on a 12 m road was offered 0.6 FAR of purchasable headroom, 240 m² of floor area, that the
stricter reading does not allow.

The per-chapter row is also the *more specific* provision — Clause 5.1.4 is written for
bazaar streets and Clause 5.2.5 draws a distinction at 100 m² that Chapter 3 does not —
so lex specialis and standing rule 4 point the same way here.

V-016 had looked at the >100 m² split and set it aside: *"the >100 m² row is a distinction
Chapter 3 simply does not draw."* True in the >24–45 m band it was checking, where the two
agree. In the ≤12 m band they differ by 0.6.

*Fixed: `resolveBaseFar` clamps the Chapter 3 ceiling to the printed chapter row wherever
one exists and is lower, and emits a caveat naming both. The road-width bar caveat is
computed against the unclamped headroom so it still fires — the bar is a fact about the
road, not about which ceiling won.*

---

### B-047 — The sanction route, answered from three branches nobody had checked
The first practical question an applicant asks — *which route does this go through* — was
answered by three inline branches in `findings.ts`. Reading Clause 2.1.2 against them found
four separate errors, one of them material.

**A multi-unit building was offered a route the clause expressly denies it.** The branch read
`plotArea <= 500 && group === 'Residential' && id !== 'res_group_housing'`, which admits
`res_multi`. Clause 2.1.2(iii) gives instant approval to residential plots up to 500 m²
**"(except multi-unit)"**. A multi-unit on a 400 m² plot was told it had instant online
approval on an LTP certificate when Clause 2.1.2(iv) sends it to full scrutiny — and an
approval taken on the wrong route is revocable within thirty days under 2.1.2(v), with the
owner, applicant **and** licensed technical person each personally liable.

**Both commercial limbs were missing entirely.** Clause 2.1.2 states every limit twice, once
for each purpose:

| | Residential | Commercial |
|---|---|---|
| No permission at all — 2.1.2(ii) | ≤100 m² | **≤30 m²** |
| Instant approval — 2.1.2(iii) | ≤500 m², except multi-unit | **≤200 m²** |

The engine had only the residential column. A 25 m² shop was told it needed full scrutiny;
so was a 150 m² shop in an approved layout.

**A 15-day deemed sanction that is not in the clause.** The instant-approval branch promised
"a 15-day deemed-sanction limit". Clause 2.1.2(iii) gives *instant* approval and states no
such period. What 2.1.2(v) does state, and the engine did not, is a **30-day revocation
window**.

**And a clause citation that points at the wrong subject.** The full-scrutiny branch cited
*"Chapter 2.3 (Deemed NOC)"*. **Clause 2.3 is "All Plans"** — key plans, site plans, building
plans — and says nothing about NOCs. The deemed NOC is Clause **2.2.3(v)**, which also
carries the 7-day objection window that confirms it. The same species as B-040, found the
same way.

**All three findings also carried the wrong provenance.** They were sourced to
`occupancy.thresholds` — a rule about minimum road widths and plot sizes, of `inferred`
confidence, carrying V-005's challenge. So the app presented the sanction route as an
unverified inference disputed on grounds that have nothing to do with it. There was no
Chapter 2 rule in the register at all; there is now.

*Fixed: `src/domain/permission.ts`, a `permission.route` register entry with four citations,
and the route reported with its conditions attached rather than asserted.*

---

### B-048 — 847 verdicts, loaded and unread, behind a mapping that matched nothing
Clause 15.3 answers the app's **first** question — may this use go on this plot at all — with
53 activities against 16 land-use zones. It was extracted from the chapter PDF by cell fill
in the chapter-15 pass, because the flattened text carries none of it (V-008), and 847
verdicts have sat in `docs/source/derived/zoning-matrix.json` ever since. Nothing in
`src/domain` read one of them.

Two separate faults kept it unreachable, and the first is the instructive one.

**The mapping matched nothing.** `OccupancyDefinition.activityId` held `act-single-unit`,
`act-retail-shops`, `act-cottage-industry` — values from a scheme that was retired before the
matrix existed. The matrix is keyed on the gazette's own activity numbers: `1.1(a)`, `2.1`,
`3.5`. **Not one of the sixteen occupancies resolved to a row.** The field's own comment
pointed at a `CHAPTER_15_ACTIVITY_PERMISSIBILITY` that does not exist anywhere in the
codebase.

**And there was nowhere to look it up from.** `ProjectState` carried no land-use zone, so
even a correct mapping had no column to read. The app's first question had never had an
input.

This is the third instance of the pattern that produced B-031 and B-046 — data extracted,
validated, cited, and then never read — and it is the most consequential of the three,
because the others changed a number and this one changed nothing at all: **the land-use
question was simply not being asked.** A project prohibited in its zone was told its road was
wide enough and sent on to design.

*Fixed: `src/domain/zoning.ts` resolves the row through `activityFor()` rather than a stored
id, because five occupancies read a different row depending on area type or plot size and one
id cannot express that. `masterPlanZone` added to `ProjectState`, defaulting to `'unknown'` —
which produces a finding saying the question is unanswered rather than a verdict from a guess.
`tools/extract-zoning-matrix.py` now writes `src/domain/data/zoning-matrix.json` as well, so
the engine reads a generated file with no transcription step, the same arrangement
`purchasable-far.json` uses.*

Fifteen of the sixteen occupancies now resolve. The sixteenth is `mixed_use`, correctly:
mixed use is a **zone** in this table, column MU, and Clause 15.3 prints no activity row for
it.

---

### B-049 — The zone code the engine asks for is one no master plan prints
`masterPlanZone` was added with the zoning matrix (B-048) and asked the user to choose from
BU, R, MU, C-1 … — sixteen codes that appear in Clause 15.3 and **nowhere on any applicant's
master plan**. Gorakhpur's plan says "C3- Wholesale / Storage/godown/Warehousing".
Muzaffarnagar's says "Ganna Shodh Kendra". Bareilly splits commerce across C1, C2 and C3 and
none of those is the byelaws' C-1.

Appendix-15 is the table that closes the gap — *"Use zones across different master plans"*,
22 Development Authorities against the same 16 rows, in the same order Clause 15.3 prints its
columns. **314 local zone names.** The app can now ask the question in the form the user can
answer — which of these names is on your plan — and derive the code, or run it the other way
and show the local words for the code it used.

*Fixed: `tools/extract-master-plan-zones.py`, `src/domain/master-plan-zones.ts`, and two
findings — the local name for a resolved zone, and the authority's own vocabulary offered
when no zone is set yet.*

**One extraction subtlety, recorded because the wrong choice would have been invisible.** A
cell whose text wraps is emitted as its first line only, with the rest arriving as later rows.
Folding those back is straightforward; deciding whether two lines are one name or two is not.
Agra lists **four** distinct commercial zones under C-1 — joining them would have destroyed a
real distinction. Only four cells in the whole appendix actually wrap, and each announces
itself: the continuation starts with a slash, or the line before ends with one, or it is a
bare lowercase word. `unwrap()` joins on exactly those and leaves everything else alone.

### B-050 — A setback table the gazette prints and the engine never held: Clause 3.2.4.4
Chapter 3 prints **eight** setback tables below the high-rise threshold, numbered 3.2.4.1 to
3.2.4.8. The engine carried **six**. Clause 3.2.4.4, *"Other Commercial"*, is the first of the
two it did not, and it is the only setback table in the byelaws **keyed on what the building
is** rather than on how big its plot is:

| Row | Front | Rear | Side-1 | Side-2 |
|---|---|---|---|---|
| Hotels / Single screen cinema / Miniplex | 5 | 3 | 3 | 3 |
| Multiplex / Shopping Malls | **9** | **6** | **6** | **6** |
| Petrol filling station w/o service station | 3 | – | – | – |
| Petrol filling station with service station | 6 | – | – | – |
| LPG Gas Godown | 6 | 3 | 3 | 3 |

Malls and hotels were reading the plot-area ladder at Clause 3.2.4.3 instead. That is not a
rounding error. **A mall on a 400 m² plot was given 4.5 / 3 / 1.5 / 1.5 where this table
requires 9 / 6 / 6 / 6** — less than half the front setback and a quarter of the sides, on
the building type most likely to have a crowd inside it. On a 2,000 m² plot it was 6 / 3 / 3
/ 3 against the same 9 / 6 / 6 / 6. The error runs the other way for a large hotel, which
this table seats 5 m back where the plot-area ladder demanded 12.

The table's key column is headed *"Building Height (m)"* and contains building types — a
header carried over from the group housing table printed above it. Nothing in the table is
keyed on height at all.

*Fixed: `OTHER_COMMERCIAL_SETBACKS` in `src/domain/setbacks.ts`, a new `other_commercial`
routing for `com_mall` and `com_hotel`, and `setback.other-commercial` in the register with a
cell-anchored citation. The three rows no occupancy maps onto are kept as
`OTHER_COMMERCIAL_UNMAPPED` rather than dropped.*

### B-051 — And the second: Clause 3.2.4.7, Public Amenity
Marriage halls, banquet halls, multipurpose halls, auditoria and convention centres have
their own table, and **its front setback is 12 m at every plot size** — the largest in
Chapter 3 outside the high-rise ladder, and the one most likely to decide whether the
building fits on the plot at all. `inst_assembly` was reading Clause 3.2.4.3 and being given
**6 m on a 2,000 m² plot**, half of what the gazette requires.

*Fixed: `PUBLIC_AMENITY_LADDER`, a `public_amenity` routing for `inst_assembly`, and
`setback.public-amenity` in the register. The open questions the table leaves are V-060.*

### B-052 — Clause 3.2.4.9 excludes plotted houses in its opening line, and nothing read it
> *"For use occupancies with building height more than 15m **(other than single/multi
> units)**, the minimum setback requirement shall be as follows."*

The parenthesis is the clause's first sentence. It was in no guard, no branch and no comment,
and the engine applied the progressive fire-tender ladder to every use above 15 m including
plotted residential. Clause 3.2.4.1 lets a plot above 300 m² build *"four storeys with stilts
up to 17.5-meter height"*, so the band between 15 and 17.5 m is not hypothetical — it is the
ordinary large plotted house.

**The engine was wrong in both directions at once inside that band.**

| Plot | Table 3.2.1 (governs) | What the engine applied |
|---|---|---|
| >300–500 m² | 3 / 3 / 0 / 0 | 5 / 5 / 5 / 5 — **5 m of side setback on a 400 m² plot** |
| >500–1200 m² | 4.5 / 4.5 / 1.5 / 0 | 5 / 5 / 5 / 5 |
| >1200 m² | **6** / 6 / 1.5 / 1.5 | 5 / 5 / 5 / 5 — **a metre less at the front** |

Over-restrictive to the point of unbuildability on a 400 m² plot, and under-restrictive at
the front above 1,200 m². Above 17.5 m the progressive ladder is applied again, because
nothing else in the byelaws speaks to a plotted house at that height and the height itself is
reported against the ceiling separately.

*Fixed: `resolveRequiredSetbacks` in `src/domain/setbacks.ts`, the guards on
`setback.plotted-residential` (now to 17.5 m) and `setback.high-rise` (now carrying the
clause's own occupancy exclusion), and a prose citation anchored on the sentence.*

### B-053 — The bazaar street front, under-applied above 15 m
Clause 5.1.3 says in terms that there is **no height restriction on a bazaar street**, and
Clause 5.1.5's front-setback ladder carries no height limb. So above 15 m both that ladder
and Clause 3.2.4.9 speak, and neither yields — the Note-3 subordination that settles the
question below 15 m (V-062) is printed under a table captioned *"up to 15-meter height"* and
cannot reach up.

The engine took Clause 3.2.4.9's front unconditionally, and that is the **smaller** of the two
across a definite region of the two ladders — not everywhere, which is why it is worth stating
exactly:

| Bazaar street road | Clause 5.1.5 front | Larger than the height ladder for buildings of |
|---|---|---|
| >18 to 30 m | 6.0 | 15 – 17.5 m |
| >30 to 45 m | 7.5 | 15 – 27 m |
| >45 m | 9.0 | 15 – 33 m |

A building in the 17.5–21 m band on a 36 m bazaar street was given 6 m where Clause 5.1.5
requires 7.5. Above those bands the progressive ladder is the larger and already governed.
Standing rule 4 says the greater of the two applies either way.

*Fixed: the high-rise branch of `resolveRequiredSetbacks` now takes the greater of the two
fronts, keeps Clause 3.2.4.9 for the other three faces, and names whichever clause governed.*

---

## Still open

### V-061 — The conflict query had swept eleven of thirty-eight facts, and nobody could tell
This is a finding about the method rather than about the byelaws, and it is the one that
produced B-050 to B-053.

`docs/RULE-GRAPH-PLAN.md` closed with *"54 conflicts, 45 of them undisposed"*, later *"every
one disposed"*. Read on its own that sounds like a sweep of the document. It was a sweep of
**eleven of the thirty-eight facts the engine establishes** — and of the eleven the
verification log had already pointed at. The query ran over `clauses.ts`, the graph over
`registry.ts`, and **nothing checked either file against the other**, so a fact with five
rules answering it and no assertion anywhere looked exactly like a fact with nothing to say.

`src/domain/rules/coverage.ts` joins the two and classifies every fact four ways:
`cumulative` (the producers do not compete), `uncontested` (one producer, or producers whose
guards can never both hold), `swept` (rivals, and assertions to compare) and **`unswept`** —
rivals that can meet, and nothing for the query to compare. Only the last is a gap.

The first run returned:

| | |
|---|---|
| `requiredSetback` | **5 rules, 0 assertions** — the whole of Chapter 3's setback machinery |
| `useAllowed` | 3 rules, and two of them were mis-declared (below) |
| `occupancyCertificateGate` | 3 rules, and they do not compete — now declared `cumulative` |
| `baseFar` | 4 rules whose guards can never both hold — not a gap |

Sweeping `requiredSetback` cost fourteen clause assertions and found **two tables the gazette
prints and the engine had never held, a clause exclusion it had been ignoring in both
directions, and a front setback it was under-applying above 15 m.**

**Two declaration errors, both on `useAllowed`, both in the same place and opposite
directions.** `zoning.master-plan-names` — the Appendix-15 translation table — was declared to
produce `useAllowed`, which made it a rival of the permissibility matrix. It decides nothing
about a use; it says what an applicant's own master plan calls the zone Clause 15.3 codes.
Declaring it as a rival did two kinds of damage at once: it invented a conflict that does not
exist, **and it hid the real dependency** — the matrix cannot be read until the translation
has been made. It now produces `masterPlanZoneName`, which `zoning.permissibility` consumes,
and the graph carries the edge. `occupancy.thresholds` was the same mistake the other way: a
project refused for a too-narrow road is refused for a reason Clause 15.3 knows nothing
about, so the two are cumulative conditions on lawfulness, not two answers to one question.

**What stays open is the other 25.** A fact reported `uncontested` is one where no second rule
exists to disagree — which is a fact about this engine, not about the gazette. Chapter 16's
compounding fees have one rule each and no assertion anywhere, and the reason nothing
contradicts them is that nothing has been written down to try.

### V-062 — The bazaar street front is subordinated below 15 m and contested above it
The cleanest subordination in the document is typographic. Clause 5.1.5's road-width ladder
is **printed as Note-3 to the commercial setback table at Clause 3.2.4.3** — the table that
otherwise governs a bazaar-street shop. A table that prints another table under its own rows,
for a class of plot it covers, has yielded, and it has yielded exactly the front, which is all
Note-3 speaks about. The engine takes the front from Clause 5.1.5 and the other three faces
from Clause 3.2.4.3, which is what the note says on its face. Disposition: `subordinated`.

Above 15 m the note runs out and the same two tables are in genuine conflict, which is B-053.

### V-059 — Three rows of Clause 3.2.4.4 have no occupancy, and one row is shared with a cinema
Both petrol-filling-station rows and the LPG gas godown are uses `OccupancyId` cannot express,
and they are recorded in `OTHER_COMMERCIAL_UNMAPPED` rather than dropped. The sharper problem
is the hotel row: it reads *"Hotels / Single screen cinema / Miniplex"*, and a cinema in this
engine is `inst_assembly`, which reads Clause 3.2.4.7 and its **12 m** front — against this
row's 5 m. One building, two tables, seven metres apart, and the distinguishing fact is
whether the hall has one screen. The engine applies the stricter and names the alternative.

### V-060 — Clause 3.2.4.7 states four rows for two building types, and is silent below 1,000 m²
| Row | 1000–3000 | >3000 |
|---|---|---|
| Marriage / Banquet / Multipurpose Hall | 12 / 4.5 / 4.5 / 3 | 12 / 5 / 5 / 5 |
| Auditorium / Convention Centre | *(from 1500)* 12 / 4.5 / 4.5 / 3 | 12 / **6** / **6** / **6** |

`inst_assembly` covers both, so above 3,000 m² the engine applies the auditorium row and
names the hall's figures on the finding — the shape V-054 already records for the zoning
matrix. Below 1,000 m² — 1,500 for an auditorium — **the table states nothing at all**. That
is the gazette's silence, not the engine's: the smallest stated row is applied and the caveat
says so, rather than a row being invented.


### V-058 — The completion-certificate forms leave a hole, and an ordinary house falls in it
The question "are the appendices needed" was answered by scanning them rather than reading
them. Across **Appendices 2 to 14** the flattened gazette carries **two lines bearing a number
with a unit and three bearing an obligation**, and every one restates a rule the chapters
already state: the 500 m² solar-water-heating threshold is Chapter 13, and the two SDBR
deferral rules are Chapter 11.7. Both were already modelled. **The forms are field templates
and carry no rule of their own.**

What they do carry is a partition, visible in their titles alone:

| Form | Covers |
|---|---|
| Appendix-7 Form-A | residential building **> 300 sqm** |
| Appendix-7 Form-B | group housing, commercial and multi-storey building |
| Appendix-7 Form-C | buildings **other than** residential, group housing, commercial and multi-storey |
| Appendix-4 Form-D | layout plan |

**A residential building on a plot between 100 and 300 m² is excluded from all three.** It
needs a completion certificate — Clause 2.1.2(ii) exempts only up to 100 m², and says so
expressly — and Form A excludes it on size, Form B on type, and Form C on type in terms
(*"other than residential"*).

That is the commonest building in the state. `completionFormFor` reports it as unmatched
rather than filing the nearest form silently, and says to expect the authority to have its own
practice. What would settle it: an authority circular, or a Form-A that reads "residential
building" without the size qualifier.

*The appendices were not needed to find this. It is visible in the index.*

### V-056 — Appendix-15 omits Lucknow, Noida and Ghaziabad
The table covers 22 Development Authorities: Agra, Aligarh, Ayodhya, Bareilly, Basti,
Bulandshahr, Firozabad-Shikohabad, Gorakhpur, Hapur, Jhansi, Kanpur, Khurja,
Mathura-Vrindavan, Meerut, Mirzapur-Vindhyachal, Moradabad, Muzaffarnagar, Prayagraj, Rampur,
Saharanpur, Varanasi-1 and Varanasi-2.

**The state capital is not among them, and neither is Noida or Ghaziabad** — the two largest
authorities in the National Capital Region. `ProjectState.cityName` has defaulted to
`'Lucknow'` since the project model was written, so the commonest case in the app is one the
appendix cannot serve.

There is no reading of the appendix that supplies them. `localZoneNames` returns
`authority-not-listed` and the finding falls back to listing the sixteen codes, which is worse
for the user and honest. What would settle it: the Lucknow, Noida and Ghaziabad master plans'
own use-zone schedules, or a later amendment extending the appendix.

### V-057 — NIL and blank are different in this appendix, and two cells are blank
Most authorities that lack a zone have **NIL** printed against it — 36 cells say so, and that
is a statement: no plot in that authority's area carries that zone. Two cells say nothing at
all. **Hapur's Small Industries and Public & Semi-public rows are simply empty**, while the
rows immediately around them — Commercial-2, Large Industries — carry an explicit NIL for the
same authority.

So the drafter distinguishes the two, and the difference matters: NIL answers the question and
blank does not. `LocalZoneLookup` keeps them apart as `nil` and `blank`, and the engine reports
an empty cell as unknown rather than as an absence.

It is a small thing and it is the kind of small thing that becomes a wrong answer when
flattened. A user in Hapur told "your authority has no Small Industries zone" would conclude
their plot is in a different authority's area; told "the appendix does not say", they go and
look at the plan.

### V-055 — Every conflict the query finds now carries a disposition, and five are families
The conflict query returned 54 conflicts and 45 of them had no recorded disposition. That
number was misleading in both directions, and working through it is what this entry records.

**It was not 45 undecided questions.** Twenty-six of them are one decision — that where
Chapter 3's summary ladder and a per-occupancy printed table give the same band two ceilings,
the lower governs — restated once per band. Writing that out twenty-six times would not have
made it twenty-six decisions; it would have made one decision harder to review and easier to
let drift. So `RESOLUTION_FAMILIES` states a relationship between two clauses once, and each
family names the log entry it rests on:

| Family | Pairs | Disposition | Rests on |
|---|---:|---|---|
| Chapter 3 ladder vs a printed chapter table | 26 | stricter | V-014 |
| Tree rates are cumulative obligations | 6 | stricter | V-044 |
| "Special Building" over four lists | 5 | stricter | V-034 |
| Clause 14.4's experience bands overlap | 4 | stricter | V-046 |
| Engineer and supervisor are both competent | 4 | not-a-conflict | — |
| Completion-stage fire NOC, floor limb | 4 | **unresolved** | V-037 |

**Two of the six were wrong on the first pass and are worth recording as such.**

The first draft had one family covering every `specialBuilding` and `fireClearanceRequired`
pair and dispositioning all of them `stricter`. That is right for the list question and wrong
for the completion-stage NOC: Clause 2.9.3.2's floor limb is not resolved strictly, it is not
resolved **at all**, because no storey count exists to resolve it with. Marking it `stricter`
would have claimed a decision nobody has made. Split into two families, and the floor limb
keeps `unresolved`.

Two genuinely new findings came out of the exercise, neither previously in the log:

**Clause 14.4's bands overlap, and the gazette does not say which governs.** Each band is a
three-way disjunction — *"4 storeys or 12-meter height or 2500 sqm floor area"* — so a
building of 10 m with 3,000 m² of floor area is inside band 1 on height and inside band 2 on
area. `bandFor` takes the first band **all** of whose limits are satisfied, so exceeding any
one limb moves the project up a band. That is the stricter reading and the safer one for a
supervision requirement, but it is a choice the clause does not make for us.

**The engineer and the supervisor are not in conflict at all.** Clause 14.2 states each role's
competence; it nowhere says the lighter qualification displaces the heavier. On a small
residential job both are competent, and two permissions overlapping is not two answers to one
question. Dispositioned `not-a-conflict`, which is the only one of the six that needs no log
entry behind it.

**The guard that made this honest.** A test required that some conflicts carry no disposition
at all, on the ground that a disposition invented to make a number look better is worse than
the gap. That ground is right, and the test was strengthened rather than relaxed: every
conflict is now recorded, and the guard checks that recording one did not quietly decide it —
`unresolved` must remain a live disposition, no single disposition may account for
everything, and each family's pair count is pinned so a new conflict cannot be absorbed into
an existing family unnoticed.

### V-054 — Five occupancies read the stricter of two rows, and 47 cells carry a condition
The Clause 15.3 mapping is deliberately partial in two ways, both surfaced on the finding
rather than hidden in it.

**Five occupancies span more than one printed row, and the row turns on a fact the project
model does not carry:**

| Occupancy | Row applied | Other row | Turns on |
|---|---|---|---|
| `com_hotel` | 2.6 above 20 rooms | 2.5 up to 20 | a room count (V-011) |
| `inst_health` | 5.8 above 50 beds | 5.7 up to 50 | a bed count |
| `inst_education` | 5.3 college | 5.1 primary | the level of institution |
| `inst_assembly` | 5.10 marriage hall | 5.11 auditorium | which kind of hall |
| `office` | 4.2 private office | 4.1 government office | who occupies it |

The stricter row is applied and the alternative is named whenever the two verdicts differ, so
a user whose hotel has twelve rooms is told that a different row would apply and what it says.

**Forty-seven of the 847 cells are green carrying a number** — permitted subject to that
numbered condition from Clause 15.3.3's note list. The engine reports the condition number and
does not hold the conditions themselves: that note list has not been extracted. A conditional
cell is therefore reported as *attention*, not as permission and not as a bar.

Reporting it as attention rather than blocked is deliberate and has a source. Clause 3.3
provides that applications for other activities "shall be considered subject to the provisions
contained in paragraph 15.3", and that "for allowing higher use activities in lower land use
zones, impact fee shall be payable" — so a use outside its zone is a permission decision with
a price, not an absolute bar, and the engine should not present a conditional cell as a refusal.

### V-053 — Both lighter sanction routes turn on facts no drawing shows
Clause 2.1.2 grants its two concessions conditionally, and every condition is a fact about
the plot's history rather than its geometry:

- **2.1.2(ii)**, no permission at all, excludes plots in a **mela area** declared under the
  Uttar Pradesh Melas Act 1938 and plots in **unauthorised layouts or colonies**, and forbids
  splitting a plot above 100 m² to qualify.
- **2.1.2(iii)**, instant approval, applies only **"For Plots in layouts approved or developed
  by the Authority"**.

Assuming these favourably is the **laxer** reading in both cases — it would tell an applicant
they need no permission when they do, which is the one direction this engine must not err in.
So the route is reported with its conditions listed and marked conditional, rather than
asserted. `approvedLayout` and `melaOrUnauthorisedArea` are declared in the fact vocabulary
as unsupplied, which makes them count in the graph's missing-field report alongside
`floorCount` and the rest.

This is the same shape as V-034 and V-037 and brings the tally of obligations blocked on a
field `ProjectState` does not carry to eleven.

### V-054 — The rule graph is built, and 45 of its 54 conflicts have nobody's decision on them
`docs/RULE-GRAPH-PLAN.md` now carries a full outcome section; this is the log's summary of
it.

**The query re-finds ten of the eleven known conflicts**, and the eleventh — V-038 — is
found by the threshold-divergence query written for it, because its eight obligations
produce eight different facts and so never meet in a same-fact comparison. The acceptance
bar was six of eight.

**54 conflicts in total. Nine carry a recorded disposition; 45 do not.** That is the honest
state and not a gap to be closed by inventing one: an undisposed conflict is a place where
the byelaws answer one question two ways and nobody has yet decided which answer governs.
The 26 on `ceilingFar` are mostly V-003 showing through band by band — the value there is
that V-003 is no longer a sentence but an enumeration of where the two readings diverge and
by how much.

**Two schema holes the recall exercise exposed**, both worth more than the hits:

- **The multiplex row of V-016 is not reachable.** `purchasableRowFor` maps no occupancy to
  Clause 5.4.4's cinema table — `inst_assembly` returns nothing — so no node is generated
  for it and no conflict can be found against it. The hole is in the occupancy mapping.
- **Shopping malls are found against the wrong Chapter 3 figure.** V-016 compares Chapter
  3's own mall row (9.0); the query compares rows 3(a)/3(b) (6.0), because that is what the
  engine actually reads for a mall. The pair is right and the left-hand number is not the
  one a reader would pick — V-003 again.

**What the graph now counts that the log was counting by hand.** `unsuppliedDependencies`
reports every obligation resting on a field `ProjectState` does not have: `floorCount` × 4
rules, `groundCoverage` × 2, `dwellingUnits` × 2, and one each for `unitCarpetArea`,
`hotelRooms`, `mixedUseLocation`, `todZone` and `ibsCoveredArea`. V-038's running tally of
"the fifth obligation blocked on the same missing field" is now a function.

### V-052 — Four of the six setback tables had no register entry at all
Found while wiring provenance for B-045. `resolveRequiredSetbacks` can answer from six
tables; the register held two of them — `setback.plotted-residential` (Table 3.2.1) and
`setback.high-rise` (Clause 3.2.4.9). Clause 3.2.4.2's flat 5 m for group housing and the
four plot-area ladders for commercial, healthcare, educational and industrial had no entry
of any kind.

The register's guarantee is that *"anything absent from this register is, by definition,
unreviewed."* The inverse was unguarded: a figure could be applied on every non-residential
project below 15 m and appear nowhere a reviewer would look.

Two entries now cover them, both at **`transcribed`** confidence, which is the honest level:

- `setback.group-housing` — Clause 3.2.4.2. Never checked against any source.
- `setback.non-residential` — the four ladders as one mechanism. `setbacks.ts` records the
  commercial and healthcare ladders as VERIFIED 2026-09-10; the educational and industrial
  ladders have never been checked against anything, and none of the four carries a
  line-anchored citation, so none may claim gazette confidence.

Closing this needs the Chapter 5, 6 and 7 setback tables read against the paginated
chapters and citations generated, the same treatment the FAR tables have had. B-005 is the
warning: the commercial >3000 m² band was missing entirely, halving the required front
setback on the largest commercial plots.

### V-053 — Where two chapters print a ceiling, the lower governs in both directions
Recorded separately from B-046 because the fix takes a position, and the position is
arguable.

The engine now clamps Chapter 3's ceiling to the per-chapter printed row wherever that row
is lower. In the six bands at B-046 this is a reduction of 0.1 to 0.7 FAR; in the six bands
at `CROSS_CHAPTER_MAX_FAR_CONFLICTS` Chapter 3 is already the lower and nothing changes.

**The argument for it** is standing rule 4 — nothing subordinates either chapter, so the
stricter reading governs — reinforced by lex specialis, since Clause 5.1.4 is written for
bazaar streets specifically and Clause 5.2.5 draws a distinction at 100 m² that Chapter 3
does not.

**The argument against it** is that Clause 9.2.3 Note-2 subordinates the Chapter 9 master
table to chapters 3–7 and says nothing about chapter 3 against chapter 5, so the direction
of precedence between them is genuinely unstated. A development authority that reads
Chapter 3 as the governing summary would sanction the higher figure.

What would settle it: an authority's practice on a bazaar-street or commercial-unit plot on
a 12 m road. Until then the engine takes the reading that cannot over-permit.

### V-051 — Two telecom tables captioned one way and keyed another
Clause 18.5.1.2(n) prints two tables. The first is captioned *"Telecom room space norm for
buildings with **Built-up area** >465 sqm"*; the second *"Space requirements for smaller
buildings with **Built-up area** <465 sqm"*. Both then key their rows on *"**Area to be
covered by IBS**"*, and nothing in the chapter says the two quantities are the same.

They need not be. A 2,000 m² office may run its in-building solution over the three floors
that have poor signal and not the basement, in which case the covered area is a fraction of
the built-up area and the table gives a smaller room. Read the other way — coverage equals
the whole building — it gives a larger one, and above 930 m² a second room entirely.

The engine takes the whole built-up area as covered, which is the stricter reading, and says
so. It has nowhere else to go: `ProjectState` has no IBS coverage figure, and one cannot be
derived from anything it holds.

**Everything below the tables defers to NBC 2016 Part 8 Section 6** — entrance facilities,
distribution frames, risers, cabling media, wireless systems, backbone and horizontal
pathways, each cited by its NBC clause number. This repository does not hold the NBC. That is
the same answer as V-033 gave for fire access, and it is the honest one: the byelaws delegate,
and a delegation recorded is worth more than a number invented.

### V-049 — Chapter 17 states the EV share twice as 20% and once as 15%
Clause 17.1 and Clause 17.1.2.1 Note (i) both say **20%**, flatly and operatively. Clause
17.5.1, inside the explanatory annexure, says something else:

> It has been broadly projected that by the current rate of adoption of EVs, about **15%** of
> all vehicles in the country would be EVs by the year **2020**. Therefore … the Metropolitan
> and 'Tier I' cities will be assumed to have a higher percentage share of EVs, say **20%**
> for now.

Read in context this is a projection written about 2020 rather than a requirement, and it
resolves *to* 20% for the cities the byelaws govern — so the engine applies 20% without a
caveat. Recorded because the passage also introduces **"Metropolitan and 'Tier I' cities"**,
a third undefined city classification, alongside Chapter 14's *"metro cities"* (V-047) and
the annexure's *"Mega Cities with population of 4 million plus as per census 2011"*. Three
terms, three clauses, no definitions, and no statement that any two of them mean the same
thing.

### V-050 — Two- and three-wheeler charging cannot be computed at all
Clause 17.1.2.1 gives ratios for two-wheelers and three-wheelers — 1 slow charger per 2 EVs
in each case — and Note (i) plans charging bays at 20% of the capacity of *all* vehicles,
"including 2Ws and PVs(cars)".

The parking standard the engine applies, Para 3.3.4.3, is expressed in **equivalent car
spaces** only. There is no two-wheeler count anywhere in the project model, and ECS cannot be
decomposed into vehicle classes after the fact. So two of the four rows of the table are
unreachable, and on a residential or retail project — where two-wheelers are the majority of
the parking demand in most Indian cities — the unreachable rows are the larger ones.

The load figure has a second, smaller limitation of the same kind: it uses the minimum
ratings Clause 17.8 admits, 10 kW slow and 50 kW fast. A Type-2 AC at 22 kW or a CCS above
50 kW raises it proportionately. The finding says so, and states the figure as a floor.

### V-046 — A seismic zoning with six zones, where the standard the byelaws adopt has four
All three tables at Clause 14.4 are keyed on *"Building location in Earthquake Zone"* —
**Zone-1 through Zone-6**. IS 1893 (Part 1), which Chapter 11.1 adopts by name, defines
**four** zones, numbered **II to V**. Zone I was folded into Zone II in the 2002 revision and
there has never been a Zone VI.

Three things are certain from the geometry (B-039): the values group as 1–3 and 4–5, Zone-6
is blank in every banded row, and the largest band ignores zones altogether.

What the grouping most likely means, and why the engine does not act on it: Uttar Pradesh
spans IS 1893 zones **II, III and IV**, with Zone IV across the west of the state. A table
that splits at "1–3 versus 4–5" maps onto that exactly — lower zones get the lower
experience requirement, Zone IV the higher. On that reading "Zone-4" is IS 1893's Zone IV and
the table is usable.

**Not acted on.** The engine holds the two column groups exactly as printed and does not map
them onto IS 1893, because nothing in the byelaws says how, and because the reading above is
an inference from a state map rather than from the document. It also has nowhere to put the
answer: `ProjectState` has no seismic zone, and one cannot be derived from latitude and
longitude without the IS 1893 zone polygons, which this repository does not hold.

Appendix-14's SDBR form asks the applicant for the seismic zone directly, which suggests the
byelaws expect it to come from the applicant rather than be derived.

What would settle it: the notified UP seismic zone map, or an authority circular reconciling
the Chapter 14 numbering with IS 1893.

### V-047 — "Metro city" decides two thresholds and is defined nowhere
Chapter 14 uses the term three times — Clauses 14.2.1.2(c), 14.2.1.2(d) and 14.2.6.2 — and
each time it halves a threshold:

| | Other places | Metro city |
|---|---|---|
| Architect's layout competence | 2 ha | **1 ha** |
| Landscape architect required at | 5 ha | **2 ha** |

The byelaws never define it. There is no entry in Chapter 1.2's definitions, and the only
neighbouring population tests in the document are unrelated: Chapter 17 speaks of
*"Metropolitan and Tier I cities"* for EV charging and the expressway annexure uses *"Mega
Cities with population of 4 million plus as per census 2011"*. Neither is offered as a
definition of this term, and the two do not agree with each other.

It bites only between 2 and 5 hectares — a band in which a site needs a landscape architect
in Lucknow and does not in a district town, on a word neither the applicant nor the reviewer
can look up. The engine treats metro status as unknown, applies the non-metro threshold, and
names the question in a caveat wherever the two readings diverge.

### V-042 — Five triggers in Chapter 13 that turn on facts no drawing shows
The chapter is unusually rich in rules that turn on something no drawing shows. Recorded
together because the pattern is the finding: this is the first chapter where most of what is
unresolved is unresolved for want of a *fact about the building's operation* rather than a
fact about its geometry.

| Clause | Trigger | What would close it |
|---|---|---|
| 13.2 | ECBC applies at a connected load of **100 kW**, or a contract demand of **120 kVA**, for a public or commercial building | An electrical load in `ProjectState` |
| 13.5 | Wastewater recycling wherever estimated discharge exceeds **10,000 litres/day** | An occupant load, and a per-capita water figure the byelaws do not give |
| 13.1.2 | The exception for **waterlogged areas** | A site attribute, or the GIS layer |
| 13.1.2(f) | The **collective recharge network** of the scheme | A fact about the layout, not the plot |
| 13.2.3.2 | *"in which there is a system of installation for supplying hot water"* | A services field |

Only the last is currently decided rather than deferred: a hotel, hospital, school or
assembly building is assumed to have hot water, which is the stricter reading and is stated
in the finding. The other four are reported as open.

Two of the six solar-water-heating categories have no occupancy in the taxonomy at all —
barracks, and hostels of more than 100 students — and are listed in
`SOLAR_WATER_HEATING_UNMAPPED` so that the gap is visible rather than merely absent.

### V-043 — The category bands overlap, and the largest projects fall outside them
The four categories are printed as **5000-20000**, **20000 -50000**, **50000-150000** and
**>150000 sqm or Site Area >50 Ha**. Two problems, in opposite directions.

**They overlap.** A building of exactly 20,000 m² is inside Category-A and Category-B both,
and one of exactly 50,000 m² is inside B and C. The difference is not cosmetic: B is where
the Environment Clearance starts. The engine places a boundary project in the **higher**
band — standing rule 4.

**Category-D appears in one table of seven.** Only the EIA table has a D row, so read
literally a 200,000 m² project owes no recharge bore, no wet/dry bin and no compensatory
plantation, while a 6,000 m² project owes all three. That cannot be the intent, and the
gazette says so itself one section later: Clause 13.9 introduces its table with *"For all
buildings **above 50,000 sqm** built up area"* against a table whose only row is printed
"50000-150000 sqm". The C row is open at the top. **Category-D inherits everything Category-C
carries**, and `conditionsFor('D')` returns C's set.

The site-area limb is kept separate from all of this. *"Site Area >50 Ha"* appears only in
the EIA table, whose D row is about *"Townships and Area Development projects"*, while every
other table is keyed on built-up area. So a 60 ha site carrying 3,000 m² of building needs
the clearance and does **not** thereby acquire Category-C's recharge bores.

### V-044 — Tree plantation is stated twice, in two chapters, on two bases
Chapter 13.7 gives a rate per square metre of **plot**. Chapter 3's Landscape Plan gives a
rate per hectare of **open space**. They are not the same obligation expressed twice; they
are two obligations that meet on the same site.

| Use | Chapter 13.7 | Chapter 3 (Landscape Plan) |
|---|---|---|
| Industrial | 1 tree per 80 m² of plot | 125 per hectare of the total open space |
| Commercial | 1 tree per 100 m² of plot | 50 per hectare of 20% of the open space |
| Institutional, playgrounds, parks | 125 per hectare, greenery on ≥20% | 125 per hectare of 20% of the area |

On a 1,000 m² commercial plot Chapter 13 asks for **10 trees**; Chapter 3's rate applied to
that plot's open space asks for **under one**. The engine holds Chapter 13's per-plot rate,
which is much the stricter, and the difference is large enough that it should be checked
against an authority's landscape practice before it is relied on.

Three more things inside Chapter 13.7 itself:

- **A one-square-metre gap.** The bands run *"200 to 300 square meters"* and *"301 to 500
  square meters"*. A plot of 300.5 m² is in neither. The engine applies the higher band.
- **A third rate that beats both.** The Category-A environmental condition — *"a minimum of
  1 tree for every 80 sqm of land"* — binds any building of 5,000 m² built-up area or more,
  and on a group housing scheme it is **2.5 times** the 50-per-hectare figure Clause
  13.7(a)(v) gives the same scheme. The larger governs, and the finding says which one it
  took and why.
- **An office building is in none of the four categories.** Clause 13.7 names residential,
  industrial, commercial and institutional plots. `office` takes the commercial rate by
  analogy, and the caveat says it is an analogy.

### V-045 — Two unit defects, and a requirement recovered from the page geometry
**"Contract demand of 120 KV"** (Clause 13.2). A kV is a voltage; a contract demand is
measured in kVA, and ECBC's own trigger is 120 kVA. Carried as printed, with the reading
stated — the same treatment as Chapter 12's "1750 m" toilet (V-040).

**"More than 10 acres (>4 hectares)"** (Clause 13.1.2 b). Ten acres is 4.047 ha, so the two
limbs of one parenthesis disagree by about 1.2%: a scheme of 4.02 ha is over the metric
figure and under the imperial one. The hectare figure is the stricter and is the one held.

**The DG-set exhaust bullet.** Printed on gazette page 132, after the 13.6 air-quality table
has finished on page 131, it reads in flattened text as an orphan paragraph — or, if you
squint, as a Category-C-only condition. The extraction settles it: the bullet sits in a cell
spanning **x 229.6–523.2** with an empty label cell at **72.2–229.6**, which are exactly the
Requirement and Built-up area column boundaries of the table above it. It is that table's
merged requirement cell continuing across the page break, so the DG rule binds Category-A
upward like everything else in that cell.

That is the third time cell geometry rather than cell text has decided a rule — Chapter 16's
column B (V-004) and Clause 15.3's colours (V-008) were the first two. The flattened docx
carried none of the three.

### V-040 — Two drafting defects in Chapter 12, carried through rather than corrected
Neither changes an answer. Both are recorded because a transcription that silently fixes its
source is no longer checkable against it.

**Clause 12.4.5(a)** prints the accessible WC as *"1500 mm x 1750 m"* — metres for the second
dimension. A 1.75 km toilet is not a possible reading, so the engine holds 1750 mm, and the
citation records the printed text so the two can be compared.

**Clause 12.4.1(d)** refers the reader to *"paragraph 11.3.1"* for guiding floor material.
Chapter 11.3 is *Review of Structural Design* and has no sub-clause 11.3.1 at all; the
definition is at **12.3.1**, in this chapter. An off-by-one-chapter reference, the same shape
as the two at V-027.

### V-041 — Industrial buildings sit outside a list that is not closed
Clause 12.2(a) applies to *"all buildings and facilities used by the public **such as**"* six
categories. Industrial, storage and hazardous are not among them — and Clause 10.1.3(b)'s
parallel list for the fire certificate names all three expressly.

Two readings, and the gazette does not choose:

- **The list is the rule.** Industry is out, and the omission against Chapter 10's list is
  deliberate: a factory is a special building for fire and is not a building used by the
  public.
- **"Used by the public" is the rule and the list illustrates it.** Then a factory with a
  public counter or a visitor reception is in, and one without is out — a distinction about
  the building's operation that no drawing shows.

The engine reports industrial uses as **not mandatory with the question surfaced**, which is
the laxer direction and a departure from standing rule 4. The reason for departing: the
stricter reading here is not a stricter *threshold* but a wholly different test, and applying
it would mean asserting that a warehouse is a building used by the public — inventing a fact
about the site rather than resolving an ambiguity about a number. The finding says the clause
turns on public use and that the app cannot see it.

What would settle it: an authority circular, or the Rights of Persons with Disabilities Act
2016 harmonised guidelines, which the byelaws do not cite here but which govern the same
subject.

### V-038 — Four safety obligations, three floor counts, two heights, three words for area
Chapter 11 adds a fourth statement of "which buildings are the serious ones", and like the
three before it, it agrees with none of them:

| Obligation | Floors | Height | Area basis |
|---|---|---|---|
| Seismic design — Clause 11.8.1 | >3 incl. ground | **>12 m** | infrastructure, **land cover** >500 m² |
| Fire certificate — Clause 10.1.3 | — | >15 m | **covered area** >500 m² |
| Completion-stage fire NOC — Clause 2.9.3.2 | **>4** | ≥15 m | **ground coverage** >500 m² |
| Structural completion certificate — Chapter 2 | >3 storeys | >15 m incl. ground floor | important infrastructure |

Three different floor counts, two different heights, three different words for area, four
different lists of what counts as important. Nothing in the byelaws relates them, and each
one governs a different clearance, so a building can be caught by one and not the next.

The seismic threshold is the lowest of them at 12 m, which makes it the binding one on
ordinary buildings — and the one that was missing entirely until now.

**Chapter 14 nearly doubles the pile.** Competence and experience limits add four more
heights and three more floor counts, none of which line up with the four above:

| Threshold | Height | Floors | Area |
|---|---|---|---|
| Supervisor's competence — 14.2.4.2(a) | **7.5 m** | 2 | plot 100 m² |
| Seismic design — 11.8.1 | 12 m | 3 | 500 m² land cover |
| Experience band 1 — 14.4 | 12 m | 4 | 2500 m² floor area |
| Fire certificate — 10.1.3 | 15 m | — | 500 m² covered |
| Completion NOC — 2.9.3.2 | 15 m | 4 | 500 m² ground coverage |
| Engineer's structural competence — 14.2.2.2(b) | **16 m** | 5 | plot 500 m² |
| Experience band 2 — 14.4 | **24 m** | 8 | 5000 m² covered |
| Peer review — 11.3 | **50 m** | — | — |

**Eight obligations, seven distinct heights, six distinct floor counts, and four words for
area.** Two of them — 12 m and 15 m — are each used by two different clauses with different
floor counts attached, so even the shared numbers do not mean the same thing.

*Correction, 2026-09-11.* `thresholdDivergence` in `src/domain/rules/conflicts.ts` now
computes these from the declared clause nodes. It agrees on **seven heights** exactly —
7.5, 12, 15, 16, 17.5, 24, 50 — and counts **five** distinct floor counts, not six: 2, 3, 4,
5, 8. The difference is what is being counted. This entry counted distinct *statements*, and
Clause 11.8.1's ">3 including ground" and Chapter 2's ">3 storeys" are two statements
sharing the number 3 on two different bases — which is arguably the more telling count, since
a floor count including ground and a storey count are not the same quantity. Both readings
stand; the figure is five distinct numbers across six distinct statements.

The floor-count gap is now costing more than it was. Chapter 14 states **every** competence
limit as "storeys or height", so the supervisor and engineer verdicts both rest on height
alone and say so in a caveat. A four-storey building at 15 m reads as inside an engineer's
competence on height and is outside it on storeys. This is the fifth obligation blocked on
the same missing field.

**The floor-count limb cannot be evaluated at all.** `ProjectState` has no floor count, and
one cannot be derived from height: four floors at 2.75 m stands at 11 m, under the seismic
height limb and over its floor limb. `assessStructuralSafety` reports `dependsOnFloorCount`
and the finding says *"unless this runs to more than three floors"* rather than *"no"* —
the same treatment as V-037. This is now the third obligation blocked on the same missing
field.

*One inconsistency inside the engine is worth recording alongside this.* `findings.ts`
passes `floors: Math.ceil(height / 3)` to the compounding engine for the Item 10 fee
quantity, while `fire.ts` and now `structural.ts` refuse to derive a floor count from
height on principle. Both are defensible — a fee quantity degrades gracefully where a
clearance trigger does not — but the codebase should not hold two answers to "can we guess
the floor count" without saying which applies where.

### V-039 — The literal reading of a non-compoundable bar would empty a neighbouring table
Clause 16.1.3(vi) reads *"Construction in the buildings where earthquake resistance
measures are mandatory as per chapter 11.8."* Read literally, and now that Chapter 11.8 has
been read, that makes **every building over 12 m non-compoundable outright** — which would
be the stricter reading and so, under standing rule 4, the one to apply.

It is not the reading applied, because the gazette settles it two clauses later. Chapter
16's own table of compoundable limits has a column headed *"Buildings >15-meter height and
Group Housing except multi-units"*, with figures in every row. Under the literal reading
that column could never apply to anything: every building it describes is over 12 m and
therefore already barred. **A reading that empties a neighbouring table of all meaning is
the wrong reading.**

So the bar is taken to catch construction that *violates* the mandatory measures, not all
construction in a building subject to them. `NON_COMPOUNDABLE_READING` states that on the
finding rather than leaving it as an unexplained choice.

The same argument applies to two more bars of the same shape: (vii) firefighting, *"as per
chapter 10.1.3"*, and (xii) accessibility, *"as per chapter 12"*. All three would empty the
same column. This narrows what the chapter-10 entry at V-006 claimed for bar (vii): the
first limb is not a bar on its own, and it is the second limb — whether the NOC was
actually obtained — that does the work there.

Standing rule 4 says to apply the stricter reading where the gazette is ambiguous. It does
not say to apply a reading the gazette contradicts elsewhere, and telling the two cases
apart is what reading a whole chapter buys over reading a clause.

### V-032 — The parking rule cites a chapter that has no tables, and the real table disagrees
`parking.ecs-ratios` cited "Chapter 10 (Table 10.1)". Chapter 10 is Fire Prevention and
Life Safety, three pages, zero tables. The parking standards are at **Para 3.3.4.3**, and
opening it to correct the pointer showed the engine reading it wrongly in two ways.

**The residential basis is wrong, not just the figure.** Para 3.3.4.3 states residential
parking **per dwelling unit, keyed on the area of the unit** — plotted development 1.00 ECS
up to 100 m², 1.25 for >100–150, 1.50 above; group housing the same ladder from >50 m²;
EWS 2.0 m²/DU, LIG 4.0 m²/DU; affordable 1 per DU plus 10% visitor above 60 m². The engine
computes ECS per 100 m² of total built-up area. It has neither a dwelling-unit count nor a
unit-area field, so it cannot express this rule at all.

**Three commercial figures are wrong.** Measured against the Para 3.3.4.3 table:

| | Engine | Gazette |
|---|---|---|
| Shops / convenience shopping / commercial units | 2.0 / 100 m² | **1.0 / 100 m²** |
| Hotels | 2.0 / 100 m² | **1.5 / 100 m²** |
| Bazaar street | 1.5 / 100 m² | **1.25 (metros), 1.00 (other)** |
| Commercial complex | 2.0 | 2.0 ✓ |
| Shopping mall | 3.0 | 3.0 ✓ |

All three err toward over-requiring, which is the safe direction but still wrong: shops are
required to provide double the parking the byelaws ask for.

**Deliberately not fixed here.** Para 3.3.4.3 is a Chapter 3 table with its own ECS-size
schedule, a visitor-parking note, and setback and stilt provisions around it, and half of
it needs a project field that does not exist. Patching four numbers out of it without
reading the rest is the shallow pass the strategy document warns against. The clause
pointer is corrected and the divergence is recorded on the rule as a challenge so the
figures no longer present as settled.

### V-033 — Is there a minimum road width for fire access? Not in the byelaws
B-029 removed a 12 m block that no clause supports. What replaces it is honest but
incomplete: Clause 10.2.1 requires approach "at least from one side", Para 3.3.4.7 requires
6.0 m motorable all round, and neither says anything about the right of way a turntable
ladder needs.

The byelaws delegate this. Clause 10.1.1(i) requires "minimum firefighting and life safety
installations as required by the fire-safety regulations or norms or guidelines made under
NBC 2016, these building byelaws, Oil Industry Safety Directorate guidelines, Petroleum Act
and Rules, Explosive Act and Rules", and Clause 10.3.2 requires new buildings to be built
"as per requirements of National Building Code of India-2016". **The binding numbers are in
the NBC and in the UP Fire and Emergency Services Rules 2024, and this repository has
neither.** That is the Phase 4 outcome the strategy document predicted: a legitimate answer
that has to be recorded rather than filled in.

What would settle it: NBC 2016 Part 4, and the 2024 Rules as notified.

### V-034 — Two definitions of "Special Building", and they are not the same list
The gazette defines the term at Clause 1.2(q) and then uses a different list at Clause
10.1.3(b). Both are gazette text; nothing reconciles them.

| Occupancy | 1.2(q) definition | 10.1.3(b) | Ch. 2 completion record | Ch. 2 plan requirements |
|---|---|---|---|---|
| Educational | — | ✓ | ✓ | — |
| Institutional | — | ✓ | ✓ | ✓ |
| Assembly | ✓ | ✓ | ✓ | ✓ |
| Business (offices) | — | ✓ | — | — |
| Mercantile (retail) | wholesale only | ✓ | — | — |
| Industrial | ✓ | ✓ | ✓ | ✓ |
| Storage | wholesale only | ✓ | ✓ | ✓ |
| Hazardous | ✓ | ✓ | ✓ | ✓ |
| Hotels, hostels | ✓ | — | — | — |
| Centrally air-conditioned | ✓ | — | — | — |
| Area threshold | >500 m² built-up | none (on this limb) | >500 m² ground coverage | none |

Four statements of the same concept, four different lists, three different area bases. The
engine takes the **union** — a building is caught if any of them catches it — which is the
stricter reading, and `assessFireSafety` names which limb fired so the basis is visible on
the finding. Where the two readings disagree the narrower one is printed as a caveat rather
than discarded.

The divergence is not academic: a 400 m² school needs a certificate under Clause 10.1.3(b)
and does not under Clause 1.2(q). A hotel is the mirror case — NBC puts hotels in group
A-4, so Clause 10.1.3(b) never reaches one, and it is caught here only because Clause
1.2(q) names hotels expressly.

What would settle it: an authority circular, or the 2024 Rules' own scope clause.

### V-035 — The height limb reads 15 m or 17.5 m depending on which clause you start from
Clause 10.1.3(a) says "Multi-storied buildings having more than 15 meters height". Clause
1.2(m) defines the term it uses:

> "Multi-Storeyed Building or High-rise Building" means building above four storeys, and/or
> a building exceeding 15 meters or more in height (without stilt) and 17.5 meters
> (including stilt).

Read together, a **stilted** building is not a multi-storeyed building until 17.5 m, which
would lift the certificate threshold by 2.5 m on exactly the buildings that most often have
a stilt — stilt parking being mandatory for multi-units under Para 3.3.4.8. Read on its own,
Clause 10.1.3(a) states a flat 15 m.

The engine applies the flat 15 m, which is the stricter reading, and emits a caveat naming
the alternative for any building between 15 m and 17.5 m. `ProjectState.hasStilt` exists
and is deliberately **not** consulted here: using it would silently switch to the laxer
reading.

### V-036 — "Covered area", "built-up area" and "ground coverage" for the same 500
The three places the gazette gates a fire requirement at 500 m² each use a different
measure. Clause 10.1.3(c) says **covered area**; Clause 1.2(q) says **total built up
area**; the Chapter 2 completion record says **ground coverage**. Chapter 1 defines two of
them and they are not the same quantity:

> "Built-up area (Building)" … refers to the total covered area on all floors.
> "Covered area" means the covered floor area above the plinth level over which a building
> is constructed.

The second reads as a footprint — its exclusion list is a footprint list (garden, well,
compound wall, watchman booth, pump house) — and "ground coverage" in the completion clause
agrees with that reading. So Clause 10.1.3(c)'s 500 m² is most likely a **footprint**, and
the engine tests it against `proposedBuiltUpArea`, the all-floors total.

That is the stricter direction: the larger number crosses 500 sooner, so the certificate is
required earlier. But it is wrong by a factor of the floor count, and the engine has no
ground-coverage field to do better. On a four-storey mixed-use building the two readings
diverge fourfold.

### V-037 — The completion-stage fire NOC turns on a floor count the app cannot see
Clause 10.1.3 is the sanction-stage trigger. The records deposited with the notice of
completion (Clause 2.9.3.2) carry a fourth, different one:

> No-objection certificate from the competent authority from the point of view of fire
> safety for buildings **more than four floors or 15-meters and more high** and special
> buildings like educational, assembly, institutional, industrial, storage and buildings
> with hazardous use and buildings with mixed occupancies of the above mentioned uses whose
> **ground coverage is more than 500 square meters**

Two differences from Clause 10.1.3, beyond the list and the area basis (V-034, V-036):
it is **inclusive** at 15 m where Chapter 10 is exclusive, and it adds a **floor count**
Chapter 10 does not use. A five-storey block standing at 14 m needs a fire NOC at
completion and is caught by nothing in Chapter 10.

`ProjectState` has no floor count and one cannot be derived from height. `assessFireSafety`
returns `dependsOnFloorCount` and says so in a caveat rather than assuming four or fewer —
the same treatment as the thirteen compounding bars at V-006. Advanced mode has to ask.

*A note on the clause numbers in this entry and B-030.* `gazette-tmpr8.txt` drops clause
numbering entirely — the flattened text carries the sentence but not the "2.9.3.2" above
it — so every clause number here was read off the per-chapter PDF extractions, which keep
it. Four numbers written from memory during this pass were wrong and were corrected that
way: the completion record is 2.9.3.2 and not 2.7.3 (which is "Grant of permit/refusal"),
the fire escape is 3.3.1.16 and not 3.5.5, the parking standards are 3.3.4.3, and the
motorable surround is 3.3.4.7. The citation test checks that a quote resolves to a line;
it cannot check that the clause number attached to it is right. Only the PDFs can.


### V-029 — Clause 9.2.3's master FAR table mislabels its own maximum column
The table that governs purchasable FAR across the whole byelaws states each band's
components as a percentage of that band's base, and then states the total as a percentage
of the *first* band's base:

| Road width | BFAR | PFAR | PPFAR | MFAR as printed | MFAR as its own components add up |
|---|---|---|---|---|---|
| Up to 12m | B1 | Up to 20% of B1 | Up to 20% of B1 | 140% of B1 | 140% of B1 ✓ |
| 12 – 24m | B2 | Up to 50% of B2 | Up to 50% of B2 | **200% of B1** | 200% of **B2** |
| 24 – 45m | B3 | Up to 100% of B3 | Up to 150% of B3 | **350% of B1** | 350% of **B3** |
| More than 45m | B4 | Up to 100% of B4 | Unrestricted* | Unrestricted* | — |

The header of column (5) says `(5) = (2)+(3)+(4)`, which settles it: the total is the sum of
the row's own cells, so rows 2 and 3 mean B2 and B3 and the "of B1" is a copy-paste that
survived proofreading. Row 1 happens to read correctly only because B1 is its own base.

It matters more than a typo normally would, because the per-chapter tables read literally.
Industrial buildings carry B1 = 1.5 and B2 = 2.5; at 200% of B1 the 12–24 m maximum would be
3.0, and Chapter 7 prints **5.0**, which is 200% of B2. Every per-chapter table checked so
far follows the components, not the label.

**Not acted on, and deliberately.** Clause 9.2.3 Note-2 makes this moot for the engine:
*"In case of any difference in the prescribed limits of maximum permissible FAR in chapter-3
to chapter-7 and the table above, the figures in respective chapters will prevail."* The
engine reads the per-chapter tables, so it never evaluates the master ladder and the defect
cannot reach a number. Recorded because the ladder is the one an authority reviewer is most
likely to quote from memory.

### V-030 — The tranche split now reads the printed chapter tables — CLOSED, V-014 surfaced
`assessPurchaseFee` reproduces the gazette's own worked example to the rupee — ₹2,80,00,000
for the purchasable tranche, ₹6,72,00,000 for the premium, ₹9,52,00,000 in total — which is
the strongest check available anywhere in this codebase, because it is the drafter's
arithmetic rather than a reading of it. Two things stop it reaching a user:

~~1. **No land rate.**~~ **This was wrong when written.** `ProjectState.circleRate` has
   existed all along, documented against Clause 16.3.6.1 as the higher of the Authority's
   residential rate and the District Collector's circle rate — materially the quantity
   Clause 9.2.5 calls Rc. Worse, `findings.ts` was *already using it* to charge for
   purchasable FAR, with the wrong formula and a hardcoded coefficient. Writing "nothing can
   call it" without opening the one call site that already did is how B-031 survived a
   chapter-9 pass that was otherwise careful. The lesson is narrow and worth keeping: a new
   module is not unreached until the call sites have been read, and "this is not wired up
   yet" is a claim about other files, not about the module in hand.

2. **The split is approximated, not read.** `resolveBaseFar` returns `purchasableFar` as a
   single number. `splitPurchasedFar` now divides it using Clause 9.2.3 columns (3) and (4),
   which is the gazette's general ladder — but Note-2 makes the **per-chapter** tables
   prevail where they differ, and those are exactly the PFAR and PPFAR columns already
   sitting in `purchasable-far.json` with `far.ts` not reading them. Until `far.ts` resolves
   its ceiling from those rows instead of the hardcoded ladders, the split is right in the
   general case and unverified against the specific one.

**Now done.** `resolveBaseFar` reads `purchasable-far.json` and returns a
`purchasableTranche` carrying the printed PFAR and PPFAR columns for the road band, clamped
to the headroom the ceiling allows. **Fourteen of the thirty-two occupancy/area-type pairs
now split from the printed chapter row**; the remaining eighteen are the ten uses V-003
names plus plotted residential, and they fall back to Clause 9.2.3's general ladder and say
so on the finding.

The check that matters: Clause 9.2.5's worked example prints its own *permissible* columns —
purchasable 2.5, premium 3.75 — and the tranche resolved from Chapter 4's table for that
scheme is 2.5 and 3.75. The split and the example agree without either being fitted to the
other.

**What remains is V-014's, not this entry's.** The ceiling is still Chapter 3's, because
Clause 9.2.3 Note-2 subordinates the chapter-9 master table to chapters 3–7 and says nothing
about chapter 3 against chapter 5. So on four cells — malls and hotels, both area types —
the split now comes from a row whose own base FAR is higher than the base the engine
applies. That is sound arithmetic, because the columns are absolute FAR figures rather than
percentages, but it is two chapters in one answer. `baseFarDivergence` marks those four and
a caveat names them on the finding, which is the first time V-014 has been visible anywhere
except in this log.

### V-031 — The green incentive is awarded unconditionally and cannot be taken back
Clause 9.3 gives 3% / 5% / 7% additional FAR on the FAR availed, and the engine applies it
above the ceiling, which Note I confirms is right: *"This incentive FAR on Green Buildings
shall be over and above the MFAR."* Both of that Note's conditions are missing:

- **Note I** awards the incentive *"after pre-certification from the empanelled agency"*.
  `greenRating` is a plain enum on `ProjectState` with no certification status behind it, so
  a user who intends to seek a rating and one who holds a pre-certificate get the same answer.
- **Note II** imposes a penalty *"at the rate 2 times of the land cost as per the circle
  rates for the additional FAR for the rating not achieved"* if the committed rating is not
  reached at final occupancy. `greenRatingShortfallPenalty()` computes it and nothing calls
  it. `ProjectState.circleRate` supplies the rate — the gap is that nothing records what
  rating was *committed* as against achieved, so there is no shortfall to price.

The incentive is therefore presented as settled entitlement when the byelaws make it
provisional and reversible at twice the land cost. On a 2000 m² plot at a 2.5 ceiling and a
₹35,000/m² circle rate, a platinum rating claimed and not achieved is a penalty of roughly
₹2.45 crore — a figure the engine currently gives no hint of.

### V-025 — Clause 8.1.3.1 prints a maximum ABOVE its own components, and one below
Two of the mixed-use table's eight band cells fail the identity MFAR = BFAR + PFAR + PPFAR,
and — for the first time in the byelaws — they fail in **opposite directions**:

| Area type | Band | BFAR | PFAR | PPFAR | Components | Printed MFAR |
|---|---|---|---|---|---|---|
| Built-up | >24–45 m | 2.00 | 1.00 | 1.50 | 4.50 | **5.25** |
| New layout | >24–45 m | 2.50 | 2.50 | 3.75 | 8.75 | **6.25** |

Both readings were taken independently from the chapter PDF and from the `.docx`, and the
two agree cell for cell, so this is the gazette's arithmetic and not the pipeline's.

**What makes them legible is a second regularity, underneath the identity.** Across the
thirty-six rows that behave, every table generates its 24–45 m band from the base alone:
PFAR = 1.0 × BFAR, PPFAR = 1.5 × BFAR, MFAR = 3.5 × BFAR. A base of 2.5 gives
2.5 / 3.75 / 8.75; a base of 2.0 gives 2.0 / 3.0 / 7.0.

- **The new-layout row's components are exactly right.** 2.50 / 3.75 is what the pattern
  gives for a base of 2.50, and matches group housing and hotels at that base cell for
  cell. Only the total is wrong, and by an identifiable step: 2.50 + 3.75 = **6.25**, the
  printed figure exactly. The base was left out of the sum.
- **The built-up row contains three different base FARs.** It carries base 2.00; its
  1.00 / 1.50 purchasable pair is the pair for a base of 1.00; and its printed 5.25 is
  3.5 × 1.50, the figure for a base of 1.50. Nothing in the cell is coherent with 2.00.
  The 1.00 / 1.50 pair is the same one Clause 7.1.5 imported from the secondary-school row
  (V-023), so the same base-1.00 line appears to have been copied into two chapters.

Standing rule 4 resolves each to the lowest reading: **4.50** built-up (the components,
0.75 below what is printed) and **6.25** in a new layout (the printed figure, 2.50 below
what the components imply).

**This is what changed about how the rule is applied.** Until Chapter 8 the printed
maximum was always the lower of the two, so *"honour what the gazette prints"* and
*"apply the stricter reading"* were the same instruction and nothing distinguished them —
V-018 resolves Clause 6.2.4 by taking the gazette at its word, and says so. Clause 8.1.3.1
separates them, and taking the gazette at its word here would over-permit. `strictCeiling()`
now chooses per band rather than per table, gated on the 0.05 rounding step so that the
three cells which round (1.75 + 0.9 + 0.9 = 3.55, printed 3.6) are not shaved by it.

The identity now holds on **153 of 157** band checks across sixteen tables. The test suite
asserts that these four are the only failures, and separately that the 1.0× / 1.5× / 3.5×
pattern holds everywhere else — so a new copied cell fails the build on either count.

### V-024 — A means of access split five ways by LOCATION, which the engine cannot express
Clause 8.1.3 keys the mixed-use standards on **where the plot is**, and only the access
figure actually differs across the five:

| Location | Minimum road |
|---|---|
| 8.1.2(a) Mixed-use zone, plot up to 100 m² | 9 m |
| 8.1.2(a) Mixed-use zone, larger plot | 12 m |
| 8.1.2(b) Plot in an approved layout | **24 m** |
| 8.1.2(c) Notified bazaar street | 12 m |
| 8.1.2(d) Along a 24 m or wider road | **24 m** |
| 8.1.2(e) TOD zone | 12 m or more |

This is a **fifth** dimension after facility, area type, use zone (V-021) and plot size
(V-019), and `OccupancyDefinition` has no field for it. `mixed_use` holds **12 m**, which
is right for a mixed-use zone above 100 m² and for a bazaar street — the two commonest
cases, and the same choice V-019 made for marriage halls. It is 3 m too strict for a small
plot in a mixed-use zone and 12 m too lenient for an approved-layout plot, which would be
passed on a 12 m road where the gazette asks for 24.

Parking has the same shape and the engine flattens it the same way: three locations say
*"as per proposed higher use"*, one says *"as per 3.3.4"* and the TOD column says
*1 ECS per 100 m²*. `MIXED_USE_MIN_ROAD_M` and `MIXED_USE_STANDARDS` carry all five
columns so the gap is measured rather than suspected.

### V-026 — TOD is fully specified, fully modelled, and unreachable
Clause 8.2.2.2 states TOD FAR as a **percentage of base FAR** — 150% at 12 m, 250% to 24 m,
350% to 45 m, unrestricted above — with the base column reading *"As per byelaws"* in every
row. It is the only FAR rule in the byelaws expressed as a multiplier, and it cannot be
resolved without first resolving the underlying use.

Everything about it is now read and tested: the ladder, Clause 8.2.2.1's land-use mixing
table (six uses, 33% kept in the existing use and 67% available to the other), the
predominance bar, and Clause 8.2.2.3's parking. What is missing is any way for a project to
say it is in a TOD zone: that is a fact about the plot, notified by the Master Plan, and
`ProjectState` has no field for it — the same shape of gap as V-006.

One consequence is worth flagging because it is a **pricing** rule and the engine's
purchasable/premium split exists precisely to price them apart. Clause 8.2.2.2 Note (2):
*"the charges for purchasable FAR and premium purchasable FAR shall be the same."* In a TOD
zone the distinction collapses, in the direction of the cheaper rate.
Held as `TOD_PREMIUM_CHARGED_AS_PURCHASABLE`.

### V-027 — Two cross-references that go nowhere, and one of them cannot be repaired
Chapter 8 cites two paragraphs of itself that do not exist. Neither number appears anywhere
else in the byelaws; both were found by checking every cross-reference in the chapter
against its own headings, in `tools/extract-mixed-use.py`.

- **8.1.3.6** — the standards table gives the FAR for a mixed-use zone and an
  approved-layout plot as *"As per para 8.1.3.6"*. The chapter's FAR clause is numbered
  **8.1.3.1** and is introduced as applying to *"paragraph 8.1.2 (a) and (b)"* — exactly
  the two columns pointing at 8.1.3.6 — so the intent is not in doubt. The engine reads
  8.1.3.1 and records the discrepancy rather than silently correcting it.
- **8.1.4** — Note-1 says *"Permissible occupancies in mixed-use development shall be as
  per paragraph 8.1.4."* There is no 8.1.4. **There is no list of permissible mixed-use
  occupancies anywhere in the byelaws.** Clause 8.3.1 constrains what may be mixed — only
  non-manufacturing and service industry, education kept away from healthcare and
  warehousing, and twenty-four named activities barred outright — but it enumerates
  nothing. This one cannot be resolved by reading; the list is absent.

So the engine cannot answer *"may these two uses be combined here"* from the gazette. What
it can answer is the negative half, and does: `EXCLUDED_FROM_MIXING` holds all twenty-four
barred activities and `checkMixing` holds the proportions.

**Clause 8.1.3's mixing proportions turn on a distinction worth recording.** Along a 24 m
road and in a TOD zone the rule has three limbs: at least 33% to the principal use, at most
67% to the others, and — printed as a sentence under the table rather than as a figure in
it — *"share of single other use shall not be more than principal use."* The third limb is
meaningless if the principal use is read as the largest share proposed, because nothing can
then exceed it. It is the use the **master plan, zonal plan or layout assigns**: Clause
8.2.2.1's note says the *"MP/ZDP/layout land use shall remain pre-dominant land use"*, and
Clause 16.1.3(xiii) makes building in breach of the predominant land use non-compoundable.
`checkMixing` therefore takes the principal use as an argument rather than deriving it, and
a mix can breach the clause while still having a clear largest use.

### V-028 — An unrestricted ceiling collapses to base FAR — PRE-EXISTING, not acted on
Found while testing Chapter 8's top band, but not a Chapter 8 defect: it governs group
housing and commercial too, both of which have had an unrestricted band since long before
this chapter was read.

Where the gazette says a road above 45 m carries **unrestricted** FAR, `resolveBaseFar`
reports two figures that contradict each other:

```
ceilingFar       Infinity      ✓ what the gazette says
purchasableFar   Infinity      ✓ consistent with it
maxPermissibleFar   2.0        ✗ equal to the base FAR
```

The cause is one line — `availableFar = canPurchase && Number.isFinite(ceilingFar) ?
ceilingFar : baseFar` — which falls back to the base whenever the ceiling is infinite.
`findings.ts` blocks on `proposedFar > maxPermissibleFar`, so on a 60 m road a project is
told it exceeds a ceiling the same call reports as unlimited. That direction is
over-restriction: it refuses floor area the byelaws allow.

Not fixed here. It is engine logic rather than a transcription, it changes the answer for
three occupancies that this chapter did not touch, and it deserves its own change with its
own tests rather than riding along inside a chapter's commit. `mixed-use.test.ts` asserts
the present behaviour explicitly, on both a Chapter 8 ladder and a pre-existing one, so the
fix cannot land without the assertion being updated deliberately.

### V-010 — Chapters 3 and 4 give different height ceilings — UNRESOLVED, stricter applied
Clause 3.2.4.1 keys the plotted-residential ceiling on **plot size**: *"for all
single/multi-units less than 300 square meters plot size, three floors with stilts up to
15 meter is allowed and on plots above 300 square meters, four storeys with stilts up to
17.5-meter height is allowed."*

Clause 4.1.4 keys the same ceiling on **unit count**: *"The maximum height of the building
shall be 15-m including stilt for single unit and 17.5 meters including mandatory stilt
floor for multi-unit."*

A single dwelling on a 400 m² plot is 17.5 m by the first and 15 m by the second. Neither
is obviously the drafter's intent, and nothing in either chapter subordinates one to the
other. Under standing rule 4 the engine applies **the stricter of the two**:
`Math.min(occupancy ceiling, plot-band ceiling)`.

This partly walks back **B-006**, which set `res_single.maxHeightM` to 17.5 on the strength
of Chapter 3 alone. B-006's mechanism was right — the ceiling does follow the plot — but
it is a floor on the answer, not the whole of it. Settling this needs an authority's
practice, not another reading.

*Correction, 2026-09-11.* The `Math.min` above was true of `setbacks.ts` and not of the app.
`findings.ts` reported `occupancy.maxHeightM` alone — Clause 4.1.4's limb — so a multi-unit
on a 200 m² plot was cleared at 17.5 m where Clause 3.2.4.1 allows 15. Recorded as **B-044**
and fixed; the height finding now names both clauses whenever they differ, rather than
resolving them silently. Found by declaring `maxHeight` in the rule graph, which made it
visible that two rules answer this question and only one of them was being reported.

### V-009 — Chapter 3 confirmed against a second source, and its FAR matrix extracted
The Chapter 3 PDF (gazette p.37–75) is a reading of the byelaws entirely independent of
the `.docx` every figure in the engine came from. **Everything the engine had for Chapter 3
was confirmed exactly**, including the B-013 correction that was made only hours earlier:

| | Confirmed |
|---|---|
| Plotted residential setbacks | 1/0/0/0 · 3/1.5/0/0 · 3/3/0/0 · 4.5/4.5/1.5/0 · 6/6/1.5/1.5 |
| Telescopic FAR | 2.0 / 1.8 / 1.75 / 1.5 / 1.25, Max FAR 2.0 in every band |
| Group housing, built-up | base 1.5; 2.0 / 3.0 / 3.0 / 5.25 / unrestricted |
| Group housing, non-built-up | base 2.5; 5.0 / 5.0 / 8.75 / unrestricted, **and no band below 12 m** |
| Shops, built-up / non-built-up | 2.1 / 3.0 / 5.0 and 2.45 / 3.5 / 6.0 |

`src/domain/__tests__/far-matrix-source.test.ts` now asserts this agreement on every run,
so the two readings cannot drift apart silently.

**The matrix itself is extracted**: `docs/source/derived/far-matrix.json`, **161 band rows
across 63 occupancies and seven clauses (3.2.2.1 to 3.2.2.7)**, nothing unparsed. This is
what V-003 was waiting for, and it supplies most of V-005 as a by-product — an occupancy's
first band *is* its minimum road width, so a shopping mall's `=>18 – 24m` says 18 m, read
rather than reasoned.

Three layout traps in this table, each of which corrupts the result in silence:

1. **The Sl. numbering restarts seven times.** Keying a row on its Sl. alone merges the
   plotted-residential ladder with non-bedded medical establishments, industrial buildings,
   farmhouses and open spaces — all numbered "1". The key is (clause, sub-table, Sl.).
2. **A table spilling across a page break belongs to the heading on the *previous* page.**
   Clause 3.2.2.6's last table runs onto page 52 above the `3.2.2.7 Other Uses` heading;
   assigning by page rather than by vertical position files Guest House and Utilities under
   Other Uses. This is why L0 now records prose with its y coordinate.
3. **A bare FAR value looks like a band.** `"2.0"` starts with a digit, and matching bands
   on that shifted every column of clause 3.2.2.6 Sl. 5 one place to the left.

And two defects in the gazette itself, recorded rather than smoothed over:

- **Clause 3.2.2.6 Sl. 2(b)** has no use type printed. Its name — *Auditorium / Convention
  Centre (Non-built-up area)* — appears only on the continuation page, while the row above
  it reads *(Built-up)*. Inheriting the name would have labelled the non-built-up row
  built-up. It also has no `=>18–24m` band, where its 1(b) counterpart does.
- **Clause 3.2.2.3 Sl. 11, Cold Storage**, is printed with a road width of 18 m and nothing
  else: no ground coverage, no base FAR, no max FAR.

### V-008 — Clause 15.3 states permissibility in colour — RECOVERED, AND NOW READ
**Closed by B-048.** The colour extraction recovered all 847 verdicts in the chapter-15 pass; what remained was that nothing consumed them. `zoning.ts` now does, and the land-use question is asked on every assessment.

The permissibility matrix — the table that answers the app's *first* question, may this
use go on this plot at all — encodes its answers as cell fill, not text. The legend on
gazette page 149 is explicit: green is *Permitted*, red is *Prohibited*, and a digit laid
over the fill is *Permitted with conditions*, the digit being a footnote reference.

`gazette-tmpr8.txt` renders every one of those cells as blank. Fifty-three activities
against sixteen zones read as an empty table, and nothing noticed until the colours were
looked for directly. The stray digits scattered through that region of the flattened text
— `7 7 7 7 7 7 7`, `2 2` — are the condition references, cut loose from the zones they
qualify.

Two sources, two answers. The docx gives **280** verdicts from `w:shd/@w:fill`, and they
are not trustworthy on their own: only 29 of ~53 activity rows survive as real tables,
averaging 9.7 verdicts per row against 16 zones, because merged header cells collapsed the
columns. The rest of the matrix is a pasted raster (`word/media/image2.png`), where no
markup exists to read.

The Chapter 15 PDF resolves it. There the matrix is **vector, not raster**: the fills are
drawing operations and the condition digits are positioned text. `tools/extract-zoning-matrix.py`
pairs each filled rectangle against its column header's x and its row's y band and recovers
**847 verdicts across 53 activities, 52 of them complete across all sixteen zones** —
activity codes running 1.1(a) to 9.3 with no gaps. Output in
`docs/source/derived/zoning-matrix.json`.

Where the two disagree, prefer the PDF for this table and say why: its column alignment is
verifiable — sixteen headers, sixteen cells, each matched by position — while the docx's is
visibly broken by merges before any reading begins.

**Three things follow.**

1. **The L0 extractor must capture fill colour**, not only text and borders. This is the
   third distinct channel the gazette uses to carry meaning, after cell text and cell
   merges, and the first two were already nearly missed.
2. **Never conclude a cell is empty from the flattened text.** It is a text-only view of a
   document that says things in colour.
3. **Single-path extraction is not safe.** One pipeline lost an entire table in silence.
   Two independent paths — docx XML and chapter PDF — disagree loudly, which is the point.

### V-003 — Ten occupancies still read a table written for shops — NOW VISIBLE AT RUNTIME
**Update.** These ten are exactly the occupancies for which `purchasableRowFor` returns
nothing, so `resolveBaseFar` now marks their tranche `source: 'clause-9.2.3'` and the
finding says the split came from the general ladder because no chapter table covers the use.
The gap is unchanged; it is no longer silent.

Rows 3(a) and 3(b) — shops, convenience shopping, commercial units — are read from the
gazette. Offices, hotels, malls, cinemas, petrol stations, hospitals, schools, assembly,
industry and warehousing still borrow those two ladders **in the engine**.

**The data they need now exists.** `docs/source/derived/far-matrix.json` holds all 63
occupancies with their bands, base FAR and max FAR (V-009). What remains is wiring: the
engine's `farBasis` routes eleven occupancies to one of two ladders, and it needs to route
each to its own row instead. That is an engine change, not a reading task.

### V-004b — Item 10's quantity is ambiguous in the gazette
"@Rs. 6132/- per running meter of height (measured as per periphery of existing
building) per floor". Perimeter × floors, or metres of excess height? The engine charges
the larger and prints the alternative on the line item. Settling this needs an
authority's worked example, not a re-reading.

### V-006 — The thirteen non-compoundable bars are modelled but not collected — ONE LIMB NOW CLOSES
`NonCompoundableFlags` carries all thirteen offences at 16.1.3 and each one ends the
assessment. Nothing in the app sets them: whether the plot is disputed, whether the Fire
NOC was obtained, whether the land is a filled pond are facts about the site and its
clearances, not about the drawing. Advanced mode has to ask. Until it does, the fee is
quoted on the assumption that none of the thirteen applies, and that assumption is
stated in the caveats.

**Bar (vii) is now half-computable.** It reads "Firefighting requirements are mandatory, or
the Fire NOC has not been obtained where it is mandatory **as per chapter 10.1.3**" — and
10.1.3 has now been read. Whether a fire clearance is *mandatory* for a given building is a
fact about the drawing, and `assessFireSafety` determines it. Only the second half — whether
the owner actually obtained one — remains a question the app must ask. The fire finding now
states the consequence on every building 10.1.3 catches, so a user sees the compounding bar
before they build rather than after.

Chapter 10 also constrains what bar (vii) can mean for an *existing* building, which is the
only kind a compounding application concerns. Clause 10.3.1 splits them three ways and
relaxes real requirements for two of the classes — for an unapproved old building, "provision
of access road, setback and fire escape shall not be mandatory". `EXISTING_BUILDING_TREATMENTS`
holds all three. Nothing consumes them yet; the compounding engine has no notion of when a
building was built or whether its map was approved.

### V-007 — The 9 m floor under the commercial FAR ladder is the engine's, not the gazette's
Rows 3(a) and 3(b) print their first band as "Up to 12m" with nothing under it. The
engine refuses FAR below 9 m. That may well be right — a minimum access width is likely
stated elsewhere in Chapter 3 — but it is not stated *there*, and it is currently an
inference sitting inside a table marked verified.

### V-014 — Chapters 3 and 5 print different maximum FARs for the same commercial units
Clause 5.2.5 (gazette p.86) gives commercial FAR as a four-column breakdown per road band
— **BFAR + PFAR + PPFAR = MFAR**, base plus purchasable plus premium purchasable — where
Chapter 3's matrix gives only a base and a maximum. Three cells disagree:

| | Chapter 3 | Chapter 5 |
|---|---|---|
| Commercial units, built-up, >24–45 m | **5.0** | **5.25** |
| Commercial units, new layout, >12–24 m | **3.5** | **3.6** |
| Commercial units, new layout, >24–45 m | **6.0** | **6.1** |

Shopping malls agree exactly in both chapters.

Chapter 5's figures are the internally consistent ones: 1.5 + 1.5 + 2.25 = 5.25 and
1.75 + 1.75 + 2.6 = 6.1 exactly, while Chapter 3's 5.0 and 6.0 decompose into no published
components. That suggests Chapter 3 is a rounded summary — an argument, not a resolution,
since nothing subordinates either chapter. Standing rule 4 applies and **the engine keeps
Chapter 3's lower ceiling**, so no project is told it may build more than the most
restrictive reading allows.

The split itself is now modelled (`src/domain/purchasable-far.ts`), because Chapter 9
prices purchasable and premium purchasable differently and the engine currently treats
everything above base as one lump. Wiring it into `resolveBaseFar` waits for Chapter 9,
which governs purchasable FAR generally.

**How the column mapping was proved.** The table has fourteen columns and only its header
row says which is which — one shared BFAR column, then four road bands of PFAR/PPFAR/MFAR
— and each data row wraps across two physical rows. Cells are matched to columns by x
coordinate, and the identity MFAR = BFAR + PFAR + PPFAR then closes on **all 72 band
checks across all seven such tables** in the chapters read so far. Three cells round:
1.75 + 0.9 + 0.9 = 3.55, printed as 3.6.

### V-015 — All seven printed BFAR/PFAR/PPFAR/MFAR tables are now loaded — RESOLVED
Eighteen rows across seven tables: group housing (4.2.8), affordable housing (4.4),
bazaar street (5.1.4), commercial units and malls (5.2.5), hotels in both area types
(5.3.5) and cinemas (5.4.4). The identity **MFAR = BFAR + PFAR + PPFAR** holds on all
**72 band checks**, which is what establishes that each table's fourteen columns were
mapped correctly.

The rows are **imported, not transcribed**: `tools/extract-purchasable-far.py` writes
`src/domain/data/purchasable-far.json` and the domain reads it, so a typo cannot disagree
with the gazette quietly. Eleven such tables exist in the full document; the remaining
four are in chapters 6 to 9.

Superseded by later chapters: sixteen tables and 43 rows are now loaded, across chapters 4
to 8.

Three structural features, each of which corrupts the reading if missed:

- **Clause 4.4 bands on 18 m**, not the 12 m every other table uses, and prints **two base
  FARs for one use** — 2.00 below an 18 m road, 2.25 at or above — against one shared set
  of band columns. Pairing the wrong base with a band fails the identity by exactly 2.0,
  which is how it was noticed rather than assumed. `baseFarApplies()` holds that rule.
- **Clause 5.4.4 prints no maximum at all** on the narrowest band for cinemas. That is a
  prohibition, not a gap: a cinema is not permitted below a 12 m road.
- Everywhere else the narrowest band offers **base FAR and nothing to buy** — `MFAR = BFAR`
  with PFAR and PPFAR marked NA.

### V-021 — A road minimum split by USE ZONE, a third dimension the engine has no field for
Clause 7.1.3 states the industrial road minimum by **use zone**, not by facility or area
type:

| Facility | Agriculture use zone | Industrial use zone |
|---|---|---|
| Industrial buildings | 7 m | 9 m |
| MSME units | 7 m | 9 m |
| Flatted factories | — | 12 m |
| Data centres | — | 12 m |

The engine has `built_up` / `non_built_up` and nothing for use zone, so `ind_light` and
`ind_general` hold the industrial-zone figure of 9 m — the commoner case and the stricter
of the two. `tools/extract-thresholds.py` captures the split as `{ byUseZone: … }` so the
data is there when the engine can carry it.

### V-022 — Farmhouses and dairy farms are fully specified and not modelled at all
Clauses 7.2 and 7.3 give both a complete rule set, and the engine has no occupancy for
either:

| | Farmhouse (7.2) | Dairy farm / gaushala (7.3) |
|---|---|---|
| Minimum plot | 4,000 m² | 1,000 m² |
| Access road | 7 m | 7 m |
| Ground coverage | after setbacks; non-farm activity ≤20% of plot | 20% of plot |
| FAR | 0.20 | 0.20 |
| Height | no restriction | no restriction |
| Setbacks | 9 m all sides for the non-farm building, guard room excepted | by plot area: ≥1000–4000 → 6 m, >4000–7000 → 9 m, >7000 → 10 m |

The dairy setback ladder is a **fourth** way the byelaws key a setback — after plot area,
building height and road width, now plot area again but for a use the engine does not
have. `tools/extract-thresholds.py` declines it with an accurate reason rather than
reading it as a road-access table.

### V-023 — Clause 7.1.5 prints a maximum FAR below its own base FAR
The worse of the two arithmetic defects. Flatted factories and data centres are given
**BFAR 3.00** with maxima of **NA / 2.00 / 3.50 / UR** — two of which are below the base,
which cannot be right whatever was intended.

The purchasable columns (0.50 / 0.50, then 1.00 / 1.50) are coherent only with a base of
**1.00**, and they are character for character the same as the secondary-school row in
Clause 6.2.4, which does carry 1.00. That looks like a copy from the education table.

Chapter 3 Sl. 2 and Sl. 3 give flatted factories and data centres base 3.0 with maxima of
3.0 / 6.0 / 9.0 / unrestricted, which is internally coherent and matches the shape of
Chapter 7's own MSME row. **The engine uses Chapter 3 and ignores this row.**

Chapter 7's MSME row also conflicts with Chapter 3 in the ordinary way — 10.50 against
9.0 above a 24 m road — which standing rule 4 resolves to Chapter 3's 9.0.

### V-018 — The gazette's own arithmetic fails in one place
The identity MFAR = BFAR + PFAR + PPFAR holds on **153 of 157** band checks across the
sixteen printed tables. This one is a drafting slip in Clause 6.2.4, and the pattern
makes it plain — every cell of the schools row scales by 1.2 from the built-up area to a
new layout:

| Band | Built-up (base 1.00) | New layout (base 1.20) | |
|---|---|---|---|
| Up to 12 m | 0.20 + 0.20 = 1.40 | 0.20 + 0.20 = **1.40** | not scaled; 0.24 / 0.24 / 1.68 expected |
| >12–24 m | 0.50 + 0.50 = 2.00 | 0.60 + 0.60 = 2.40 | scaled |
| >24–45 m | 1.00 + 1.00 = 3.00 | 1.20 + 1.20 = 3.60 | scaled |
| >45 m | 1.00 + 1.00 = 3.00 | 1.20 + 1.20 = 3.60 | scaled |

The narrowest band repeats the built-up figures verbatim. The engine honours **the printed
1.40**, which is lower than either the components (1.60) or the pattern (1.68) imply, so
standing rule 4 is satisfied by taking the gazette at its word. Recorded in
`GAZETTE_ARITHMETIC_DEFECTS`, and the test suite asserts that this is the **only**
unexplained arithmetic failure — a new one fails the build.

### V-019 — A road minimum that depends on plot size, which the engine cannot express
Clause 6.3.3 sets the marriage-hall road minimum at **18 m up to a 3000 m² plot and 24 m
above it**, and Clause 6.4.2 inverts the same idea — plot minimum keyed on road width,
1500 m² at 18 m and 2000 m² at 24 m. An occupancy carries one road figure, so
`inst_assembly` holds the lower 18 m. A 4000 m² marriage hall on a 20 m road would be
passed where the gazette asks for 24 m.

### V-020 — Two Chapter 3 tables need their own reading
`tools/extract-thresholds.py` skips both, loudly, rather than mangling them:

- **Clause 3.1.2's community-facility list** (p.41–42) is a two-level structure — numbered
  categories with lettered sub-items — covering education, medical, fire stations, sports,
  public toilets, bus stops, vending zones and landfill sites, in square metres, hectares
  and acres. Read as a flat table it produces subjects like "(a)".
- **Clause 3.1.3's internal-road table** (p.39) sizes the roads *inside* a layout by their
  length, not a plot's access by its use. Similar words, different rule.

### V-016 — Six cells conflict between Chapter 3 and the per-occupancy breakdowns
| Use | Area | Band | Chapter 3 | Breakdown |
|---|---|---|---|---|
| Group housing | built-up | 9–12 m | 2.0 | **2.1** (4.2.8) |
| Commercial units ≤100 m² | built-up | >24–45 m | 5.0 | **5.25** (5.2.5) |
| Commercial units ≤100 m² | new layout | >12–24 m | 3.5 | **3.6** (5.2.5) |
| Commercial units ≤100 m² | new layout | >24–45 m | 6.0 | **6.1** (5.2.5) |
| Shopping malls | new layout | >24–45 m | 9.0 | **10.5** (5.2.5) |
| Multiplex | new layout | >24–45 m | 9.0 | **10.5** (5.4.4) |

This **corrects an earlier claim in V-014** that shopping malls agreed in both chapters.
They agree in a built-up area (7.0 both ways) and disagree by 1.5 FAR in a new layout.

In every case the breakdown figure decomposes exactly into its own published components —
3.0 + 3.0 + 4.5 = 10.5 — and Chapter 3's does not, which suggests Chapter 3 is a rounded
summary. That is an argument, not a resolution. Standing rule 4 applies and the engine
keeps **Chapter 3's lower ceiling**.

Two apparent conflicts turned out not to be. Chapter 5 splits commercial units at 100 m²
where Chapter 3 has a single row; the ≤100 m² row matches Chapter 3 exactly and the
>100 m² row is a distinction Chapter 3 simply does not draw.

### V-017 — Five bands the breakdowns state and Chapter 3 omits
Silence is not prohibition where another clause makes the band reachable. Clause 4.2.3
permits group housing on a 12 m road in a new layout and Clause 5.3.3 permits a hotel of
up to 20 rooms on a 9 m road, so Chapter 3 having no row there is a gap, not a bar —
refusing those would reject a lawful project. Recorded in `CHAPTER_3_GAPS`, each with the
clause that makes it reachable. Two of the five (shopping malls below 12 m) are
unreachable in practice because Clause 5.2.3 sets a mall's minimum road at 18 m, and are
marked as such.

### (superseded by V-015 above)
`tools/extract-purchasable-far.py` finds **seven** BFAR/PFAR/PPFAR/MFAR tables in chapters
4 and 5 alone — group housing, affordable housing, bazaar street, commercial units,
hotels, cinemas. Only the commercial one is transcribed into the domain so far. Two
structural features found while extracting them:

- Clause 4.4's affordable-housing table bands on **18 m**, not the 12 m every other table
  uses, and prints **two base FARs for one use** — 2.00 below an 18 m road and 2.25 at or
  above it — against one shared set of band columns. Pairing the wrong base with a band
  makes the identity fail by exactly 2.0, which is how this was noticed rather than
  assumed.
- Clause 4's group housing gives a built-up maximum of **2.1** on the narrowest band where
  Chapter 3 gives **2.0**, and gives non-built-up group housing an **up-to-12 m band at
  3.5** where Chapter 3 prints no band below 12 m at all. Both need reconciling against
  Clause 4.2.3's 12 m minimum road before the engine changes. Not acted on yet.

### V-011 — Hotel thresholds turn on room count, which the engine cannot see
Clause 5.3.2 and 5.3.3 key the hotel minimums on the **number of rooms**, not the plot:
a minimum of six rooms; up to 20 rooms no minimum plot area and a 9 m road; above 20
rooms, 500 m² and a 12 m road. The engine holds only the above-20 figures, so it
over-states both for a small hotel. Fixing it needs a room count in `ProjectState`.

### V-012 — The bazaar-street ladder lists road widths, not bands
Clause 5.1.5 gives figures for roads of exactly 12, 18, 24, 30, 36, 45 and 76 m and says
nothing about anything between. The engine rounds up to the next listed width — the
stricter reading — and says so in the finding. Taking the largest listed width at or below
the actual road would give up to 1.5 m less front setback.

### V-013 — `com_shop` conflates two rows of the gazette
Clause 5.2.2 and 5.2.3 treat *Retail Shops* (>10–100 m², 6 m road built-up) and
*Convenient Shopping / Commercial Units* (≥100–300 m², **12 m** road) as separate
categories with different thresholds. The engine has one occupancy, "Retail shop /
convenience shopping", carrying the retail-shop figures — so a 200 m² convenience unit is
told it needs 6 m of road where the gazette asks for 12.

### V-005 — Occupancy thresholds are inferred — NOW MEASURED
The gazette states minimum plot size and road width **per facility**; the engine carries
one of each **per occupancy**. `tools/extract-thresholds.py` now extracts 36 rows across
10 tables into `docs/source/derived/thresholds.json`, so the gap is measured rather than
suspected.

Clause 6.1.2 and 6.1.3 are the clearest case:

| Facility | Min plot | Min road |
|---|---|---|
| Non-bedded medical establishment | 100 m² | 9 m |
| Nursing home, up to 50 beds | 300 m² | 12 m |
| Nursing institute | 2,000 m² | 18 m |
| Hospital over 50 beds | 3,000 m² | 18 m |
| Medical college | As per NMC / MCI norms | 24 m |

`inst_health` holds **500 m² and 12 m — a pair that matches none of the five**, and is not
even between the same two rows: 500 m² sits between the 300 and 2,000 m² facilities while
12 m is the figure for the 300 m² one. Education is the same shape, five facilities from
500 m² to 20,000 m² against one occupancy holding 1,000 m².

Closing this needs **sub-occupancies**, which is a change to the shape of the engine rather
than to a number, so the data is exposed and the gap stated rather than one figure being
quietly declared right. The test suite asserts the mismatch, so it cannot be forgotten.

Two smaller things the extraction settled. The two tables on a page name the same facility
differently — "Primary" against "Primary School" — so they are paired by prefix within one
page and both printed names are kept. And Clause 6.2.3 splits the **primary school** road
minimum by area type: 9 m built-up, 12 m in a new layout.

### (superseded by V-005 above)
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
