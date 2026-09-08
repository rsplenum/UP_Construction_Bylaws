import React, { useState } from 'react';
import { FileCheck, Printer, Download, CheckCircle, FileText, Landmark, ShieldCheck } from 'lucide-react';

export const FormsAndAppendices: React.FC = () => {
  const [selectedForm, setSelectedForm] = useState<string>('form_a');

  // Interactive form fields
  const [applicantName, setApplicantName] = useState('Rajesh Sharma');
  const [plotNumber, setPlotNumber] = useState('Plot No. 42-B, Sector 7');
  const [schemeName, setSchemeName] = useState('Gomti Nagar Extension');
  const [cityName, setCityName] = useState('Lucknow');
  const [plotArea, setPlotArea] = useState('320');
  const [architectName, setArchitectName] = useState('Ar. Vivek Kumar (CA/2018/98765)');
  const [engineerName, setEngineerName] = useState('Er. Sunil Verma, M.Tech (Structures)');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Official Appendices & Statutory Forms (Appendices 2 – 14)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Direct transcription of statutory applications, completion certificates (Forms A, B, C, D), Structural Design Basis Reports (SDBR), and affidavits as prescribed by UP Urban Planning and Development Act, 1973.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors self-start md:self-auto shadow"
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
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editable Project Inputs for Live Fill */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Live Form Autofill Inputs:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-500 block mb-1">Applicant Name</label>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="w-full bg-white border rounded p-1.5"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Plot / Khasra No.</label>
            <input
              type="text"
              value={plotNumber}
              onChange={(e) => setPlotNumber(e.target.value)}
              className="w-full bg-white border rounded p-1.5"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Scheme / City</label>
            <input
              type="text"
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              className="w-full bg-white border rounded p-1.5"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Supervising Architect</label>
            <input
              type="text"
              value={architectName}
              onChange={(e) => setArchitectName(e.target.value)}
              className="w-full bg-white border rounded p-1.5"
            />
          </div>
        </div>
      </div>

      {/* Document Sheet Display */}
      <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md max-w-4xl mx-auto text-slate-900 font-serif leading-relaxed printable-document space-y-6">
        {selectedForm === 'form_a' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="text-center border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold font-sans tracking-wide">
                APPENDIX-7: APPLICATION FORM-A (B.2.9.2)
              </h2>
              <h3 className="font-semibold text-slate-700">
                Application for Completion Certificate of Residential Building (&gt; 300 sqm.)
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Under Section 15A of Uttar Pradesh Urban Planning and Development Act, 1973
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-sans font-semibold text-slate-700">To, The Vice Chairman, {cityName} Development Authority</p>
              <div className="grid grid-cols-2 gap-4 border p-3 rounded bg-slate-50/50 font-sans text-xs">
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
                <h4 className="font-sans font-bold text-slate-800">5. Mandatory Compliance Checklist (Clause 7):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2">Item</th>
                        <th className="border border-slate-300 p-2">Provision</th>
                        <th className="border border-slate-300 p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium">7.1 Setbacks (Front / Rear / Sides)</td>
                        <td className="border border-slate-300 p-2">As per Chapter 3.2.4.1</td>
                        <td className="border border-slate-300 p-2 text-center text-emerald-700 font-bold">Compliant</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium">7.3(e) Rainwater Harvesting System</td>
                        <td className="border border-slate-300 p-2">Mandatory for plots &gt; 300 sqm</td>
                        <td className="border border-slate-300 p-2 text-center text-emerald-700 font-bold">Installed (Attached Part-C)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium">7.3(f) Solar Water Heating Plant</td>
                        <td className="border border-slate-300 p-2">Mandatory if plot area &gt; 500 sqm</td>
                        <td className="border border-slate-300 p-2 text-center text-slate-600">N/A (Plot &lt; 500 sqm)</td>
                      </tr>
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
              <h3 className="font-semibold text-slate-700">
                Application for Completion Certificate of Group Housing, Commercial and Multi-Storey Buildings
              </h3>
            </div>
            <div className="space-y-3 font-sans text-xs">
              <p>Mandatory Enclosures for Form-B:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
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
              <h3 className="font-semibold text-slate-700">
                Application for Completion Certificate of Layout Plan (Sub-division)
              </h3>
            </div>
            <div className="space-y-3 font-sans text-xs">
              <p>Requires detailed feature status comparison:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 border rounded bg-slate-50">Primary / High Schools</div>
                <div className="p-2 border rounded bg-slate-50">Dispensaries & Hospitals</div>
                <div className="p-2 border rounded bg-slate-50">Parks & Miyawaki Green</div>
                <div className="p-2 border rounded bg-slate-50">Sewerage & Water Grids</div>
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
              <h3 className="font-semibold text-slate-700">
                Mandatory Structural Design Document in 4 Parts
              </h3>
            </div>
            <div className="space-y-4 font-sans text-xs">
              <div className="p-3 border rounded bg-slate-50">
                <div className="font-bold text-slate-800">Part 1: General Data & Seismic Codes</div>
                <p className="text-slate-600 mt-1">
                  Seismic Zone (IS:1893:2002), Zone Factor (Z), Importance Factor (I), Response Reduction (R), Soil Profile (IS:1904), Wind Loads (IS:875 Part 3).
                </p>
              </div>
              <div className="p-3 border rounded bg-slate-50">
                <div className="font-bold text-slate-800">Part 2: Load Bearing Masonry</div>
                <p className="text-slate-600 mt-1">
                  Building Category as per IS:4326, Mortar Mix, Lintel & Plinth Seismic Bands.
                </p>
              </div>
              <div className="p-3 border rounded bg-slate-50">
                <div className="font-bold text-slate-800">Part 3: Reinforced Concrete Framed Buildings</div>
                <p className="text-slate-600 mt-1">
                  Ductile detailing under IS:13920, soft storey column design, foundation raft/piles, concrete grades.
                </p>
              </div>
              <div className="p-3 border rounded bg-slate-50">
                <div className="font-bold text-slate-800">Part 4: Structural Steel Buildings</div>
                <p className="text-slate-600 mt-1">
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
              <h3 className="font-semibold text-slate-700">
                Mandatory Earthquake Resilient Construction Schedule
              </h3>
            </div>
            <p className="font-sans text-xs text-slate-700">
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
              <h3 className="font-semibold text-slate-700">
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
