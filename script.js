// script.js
// Make sure all_subjects_combined.js is in the same folder and loaded before this file.

/* -------------------------
   Utility: Branch => color
   ------------------------- */
const branchThemes = {
  ece: { name: 'ECE', color: 'from-blue-400 to-blue-600', tag: 'ECE', hex: '#2563eb' },
  cse: { name: 'CSE', color: 'from-red-400 to-red-600', tag: 'CSE', hex: '#ef4444' },
  eee: { name: 'EEE', color: 'from-orange-400 to-orange-600', tag: 'EEE', hex: '#fb923c' },
  civil: { name: 'CIVIL', color: 'from-yellow-300 to-yellow-500', tag: 'CIVIL', hex: '#f59e0b' },
  mech: { name: 'MECH', color: 'from-violet-400 to-violet-600', tag: 'MECH', hex: '#7c3aed' },
  mme: { name: 'MME', color: 'from-pink-400 to-pink-600', tag: 'MME', hex: '#ec4899' },
  chem: { name: 'CHEM', color: 'from-teal-400 to-teal-600', tag: 'CHEM', hex: '#14b8a6' },
  puc: { name: 'PUC', color: 'from-green-400 to-green-600', tag: 'PUC', hex: '#10b981' }
};

// grade -> grade points
const gradePoints = { 'EX': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'F': 0 };
const gradeList = ['EX','A','B','C','D','E','F'];

/* -------------------------
   Find subjects data objects
   The uploaded all_subjects_combined.js defines variables like:
   cseSubjects, eceSubjects, eeeSubjects, civilSubjects, mechSubjects, mmeSubjects, chemicalSubjects, window.subjectsData (last)
   We build a map by checking for common variable names.
   ------------------------- */
function buildSubjectsMap() {
  const map = {};
  if (typeof window.cseSubjects !== 'undefined') map['cse'] = window.cseSubjects;
  if (typeof window.eceSubjects !== 'undefined') map['ece'] = window.eceSubjects;
  if (typeof window.eeeSubjects !== 'undefined') map['eee'] = window.eeeSubjects;
  if (typeof window.civilSubjects !== 'undefined') map['civil'] = window.civilSubjects;
  if (typeof window.mechSubjects !== 'undefined') map['mech'] = window.mechSubjects;
  if (typeof window.mmeSubjects !== 'undefined') map['mme'] = window.mmeSubjects;
  if (typeof window.chemicalSubjects !== 'undefined') map['chem'] = window.chemicalSubjects;
  if (typeof window.subjectsData !== 'undefined') {
    // subjectsData from last assignment likely refers to one of the sets (PUC or last)
    // We'll attach PUC explicitly if exists
    if (window.subjectsData["PUC-I-1"] || window.subjectsData["PUC-I-2"]) {
      map['puc'] = window.subjectsData;
    }
  }
  return map;
}
const subjectsMap = buildSubjectsMap();

/* -------------------------
   DOM refs
   ------------------------- */
const programSelect = document.getElementById('programSelect');
const pucOptions = document.getElementById('pucOptions');
const btechOptions = document.getElementById('btechOptions');
const pucYear = document.getElementById('pucYear');
const pucSem = document.getElementById('pucSem');
const branchSelect = document.getElementById('branchSelect');
const yearSelect = document.getElementById('yearSelect');
const btechSem = document.getElementById('btechSem');
const loadSubjectsBtn = document.getElementById('loadSubjectsBtn');
const subjectsContainer = document.getElementById('subjectsContainer');
const calcBtn = document.getElementById('calcBtn');
const sgpaDisplay = document.getElementById('sgpaDisplay');
const classAward = document.getElementById('classAward');
const branchTag = document.getElementById('branchTag');
const downloadBtn = document.getElementById('downloadBtn');
const themeToggle = document.getElementById('themeToggle');

/* -------------------------
   Theme toggle
   ------------------------- */
function setDarkMode(on) {
  if (on) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  themeToggle.textContent = on ? 'Light Mode' : 'Dark Mode';
}
themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
});
themeToggle.textContent = 'Dark Mode';

/* -------------------------
   Program select handler
   ------------------------- */
programSelect.addEventListener('change', () => {
  const v = programSelect.value;
  pucOptions.classList.toggle('hidden', v !== 'puc');
  btechOptions.classList.toggle('hidden', v !== 'btech');
});

/* -------------------------
   Build key for subjectsMap lookups
   For PUC: keys in file are like "PUC-I-1", "PUC-I-2", etc.
   For BTech: keys are "1-1", "1-2", "2-1", ...
   ------------------------- */
function getSubjectsKey(program, opts) {
  // program: 'puc' or 'btech'
  if (program === 'puc') {
    // opts {pucYear: "PUC-I", sem: "1" or "2"}
    if (!opts.pucYear || !opts.sem) return null;
    // convert PUC-I + sem1 => "PUC-I-1"
    return `${opts.pucYear}-${opts.sem}`;
  } else {
    // opts {branch, year, sem}
    if (!opts.branch || !opts.year || !opts.sem) return null;
    const ky = `${opts.year}-${opts.sem}`;
    return ky;
  }
}

/* -------------------------
   Load subjects UI
   ------------------------- */
function clearSubjects() {
  subjectsContainer.innerHTML = '';
  sgpaDisplay.textContent = '';
  classAward.textContent = '';
  branchTag.classList.add('hidden');
}

loadSubjectsBtn.addEventListener('click', () => {
  showLoading(true);
  clearSubjects();
  const program = programSelect.value;
  if (!program) {
    alert('Choose PUC or BTECH first.');
    return;
  }
  console.log('Selected program:', program);

  if (program === 'puc') {
    const year = pucYear.value;
    const sem = pucSem.value;
    if (!year || !sem) { alert('Select PUC year and semester'); return; }
    console.log('PUC year:', year, 'PUC sem:', sem);
    // Prompt for stream
    let stream = prompt('Enter your stream: Type "MPC" or "MBiPC"').trim().toUpperCase();
    if (stream !== 'MPC' && stream !== 'MBIPC') return alert('Please enter either "MPC" or "MBiPC"');
    // key like PUC-I-1
    const key = `${year}-${sem}`;
    console.log('PUC key:', key);
    let subjects = (subjectsMap['puc'] && subjectsMap['puc'][key]) ? subjectsMap['puc'][key] : null;
    if (!subjects) {
      console.warn('Subjects not found for PUC key:', key, 'Available keys:', Object.keys(subjectsMap['puc'] || {}));
    } else {
      console.log('Loaded subjects:', subjects);
    }
    if (!subjects) {
      subjectsContainer.innerHTML = `<p class="text-sm text-rose-500">Subjects not found for ${key}. Make sure your all_subjects_combined.js includes PUC keys.</p>`;
      return;
    }
    if (stream === 'MPC') {
      // Remove Biology and Biology Lab subjects
      subjects = subjects.filter(sub => !/biology/i.test(sub.name) && !/biology/i.test(sub.subcode));
    }
  populateSubjects(subjects, 'puc', key);
  showLoading(false);
  } else {
    const branch = branchSelect.value;
    const year = yearSelect.value;
    const sem = btechSem.value;
    if (!branch || !year || !sem) { alert('Select branch, year and semester'); return; }
    console.log('BTECH branch:', branch, 'year:', year, 'sem:', sem);
    const key = `${year}-${sem}`;
    console.log('BTECH key:', key);
    const subjects = (subjectsMap[branch] && subjectsMap[branch][key]) ? subjectsMap[branch][key] : null;
    if (!subjects) {
      console.warn('Subjects not found for branch:', branch, 'key:', key, 'Available keys:', Object.keys(subjectsMap[branch] || {}));
    } else {
      console.log('Loaded subjects:', subjects);
    }
    if (!subjects) {
      subjectsContainer.innerHTML = `<p class="text-sm text-rose-500">Subjects not found for ${branch} ${key}. Make sure all_subjects_combined.js supports this branch/semester.</p>`;
      return;
    }
  populateSubjects(subjects, branch, key);
  showLoading(false);
  }
});

/* -------------------------
   Populate subjects & grade dropdowns
   ------------------------- */
function populateSubjects(subjects, branch, key) {
  // Update select dropdowns to match branch theme
  const selects = document.querySelectorAll('select');
  selects.forEach(sel => {
    sel.classList.remove('cse-theme','ece-theme','eee-theme','civil-theme','mech-theme','mme-theme','chem-theme','puc-theme','default-theme');
    sel.classList.add(`${branch}-theme`);
  });
  // Update branch heading at top
  const branchHeading = document.getElementById('branchHeading');
  if (branchHeading) {
    let branchName = branchThemes[branch]?.name || branch.toUpperCase();
    branchHeading.textContent = `Branch: ${branchName}`;
    branchHeading.className = `text-lg font-semibold mt-2 mb-1 text-center branch-tag ${branch}-theme`;
  }
  // Change whole web background theme based on branch
  document.body.classList.remove(
    'cse-bg','ece-bg','eee-bg','civil-bg','mech-bg','mme-bg','chem-bg','puc-bg','default-bg'
  );
  switch(branch) {
    case 'cse': document.body.classList.add('cse-bg'); break;
    case 'ece': document.body.classList.add('ece-bg'); break;
    case 'eee': document.body.classList.add('eee-bg'); break;
    case 'civil': document.body.classList.add('civil-bg'); break;
    case 'mech': document.body.classList.add('mech-bg'); break;
    case 'mme': document.body.classList.add('mme-bg'); break;
    case 'chem': document.body.classList.add('chem-bg'); break;
    case 'puc': document.body.classList.add('puc-bg'); break;
    default: document.body.classList.add('default-bg'); break;
  }
  subjectsContainer.innerHTML = '';
  branchTag.classList.remove('hidden');
  branchTag.textContent = (branchThemes[branch] && branchThemes[branch].tag) ? branchThemes[branch].tag : branch.toUpperCase();
  // Remove previous color classes and set base classes
  branchTag.className = 'px-3 py-1 rounded-full text-sm font-medium branch-tag';
  branchTag.classList.remove(
    'cse-theme','ece-theme','eee-theme','civil-theme','mech-theme','mme-theme','chem-theme','puc-theme','default-theme'
  );
  switch(branch) {
    case 'cse': branchTag.classList.add('cse-theme'); break;
    case 'ece': branchTag.classList.add('ece-theme'); break;
    case 'eee': branchTag.classList.add('eee-theme'); break;
    case 'civil': branchTag.classList.add('civil-theme'); break;
    case 'mech': branchTag.classList.add('mech-theme'); break;
    case 'mme': branchTag.classList.add('mme-theme'); break;
    case 'chem': branchTag.classList.add('chem-theme'); break;
    case 'puc': branchTag.classList.add('puc-theme'); break;
    default: branchTag.classList.add('default-theme'); break;
  }

  // subject rows
  subjects.forEach((s, idx) => {
    const row = document.createElement('div');
    row.className = `grid grid-cols-12 gap-2 items-center p-3 rounded-xl border border-transparent shadow card-pop card-${branch}`;
    row.innerHTML = `
      <div class="col-span-12 sm:col-span-6 md:col-span-6">
        <div class="font-medium">${escapeHtml(s.name || s.name)}</div>
        <div class="text-xs text-slate-500">${s.code || ''}</div>
      </div>
      <div class="col-span-6 sm:col-span-3 md:col-span-3">
        <div class="text-sm">Credits: <span class="font-semibold">${s.credits ?? 0}</span></div>
      </div>
      <div class="col-span-6 sm:col-span-3 md:col-span-3 text-right">
        <label class="sr-only">Grade</label>
        <select data-credits="${s.credits ?? 0}" class="gradeSelect w-full rounded-md border p-2 bg-transparent text-center">
          ${gradeList.map(g => `<option value="${g}">${g}</option>`).join('')}
        </select>
      </div>
    `;
    subjectsContainer.appendChild(row);
  });

  // show hint
  const help = document.createElement('div');
  help.className = 'mt-3 text-sm text-slate-500';
  help.textContent = "Default grade is EX. Change grades for each subject. If any subject gets 'F', SGPA will show as Fail.";
  subjectsContainer.appendChild(help);
}

/* -------------------------
   SGPA calculation & class award
   - If any F -> show Fail (per requirement)
   - Otherwise compute SGPA = sum(Ci*GPi)/sum(Ci) rounded to 2 decimals
   - Class based on CGPA rules (for single semester we use SGPA as CGPA)
   ------------------------- */
calcBtn.addEventListener('click', () => {
  const gradeSelects = Array.from(document.querySelectorAll('.gradeSelect'));
  if (gradeSelects.length === 0) { alert('No subjects loaded'); return; }

  let totalCredits = 0;
  let weighted = 0;
  let anyF = false;

  gradeSelects.forEach(sel => {
    const g = sel.value;
    const credits = parseFloat(sel.getAttribute('data-credits')) || 0;
    const gp = gradePoints[g] ?? 0;
    if (g === 'F') anyF = true;
    totalCredits += credits;
    weighted += credits * gp;
  });

  if (anyF) {
    sgpaDisplay.innerHTML = `<span class="text-rose-500 font-bold">FAIL</span>`;
    classAward.textContent = 'Fix F grades via remedial exam and recalc';
    // confetti for fail? do gentle shake
    flashFail();
    return;
  }

  if (totalCredits === 0) {
    alert('Total credits are zero, cannot compute.');
    return;
  }

  const sgpa = Math.round((weighted / totalCredits) * 100) / 100;
  sgpaDisplay.textContent = sgpa.toFixed(2);
  sgpaDisplay.classList.add('animate-bounce', 'text-green-600', 'font-bold', 'scale-110', 'transition-all', 'duration-500');
  // Show congratulations animation
  let congrats = document.createElement('div');
  congrats.textContent = '🎉 Congratulations!';
  congrats.className = 'fixed top-1/3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-400 to-blue-500 text-white text-3xl font-extrabold px-8 py-4 rounded-xl shadow-lg animate-fade-in-up z-50';
  document.body.appendChild(congrats);
  setTimeout(()=> {
    sgpaDisplay.classList.remove('animate-bounce','text-green-600','font-bold','scale-110','transition-all','duration-500');
    congrats.classList.add('animate-fade-out');
    setTimeout(()=>{
      congrats.remove();
    }, 800);
  }, 1800);

  // Award classification using RGUKT table (CGPA==SGPA here)
  let award = '';
  if (sgpa >= 8.0) award = 'Distinction';
  else if (sgpa >= 7.0) award = 'First Class';
  else if (sgpa >= 6.0) award = 'Second Class';
  else if (sgpa >= 5.0) award = 'Pass Class';
  else award = 'Fail';

  classAward.textContent = `Class: ${award}`;
  popSuccess();
});

/* -------------------------
   Small visuals for success/fail
   ------------------------- */
function popSuccess() {
  // small confetti burst
  confetti({
    particleCount: 60,
    spread: 50,
    origin: { y: 0.2 }
  });
}
function flashFail() {
  sgpaDisplay.classList.add('animate-[shake_0.6s]','text-rose-500');
  setTimeout(()=> {
    sgpaDisplay.classList.remove('animate-[shake_0.6s]','text-rose-500');
  },700);
}

/* -------------------------
   PDF download (screenshot of subjects section)
   Using html2canvas + jsPDF
   ------------------------- */
downloadBtn.addEventListener('click', async () => {
  const subjectsEl = document.getElementById('subjectsSection');
  if (!subjectsEl) return alert('Nothing to download.');

  // Prompt for student name and ID
  let studentName = prompt('Enter your name for the report:');
  if (!studentName) return alert('Name is required.');
  let studentId = prompt('Enter your ID number for the report:');
  if (!studentId) return alert('ID number is required.');

  // small validation: ensure SGPA calculated
  if (!sgpaDisplay.textContent) {
    if (!confirm('SGPA not calculated — still download current view?')) return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Preparing...';

  // Generate PDF table matching RGUKT results style

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 60;

  // RGUKT logo
  const logoUrl = 'https://raw.githubusercontent.com/rgukt-ongole/brand-assets/main/logo.png';
  const logoSize = 60;
  await new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = logoUrl;
    img.onload = () => {
      pdf.addImage(img, 'PNG', pageWidth/2-logoSize/2, y, logoSize, logoSize);
      resolve();
    };
    img.onerror = resolve;
  });
  y += logoSize + 10;

  // College name and address
  pdf.setFont('times', 'bold');
  pdf.setFontSize(18);
  pdf.text('Rajiv Gandhi University of Knowledge Technologies,', pageWidth/2, y, { align: 'center' });
  y += 20;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  pdf.text('(A.P. Government Act 18 of 2008)', pageWidth/2, y, { align: 'center' });
  y += 16;
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.textWithLink('RGUKT Ongole Campus', pageWidth/2, y, { align: 'center', url: 'https://rguktong.ac.in/' });
  y += 16;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  pdf.text('Kurnool Road, Santhanutalapadu(V&M), Prakasam District, A.P – 523225', pageWidth/2, y, { align: 'center' });
  y += 20;
  pdf.setDrawColor(180);
  pdf.line(60, y, pageWidth-60, y);
  y += 18;

  // Student info row
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  pdf.text(`ID: ${studentId}`, 60, y);
  pdf.text(`NAME: ${studentName}`, pageWidth-220, y);
  let branch = document.getElementById('branchSelect')?.value?.toUpperCase() || 'PUC';
  let year = document.getElementById('yearSelect')?.value || '';
  let sem = document.getElementById('btechSem')?.value || '';
  let yearSem = year && sem ? `YEAR: E${year} SEM${sem}` : '';
  pdf.setFont('times', 'bold');
  pdf.text(`BRANCH: ${branch}`, 60, y+18);
  pdf.text(yearSem, pageWidth-220, y+18);
  y += 38;

  // Table columns: SNO, SUBCODE, SUBNAME, CREDITS, GRADES
  const colX = [60, 120, 210, 430, 510];
  const colW = [60, 90, 220, 80, 60];
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  pdf.setFillColor(255,255,255);
  pdf.rect(colX[0], y, colW.reduce((a,b)=>a+b), 24, 'S');
  pdf.text('SNO', colX[0]+18, y+16, { align: 'center' });
  pdf.text('SUBCODE', colX[1]+30, y+16, { align: 'center' });
  pdf.text('SUBNAME', colX[2]+110, y+16, { align: 'center' });
  pdf.text('CREDITS', colX[3]+30, y+16, { align: 'center' });
  pdf.text('GRADES', colX[4]+30, y+16, { align: 'center' });
  y += 24;

  // Table rows
  pdf.setFont('times', 'normal');
  let subjects = Array.from(subjectsEl.querySelectorAll('.grid'));
  subjects.forEach((row, idx) => {
    const name = row.querySelector('.font-medium')?.textContent || '';
    const code = row.querySelector('.text-xs')?.textContent || '';
    const credits = row.querySelector('.font-semibold')?.textContent || '';
    const grade = row.querySelector('.gradeSelect')?.value || '';
    pdf.setFillColor(255,255,255);
    pdf.rect(colX[0], y, colW.reduce((a,b)=>a+b), 22, 'S');
    pdf.text(String(idx+1), colX[0]+18, y+15, { align: 'center' });
    pdf.text(code, colX[1]+30, y+15, { align: 'center' });
  // Wrap subject name if too long
  let wrappedName = pdf.splitTextToSize(name, colW[2]-20);
  pdf.text(wrappedName, colX[2]+10, y+15, { maxWidth: colW[2]-20 });
  y += (22 * wrappedName.length) - 22;
    pdf.text(credits, colX[3]+30, y+15, { align: 'center' });
    pdf.text(grade, colX[4]+30, y+15, { align: 'center' });
    y += 22;
    if (y > pdf.internal.pageSize.getHeight()-80) {
      pdf.addPage();
      y = 60;
    }
  });

  // Controller of Examinations
  // Add SGPA to PDF
  y += 20;
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.text(`SGPA: ${sgpaDisplay.textContent || '--'}`, 60, y);
  y += 30;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(13);
  pdf.text('Controller of Examinations', pageWidth/2, y+30, { align: 'center' });
// Make college name clickable in UI
document.addEventListener('DOMContentLoaded', () => {
  const collegeNameEl = document.getElementById('collegeName');
  if (collegeNameEl) {
    collegeNameEl.style.cursor = 'pointer';
    collegeNameEl.addEventListener('click', () => {
      window.open('https://rguktong.ac.in/', '_blank');
    });
  }
});

  pdf.setProperties({ title: 'SGPA Report' });
  const name = `SGPA_Report_${new Date().toISOString().slice(0,10)}.pdf`;
  pdf.save(name);

  downloadBtn.disabled = false;
  downloadBtn.textContent = 'Download Report';
});

/* -------------------------
   small safety helpers
   ------------------------- */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* -------------------------
   Apply feather icons (load)
   ------------------------- */
window.addEventListener('load', () => {
  if (window.feather) feather.replace();
});
