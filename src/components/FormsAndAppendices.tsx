import React, { useState } from 'react';
import { AlertTriangle, FileCheck, Printer } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  assessSustainability, getOccupancy, RWH_PLOT_AREA_SQM, SOLAR_PV_PLOT_AREA_SQM,
} from '../domain';

/**
 * Statutory forms, filled from the shared project.
 *
 * Two things changed here. The fields used to ship pre-filled with invented people —
 * including a fabricated architect council registration number — on a form intended for
 * submission to a Development Authority; they now start empty with placeholders. And the
 * compliance checklist used to print "Compliant" and "Installed" unconditionally, even
 * for a project the audit had flagged; it now reads the project.
 */
export const FormsAndAppendices: React.FC = () => {
  const { project, patch } = useProject();
  const [selectedForm, setSelectedForm] = useState<string>('form_a');
  const occupancy = getOccupancy(project.occupancy);

  const {
    applicantName,
    plotNumber,
    schemeName,
    cityName,
    architectName,
    engineerName,
    plotArea,
  } = project;

  const setApplicantName = (v: string) => patch({ applicantName: v });
  const setPlotNumber = (v: string) => patch({ plotNumber: v });
  const setSchemeName = (v: string) => patch({ schemeName: v });
  const setCityName = (v: string) => patch({ cityName: v });
  const setArchitectName = (v: string) => patch({ architectName: v });
  const setEngineerName = (v: string) => patch({ engineerName: v });

  // Checklist rows reflect the project rather than asserting compliance unconditionally,
  // and the thresholds come from the domain rather than being restated here. Chapter 13
  // gives the two solar systems different triggers: photovoltaics on plot size, water
  // heating on the building category (B-035).
  const green = assessSustainability({
    plotAreaSqm: plotArea,
    builtUpAreaSqm: project.proposedBuiltUpArea,
    occupancyId: project.occupancy,
    occupancyGroup: occupancy.group,
    occupancyLabel: occupancy.label,
    hasRainwaterHarvesting: project.hasRWH,
    hasSolarPv: project.hasSolarPv,
    hasSolarWaterHeating: project.hasSolarHeating,
  });
  const rwhRequired = green.rainwater.required;
  const pvRequired = green.solarPv.required;
  const solarRequired = green.solarWaterHeating.required;
  const checklist = [
    {
      item: '7.1 Setbacks (front / rear / sides)',
      provision: 'As per Chapter 3.2.4.1',
      status: `Front ${project.frontSetbackProvided}m · Rear ${project.rearSetbackProvided}m · Sides ${project.side1Provided}m / ${project.side2Provided}m`,
      ok: true,
    },
    {
      item: '7.3(e) Rainwater harvesting system',
      provision: `Clause 13.1.2 — mandatory on plots of ${RWH_PLOT_AREA_SQM} sqm and more`,
      status: rwhRequired ? (project.hasRWH ? 'Installed' : 'NOT PROVIDED — required') : 'Not applicable',
      ok: !rwhRequired || project.hasRWH,
    },
    {
      // No form item number: 7.3(e) and (f) are the form's own, and this row is a
      // requirement of the byelaws that the form does not itemise. Inventing "(g)" would
      // put a number on a statutory form that the form does not carry.
      item: 'Solar photovoltaic power generation',
      provision: `Clause 13.2.3.1 — mandatory on plots of ${SOLAR_PV_PLOT_AREA_SQM} sqm and above`,
      status: pvRequired ? (project.hasSolarPv ? 'Installed' : 'NOT PROVIDED — required') : 'Not applicable',
      ok: !pvRequired || project.hasSolarPv,
    },
    {
      item: '7.3(f) Solar water heating plant',
      provision: 'Clause 13.2.3.2 — mandatory for hotels, hospitals, schools and assembly buildings with a hot water system',
      status: solarRequired ? (project.hasSolarHeating ? 'Installed' : 'NOT PROVIDED — required') : 'Not applicable',
      ok: !solarRequired || project.hasSolarHeating,
    },
    {
      item: 'Landscape plan — tree plantation',
      provision: `${green.trees.clause} — ${green.trees.rate}`,
      status: `${green.trees.trees} ${green.trees.trees === 1 ? 'tree' : 'trees'} to be shown`,
      ok: true,
    },
  ];

  const unsignedFields = [
    !applicantName.trim() && 'applicant name',
    !plotNumber.trim() && 'plot / khasra number',
    !architectName.trim() && 'supervising architect',
  ].filter(Boolean) as string[];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 dark:bg-[#161617] dark:border-white/[0.10]">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Official Appendices & Statutory Forms (Appendices 2 – 14)
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl dark:text-slate-400">
            Direct transcription of statutory applications, completion certificates (Forms A, B, C, D), Structural Design Basis Reports (SDBR), and affidavits as prescribed by UP Urban Planning and Development Act, 1973.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors self-start md:self-auto shadow dark:bg-black"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export Form</span>
        </button>
      </div>

      {/* Form Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { id: 'form_a', label: 'Form-A (Residential >300m²)' },
          { id: 'form_b', label: 'Form-B (Group Housing/Malls)' },
          { id: 'form_d', label: 'Form-D (Layout Completion)' },
          { id: 'sdbr', label: 'Appendix-14 (SDBR Report)' },
          { id: 'app_8', label: 'Appendix-8 (EQ Schedule)' },
          { id: 'app_12', label: 'Appendix-12 (Plinth Affidavit)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedForm(tab.id)}
            className={`p-2.5 rounded-lg text-xs font-semibold text-center border transition-all ${
              selectedForm === tab.id
                ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#161617] dark:text-slate-300 dark:border-white/[0.10] dark:hover:bg-white/[0.06]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editable Project Inputs for Live Fill */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 dark:bg-white/[0.04] dark:border-white/[0.10]">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block dark:text-slate-100">
          Live Form Autofill Inputs:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label htmlFor="forms-and-appendices-applicant-name" className="text-slate-600 block mb-1 dark:text-slate-400">Applicant Name</label>
            <input id="forms-and-appendices-applicant-name"
              type="text"
              value={applicantName}
              placeholder="Full name as on the title deed"
              onChange={(e) => setApplicantName(e.target.value)}
              className="w-full bg-white border rounded p-1.5 dark:bg-[#161617]"
            />
          </div>
          <div>
            <label htmlFor="forms-and-appendices-plot-khasra-no" className="text-slate-600 block mb-1 dark:text-slate-400">Plot / Khasra No.</label>
            <input id="forms-and-appendices-plot-khasra-no"
              type="text"
              value={plotNumber}
              placeholder="e.g. Plot 42-B, Sector 7"
              onChange={(e) => setPlotNumber(e.target.value)}
              className="w-full bg-white border rounded p-1.5 dark:bg-[#161617]"
            />
          </div>
          <div>
            <label htmlFor="forms-and-appendices-scheme-city" className="text-slate-600 block mb-1 dark:text-slate-400">Scheme / City</label>
            <input id="forms-and-appendices-scheme-city"
              type="text"
              value={schemeName}
              placeholder="e.g. Gomti Nagar Extension"
              onChange={(e) => setSchemeName(e.target.value)}
              className="w-full bg-white border rounded p-1.5 dark:bg-[#161617]"
            />
          </div>
          <div>
            <label htmlFor="forms-and-appendices-supervising-architect" className="text-slate-600 block mb-1 dark:text-slate-400">Supervising Architect</label>
            <input id="forms-and-appendices-supervising-architect"
              type="text"
              value={architectName}
              placeholder="Name and CoA registration number"
              onChange={(e) => setArchitectName(e.target.value)}
              className="w-full bg-white border rounded p-1.5 dark:bg-[#161617]"
            />
          </div>
        </div>
      </div>

      {unsignedFields.length > 0 && (
        <div
          role="status"
          className="mx-auto flex max-w-4xl items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 print:hidden dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>
            <strong>Incomplete draft.</strong> Fill in the {unsignedFields.join(', ')} above before printing. This
            portal never invents applicant, architect or registration details — a form printed with blanks is a draft,
            not a submission.
          </span>
        </div>
      )}

      {/* Document Sheet Display */}
      <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md max-w-4xl mx-auto text-slate-900 font-serif leading-relaxed printable-document space-y-6 dark:bg-[#161617] dark:border-white/[0.14] dark:text-white">
        {selectedForm === 'form_a' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="text-center border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold font-sans tracking-wide">
                APPENDIX-7: APPLICATION FORM-A (B.2.9.2)
              </h2>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                Application for Completion Certificate of Residential Building (&gt; 300 sqm.)
              </h3>
              <p className="text-xs text-slate-600 font-sans dark:text-slate-400">
                Under Section 15A of Uttar Pradesh Urban Planning and Development Act, 1973
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-sans font-semibold text-slate-700 dark:text-slate-300">To, The Vice Chairman, {cityName} Development Authority</p>
              <div className="grid grid-cols-2 gap-4 border p-3 rounded bg-slate-50/50 font-sans text-xs dark:bg-white/[0.06]">
                <div>
                  <strong>1. Applicant Name:</strong> {applicantName}
                </div>
                <div>
                  <strong>2. Plot & Scheme:</strong> {plotNumber}, {schemeName}
                </div>
                <div>
                  <strong>3. Area of Plot:</strong> {plotArea} sq.m.
                </div>
                <div>
                  <strong>4. Permissible Use:</strong> Residential Plotted Dwelling
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100">5. Mandatory Compliance Checklist (Clause 7):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 font-sans text-xs dark:border-white/[0.14]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-white/[0.08]">
                        <th className="border border-slate-300 p-2 dark:border-white/[0.14]">Item</th>
                        <th className="border border-slate-300 p-2 dark:border-white/[0.14]">Provision</th>
                        <th className="border border-slate-300 p-2 text-center dark:border-white/[0.14]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklist.map((row) => (
                        <tr key={row.item}>
                          <td className="border border-slate-300 p-2 font-medium dark:border-white/[0.14]">{row.item}</td>
                          <td className="border border-slate-300 p-2 dark:border-white/[0.14]">{row.provision}</td>
                          <td
                            className={`border border-slate-300 p-2 text-center font-semibold dark:border-white/[0.14] ${
                              row.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {row.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <p>
                  <strong>Certificate of Licensed Architect/Engineer (Part-B):</strong><br />
                  I have inspected the building located at {plotNumber} of {applicantName} and certify that the constructed building complies strictly with the approved building plan and the Uttar Pradesh Building Construction and Development Byelaws 2025.
                </p>
                <div className="flex justify-between pt-6 font-sans text-xs">
                  <div>
                    <p className="border-t border-slate-400 pt-1">Signature of Applicant</p>
                    <p className="font-semibold">{applicantName}</p>
                  </div>
                  <div>
                    <p className="border-t border-slate-400 pt-1">Licensed Architect / Engineer</p>
                    <p className="font-semibold">{architectName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedForm === 'form_b' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="text-center border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold font-sans tracking-wide">
                APPENDIX-7: APPLICATION FORM-B (B.2.9.2)
              </h2>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                Application for Completion Certificate of Group Housing, Commercial and Multi-Storey Buildings
              </h3>
            </div>
            <div className="space-y-3 font-sans text-xs">
              <p>Mandatory Enclosures for Form-B:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                <li><strong>Clause 8:</strong> Certificate of completeness of firefighting system from Chief Fire Officer (CFO).</li>
                <li><strong>Clause 9(f):</strong> Certificate of completion of lift from Chief Electrical Inspector, Uttar Pradesh.</li>
                <li><strong>Clause 12:</strong> Rainwater Harvesting System certificate from Licensed Technical Person.</li>
                <li><strong>Appendix-11:</strong> Joint structural safety certificate signed by Owner, LTP, and Site Engineer.</li>
              </ul>
              <div className="flex justify-between pt-10 font-sans text-xs">
                <div>
                  <p className="border-t border-slate-400 pt-1">Signature of Builder/Owner</p>
                </div>
                <div>
                  <p className="border-t border-slate-400 pt-1">Structural Engineer / Architect</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedForm === 'form_d' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="text-center border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold font-sans tracking-wide">
                APPENDIX-4: APPLICATION FORM-D (B.2.9.1)
              </h2>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                Application for Completion Certificate of Layout Plan (Sub-division)
              </h3>
            </div>
            <div className="space-y-3 font-sans text-xs">
              <p>Requires detailed feature status comparison:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 border rounded bg-slate-50 dark:bg-white/[0.04]">Primary / High Schools</div>
                <div className="p-2 border rounded bg-slate-50 dark:bg-white/[0.04]">Dispensaries & Hospitals</div>
                <div className="p-2 border rounded bg-slate-50 dark:bg-white/[0.04]">Parks & Miyawaki Green</div>
                <div className="p-2 border rounded bg-slate-50 dark:bg-white/[0.04]">Sewerage & Water Grids</div>
              </div>
            </div>
          </div>
        )}

        {selectedForm === 'sdbr' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="text-center border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold font-sans tracking-wide">
                APPENDIX-14: STRUCTURAL DESIGN BASIS REPORT (SDBR - B.11.7)
              </h2>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                Mandatory Structural Design Document in 4 Parts
              </h3>
            </div>
            <div className="space-y-4 font-sans text-xs">
              <div className="p-3 border rounded bg-slate-50 dark:bg-white/[0.04]">
                <div className="font-bold text-slate-800 dark:text-slate-100">Part 1: General Data & Seismic Codes</div>
                <p className="text-slate-600 mt-1 dark:text-slate-400">
                  Seismic Zone (IS:1893:2002), Zone Factor (Z), Importance Factor (I), Response Reduction (R), Soil Profile (IS:1904), Wind Loads (IS:875 Part 3).
                </p>
              </div>
              <div className="p-3 border rounded bg-slate-50 dark:bg-white/[0.04]">
                <div className="font-bold text-slate-800 dark:text-slate-100">Part 2: Load Bearing Masonry</div>
                <p className="text-slate-600 mt-1 dark:text-slate-400">
                  Building Category as per IS:4326, Mortar Mix, Lintel & Plinth Seismic Bands.
                </p>
              </div>
              <div className="p-3 border rounded bg-slate-50 dark:bg-white/[0.04]">
                <div className="font-bold text-slate-800 dark:text-slate-100">Part 3: Reinforced Concrete Framed Buildings</div>
                <p className="text-slate-600 mt-1 dark:text-slate-400">
                  Ductile detailing under IS:13920, soft storey column design, foundation raft/piles, concrete grades.
                </p>
              </div>
              <div className="p-3 border rounded bg-slate-50 dark:bg-white/[0.04]">
                <div className="font-bold text-slate-800 dark:text-slate-100">Part 4: Structural Steel Buildings</div>
                <p className="text-slate-600 mt-1 dark:text-slate-400">
                  Design method (IS:800 Cl 3.4), deflection limits, corrosion protection, fire rating.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedForm === 'app_8' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="text-center border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold font-sans tracking-wide">
                APPENDIX-8: BUILDING INFORMATION SCHEDULE (B.11.8.2)
              </h2>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                Mandatory Earthquake Resilient Construction Schedule
              </h3>
            </div>
            <p className="font-sans text-xs text-slate-700 dark:text-slate-300">
              Must be permanently marked on the architectural plan as a schedule table and certified by the registered Structural Engineer verifying compliance with IS:1893, IS:4326, IS:13920, and NBC 2016 Part 6.
            </p>
          </div>
        )}

        {selectedForm === 'app_12' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="text-center border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold font-sans tracking-wide">
                APPENDIX-12: AFFIDAVIT FOR PLINTH LEVEL CLEARANCE (B.2.2.1)
              </h2>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                Mandatory Geo-Tagged Affidavit upon Reaching Plinth Level
              </h3>
            </div>
            <div className="space-y-3 font-sans text-xs">
              <p>
                I, <strong>{applicantName}</strong>, hereby declare under oath that the construction of {plotNumber} has reached plinth level strictly according to the sanctioned plan. I attach GPS coordinates, digital timestamped photographs of the site. I acknowledge that if any unauthorized construction is found, the authority reserves the right to seal the structure within 7 working days.
              </p>
              <div className="pt-6">
                <p className="border-t border-slate-400 pt-1 w-48 text-center">Deponent / Affiant</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
