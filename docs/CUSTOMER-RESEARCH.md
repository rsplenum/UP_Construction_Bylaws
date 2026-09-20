# What the people we are building for actually do

*A survey of the tools they use instead of ours, the advice they are given, and what the
category has already worked out. September 2026.*

---

## The finding that reframes it

We have been asking whether our calculator is good. The category settled that question a
while ago: **everyone has a calculator, and the one that wins tells you which rule stops
you first.**

Studio Matrx — the closest thing to a direct competitor — sells on exactly that phrase:
enter a plot area, get "permitted built-up area, ground footprint, floors and **which
bylaw binds first**", for twelve Indian cities. Deepblocks pitches "instant understanding
of what is possible". Symbium's homeowner product asks for one thing, an address, and
answers from there. The UK's Planning Portal answers "do I need permission" through an
interactive house you click rather than a form you fill.

Every one of them leads with the answer. We compute `BuildablePlan.binding` — the
constraint that actually stopped the building — and we do not show it anywhere.

So our differentiator cannot be "we calculate FAR". It has to be the thing none of them
can do, because none of them models one state to the clause: **we can contradict the
advice the category repeats, and cite the line.**

---

## What the category tells buyers, and what is actually true in UP

A plot-buying checklist aimed at Indian buyers states it flatly, as received wisdom:

> In every Indian city, road width drives everything: FSI, landowner share, building
> height.

That is false in Uttar Pradesh for a house, and we can prove it. Sweeping every plot area
in our engine against every road width from 4.5 m to 45 m, for both uses:

| | Floor area | Floors | Height | Ceiling |
|---|---|---|---|---|
| **A house, 4.5 m road to 45 m road** | unchanged | unchanged | unchanged | unchanged |
| **A shop or office, under the minimum ROW** | nothing may be built at all | — | — | — |
| **A shop or office, under 12 m** | base only | | | no purchased FAR at any price |

Base FAR is a property of the occupancy and the area type, not of the road (`far.ts`), and
plotted residential tops out at a flat 2.0 at every width. A wider road buys a house
nothing. "Wider road, more FAR" is a commercial rule that gets repeated about houses, and
a buyer who pays a premium for the wide-road plot to build a house has paid for nothing
the byelaws will give them.

For a shop or an office the road is a **gate before it is a ladder**: below the
occupancy's minimum right of way nothing may be built; below 12 m no extra FAR may be
bought at any price (Clause 9.2.1(ii)). A commercial complex on a 9 m road cannot be built
at all — and that appears on no listing.

This is the most valuable thing we know. It is now on the comparison screen. It should be
the thing the product is known for.

---

## Seven findings, and what each one costs us

### 1. The category is answer-first. We are still, just barely, form-first.

Symbium asks for an address. Studio Matrx asks for a plot area. We open with a column of
fields beside the answer. The plot screen now leads with a verdict, which was the right
move; the remaining gap is that the form is still visible and co-equal at first glance.

### 2. "Which rule binds first" is table stakes, and we have it and hide it.

The engine knows whether the building was stopped by FAR, by ground coverage, by setbacks
or by the height cap. A competitor's entire marketing line is that sentence. Ours is in a
field nobody renders.

### 3. Unit confusion is real, costly, and wider than gaj.

> A local dealer may quote in gaj, the registry may record in square metres, and your loan
> file may use square feet. […] Small errors in unit conversion can cost you thousands of
> rupees.

We shipped gaj / sq ft / m² first, then **biswa**, which is 151.25 gaj and means the same
thing across Uttar Pradesh.

**The bigha is deliberately not a unit**, and the first draft of this memo got it wrong.
It quoted ≈17,424 sq ft as the UP bigha; that is Rajasthan's kachha bigha. Inside UP the
bigha runs from **5 biswa** (much of the west, 6,806.25 sq ft) through **6⅔ biswa** (some
western districts, 9,075 sq ft) to **20 biswa** (eastern UP, Purvanchal and Lucknow —
the pucca bigha, 27,225 sq ft). A spread of four to one, inside the one state we serve.

Putting "bigha" in a unit picker would mean choosing one of those silently, and a plot
entered at a quarter or four times its true size produces a confident, fully cited answer
about a building that cannot be built. So a bigha is converted only after the reader says
which bigha they were quoted, and the answer is given in biswa.

### 4. Mobile is the device, and our layout is a desktop layout.

Indian property research is phone-first, and the recurring usability complaint about
property sites is that plans and drawings are unusable on a phone. Our two plan drawings
sit side by side in a `md:grid-cols-2`, and our verdict type is sized off viewport width.
Below 768 px the drawings stack, which is right, but nothing has been designed for the
phone — it has only been allowed to reflow.

### 5. Hindi is not a nice-to-have for these particular cities.

The advice is specific about Lucknow among others: Hindi alongside English materially
improves reach. Every statutory term we use — *naksha*, *shamniyakaran*, *gaj* — is a Hindi
word that the interface currently prints in English only.

### 6. Buyers are told to establish jurisdiction first, and we never say what we cover.

The first item on the serious checklists is: confirm which authority has jurisdiction,
because that determines which FAR, setback and approval regime applies. We are a UP
Development Authority tool and we never say so on the screen. A reader in Ghaziabad cannot
tell whether we apply to them.

### 7. The category's weakness is being contradicted by an architect.

Generic calculators miss local definitions of floor area, special districts, and rules that
bind before FAR does — so a professional overrules them and the tool loses. Our clause
citations are the whole answer to this, and they are currently styled as footnotes.

---

## What construction actually costs, if we want to price the answer

Third-party 2026 figures, **not gazette** and to be labelled as such wherever shown:

| | ₹ per sq ft, standard quality |
|---|---|
| Uttar Pradesh, baseline turnkey | ~1,800 |
| Lucknow | 1,550–2,048 |
| Noida / Greater Noida | ~2,300 |

Range across quality: roughly ₹1,400–2,100/sq ft standard, to ₹43 L for premium finishes
on a 1,000 sq ft house. Western UP runs higher on labour for its proximity to Delhi.

"331 m² across 3 floors" is an abstraction. "331 m², about ₹64 lakh to build at Lucknow
rates" is a decision. The figure must carry its source and its year, and must never sit in
the same visual register as a gazette figure.

---

## The technique has a name

What has been asked for repeatedly here — *simple but potent*, *stop making me read four
clauses before the answer* — is **progressive disclosure**, named by Nielsen in 1995:
show only what is needed to act, keep the rest one gesture away.

We have been applying it by instinct, case by case, and getting it right late. The route
conditions above the verdict were a clear violation; folding them fixed it. It is worth
stating as the project's rule rather than rediscovering it per screen.

---

## Sources

- Studio Matrx, *FAR / FSI Calculator — How Much Can You Build?*
- Symbium Build; Symbium, *Accelerated Permitting with Compliance Checks*
- Deepblocks
- Planning Portal (UK), *Interactive House*
- 1acre.in, *The JDA-Ready Checklist*; OnGrid, *7 Questions Before Buying Land*; NoBroker,
  *10-Point Checklist Before Buying a Plot*
- L&T Realty and Godrej Properties, land measurement unit guides; *Bigha* (Wikipedia)
- NoBroker, Infralens, IndiaLandConverter — Lucknow / Noida construction cost, 2026
- Nielsen Norman Group, *Progressive Disclosure*
- The UP figures in "what is actually true" are from this repository's own engine, swept
  and checked against `docs/source/gazette/`; they are not from any source above.
