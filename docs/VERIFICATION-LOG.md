# Verification log

Every figure in `src/domain` was transcribed without access to the gazette. On
2026-09-10 the authoritative document arrived (TMPR8, 4/9/25 version, Housing & Urban
Planning Department). This records what was checked against it and what came back.

**Headline: ten transcriptions verified exactly right, and twenty-two real bugs found.**

The plan for reading the remaining chapters is in `docs/VERIFICATION-STRATEGY.md`.

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

---

## Still open

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

### V-008 — Clause 15.3 states permissibility in colour, and the text pipeline lost all of it
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

### V-003 — Ten occupancies still read a table written for shops
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

### V-006 — The thirteen non-compoundable bars are modelled but not collected
`NonCompoundableFlags` carries all thirteen offences at 16.1.3 and each one ends the
assessment. Nothing in the app sets them: whether the plot is disputed, whether the Fire
NOC was obtained, whether the land is a filled pond are facts about the site and its
clearances, not about the drawing. Advanced mode has to ask. Until it does, the fee is
quoted on the assumption that none of the thirteen applies, and that assumption is
stated in the caveats.

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

Three structural features, each of which corrupts the reading if missed:

- **Clause 4.4 bands on 18 m**, not the 12 m every other table uses, and prints **two base
  FARs for one use** — 2.00 below an 18 m road, 2.25 at or above — against one shared set
  of band columns. Pairing the wrong base with a band fails the identity by exactly 2.0,
  which is how it was noticed rather than assumed. `baseFarApplies()` holds that rule.
- **Clause 5.4.4 prints no maximum at all** on the narrowest band for cinemas. That is a
  prohibition, not a gap: a cinema is not permitted below a 12 m road.
- Everywhere else the narrowest band offers **base FAR and nothing to buy** — `MFAR = BFAR`
  with PFAR and PPFAR marked NA.

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
