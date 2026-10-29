import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import {
  FileCheck,
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Layers,
  Cpu
} from 'lucide-react';
import '../styles/AtsModal.css';

export default function AtsResumeModal({ open, onClose, optimizationResult, job, user }) {
  if (!open || !optimizationResult) return null;

  const [downloading, setDownloading] = useState(false);
  const resumePrintRef = useRef(null);

  const { mathEngine, tailoredResume, candidateName } = optimizationResult;
  const personal = tailoredResume?.personalInfo || {};
  const links = tailoredResume?.links || {};
  const skills = tailoredResume?.categorizedSkills || {};

  const handleDownloadPdf = () => {
    if (!resumePrintRef.current) return;
    setDownloading(true);

    const safeTitle = (job.job_title || 'Role')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 25);
    const fileName = `${candidateName || 'Candidate'}_ATS_Resume_${safeTitle}.pdf`;

    const opt = {
      margin: [10, 12, 10, 12],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf()
      .set(opt)
      .from(resumePrintRef.current)
      .save()
      .then(() => {
        setDownloading(false);
      })
      .catch((err) => {
        console.error('PDF export error:', err);
        setDownloading(false);
      });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ats-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ats-modal-header">
          <div className="ats-modal-title-block">
            <div className="ats-modal-icon-badge">
              <FileCheck size={20} />
            </div>
            <div>
              <h2>Vector Embedded ATS Resume Generator</h2>
              <p>Target Role: {job.job_title} at {job.employer_name || 'Hiring Company'}</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="btn-close-modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="ats-modal-body">
          {/* Math Score Banner */}
          <div className="math-score-banner">
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: '#ffffff' }}>
                ATS Match Engine Verdict
              </h3>
              <p style={{ fontSize: '13px', color: '#a1a1aa' }}>
                Evaluated against {mathEngine?.totalScanned || 0} critical requirements from the Job Description.
              </p>
            </div>

            <div className="score-compare-boxes">
              <div className="score-box before">
                <div className="score-val">{mathEngine?.baselineScore || 50}%</div>
                <div className="score-lbl">Current Match</div>
              </div>

              <ArrowRight className="score-arrow" size={24} />

              <div className="score-box after">
                <div className="score-val">{mathEngine?.targetPotentialScore || 95}%</div>
                <div className="score-lbl">Optimized Match</div>
              </div>
            </div>
          </div>

          {/* Math Gaps Breakdown */}
          <div className="math-gaps-section">
            <div className="gap-card missing">
              <h4>
                <AlertTriangle size={18} />
                Missing Critical Keywords ({mathEngine?.missingKeywords?.length || 0})
              </h4>
              <p style={{ fontSize: '12px', marginBottom: '10px', color: '#7f1d1d' }}>
                Identified from the target job posting and injected into your competencies & bullets:
              </p>
              <div className="gap-pill-list">
                {mathEngine?.missingKeywords?.length > 0 ? (
                  mathEngine.missingKeywords.map((kw, i) => (
                    <span key={i} className="gap-pill missing-pill">
                      ✗ {kw}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px' }}>All primary keywords satisfied!</span>
                )}
              </div>
            </div>

            <div className="gap-card matched">
              <h4>
                <CheckCircle2 size={18} />
                Verified Matching Skills ({mathEngine?.matchedKeywords?.length || 0})
              </h4>
              <p style={{ fontSize: '12px', marginBottom: '10px', color: '#14532d' }}>
                Already confirmed present in your uploaded profile:
              </p>
              <div className="gap-pill-list">
                {mathEngine?.matchedKeywords?.map((kw, i) => (
                  <span key={i} className="gap-pill matched-pill">
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Vector Routing Explanation Bar */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', marginBottom: '4px', color: '#15803d' }}>
              <Cpu size={16} />
              Vector Semantic Placement & Deduplication Active:
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {tailoredResume?.gapAnalysis?.matchExplanation}
            </p>
          </div>

          {/* Universal ATS Resume Sheet - 100% Parsable */}
          <div ref={resumePrintRef} className="ats-resume-sheet">
            {/* Header: Name, Contact, Clean Links */}
            <div className="sheet-header">
              <div className="sheet-candidate-name">{personal.fullName || candidateName}</div>
              <div className="sheet-headline">{personal.headline}</div>
              <div style={{ fontSize: '12px', marginTop: '6px', color: '#262626' }}>
                {personal.email} {personal.phone ? `| ${personal.phone}` : ''} | {personal.location}
              </div>

              {/* Verified Links (LinkedIn, GitHub, Portfolio) */}
              <div style={{ fontSize: '11.5px', marginTop: '4px', display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {links.linkedin && <span>LinkedIn: {links.linkedin}</span>}
                {links.github && <span>GitHub: {links.github}</span>}
                {links.portfolio && <span>Portfolio: {links.portfolio}</span>}
              </div>
            </div>

            {/* Summary */}
            <div className="sheet-section">
              <div className="sheet-section-title">Professional Summary</div>
              <p className="sheet-summary-p">{personal.summary}</p>
            </div>

            {/* Categorized Technical Skills */}
            <div className="sheet-section">
              <div className="sheet-section-title">Technical Competencies</div>
              <div className="sheet-skills-table">
                {skills.languages?.length > 0 && (
                  <div className="sheet-skills-row">
                    <strong>Languages & Core: </strong>{skills.languages.join(', ')}
                  </div>
                )}
                {skills.frameworks?.length > 0 && (
                  <div className="sheet-skills-row">
                    <strong>Frameworks & Libraries: </strong>{skills.frameworks.join(', ')}
                  </div>
                )}
                {skills.toolsAndCloud?.length > 0 && (
                  <div className="sheet-skills-row">
                    <strong>Cloud, DevOps & Tools: </strong>{skills.toolsAndCloud.join(', ')}
                  </div>
                )}
                {skills.databases?.length > 0 && (
                  <div className="sheet-skills-row">
                    <strong>Databases & Storage: </strong>{skills.databases.join(', ')}
                  </div>
                )}
                {skills.softSkills?.length > 0 && (
                  <div className="sheet-skills-row">
                    <strong>Methodologies & Leadership: </strong>{skills.softSkills.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Experience with Environment Tech Stack */}
            <div className="sheet-section">
              <div className="sheet-section-title">Professional Experience</div>
              {tailoredResume?.optimizedExperience?.map((exp, idx) => (
                <div key={idx} className="sheet-exp-item">
                  <div className="sheet-exp-header">
                    <span>{exp.role} — {exp.company} {exp.location ? `(${exp.location})` : ''}</span>
                    <span>{exp.duration}</span>
                  </div>

                  {/* Environment Tech Stack */}
                  {exp.environmentTech?.length > 0 && (
                    <div style={{ fontSize: '12px', fontStyle: 'italic', margin: '2px 0 4px', color: '#111827' }}>
                      <strong>Environment Tech: </strong>{exp.environmentTech.join(', ')}
                    </div>
                  )}

                  <ul className="sheet-bullets">
                    {exp.bullets?.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Projects Section with Tech Tags */}
            {tailoredResume?.projects?.length > 0 && (
              <div className="sheet-section">
                <div className="sheet-section-title">Key Technical Projects</div>
                {tailoredResume.projects.map((proj, idx) => (
                  <div key={idx} style={{ marginBottom: '8px', fontSize: '12.5px' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {proj.title}
                      {proj.technologies?.length > 0 && ` | Environment: ${proj.technologies.join(', ')}`}
                      {proj.liveLink && ` [Demo: ${proj.liveLink}]`}
                      {proj.githubLink && ` [Code: ${proj.githubLink}]`}
                    </div>
                    <p style={{ margin: '2px 0 0', textAlign: 'justify' }}>{proj.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications Section */}
            {tailoredResume?.certifications?.length > 0 && (
              <div className="sheet-section">
                <div className="sheet-section-title">Certifications & Licenses</div>
                {tailoredResume.certifications.map((cert, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px' }}>
                    <span>
                      <strong>{cert.name}</strong> — {cert.issuer}
                      {cert.credentialId ? ` (ID: ${cert.credentialId})` : ''}
                    </span>
                    <span>{cert.issueDate || ''}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Education Section */}
            <div className="sheet-section">
              <div className="sheet-section-title">Education</div>
              {tailoredResume?.education?.map((edu, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px' }}>
                  <span>
                    <strong>{edu.degree}</strong>, {edu.institution} {edu.scoreOrGpa ? `| ${edu.scoreOrGpa}` : ''}
                  </span>
                  <span>{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="ats-modal-footer">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Vector Semantics: Cosine Similarity Placed • Environment Tech Tagged • Zero Duplicate Bullets
          </div>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadPdf}
            className="btn-download-pdf"
          >
            {downloading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
            {downloading ? 'Generating Compliant PDF...' : 'Download ATS PDF Resume'}
          </button>
        </div>
      </div>
    </div>
  );
}
