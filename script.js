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
  // Now we load only PUC data at start, branches are loaded dynamically
  const map = {};
  if (typeof window.subjectsData !== 'undefined') {
    if (window.subjectsData["PUC-I-1"] || window.subjectsData["PUC-I-2"]) {
      map['puc'] = window.subjectsData;
    }
  }
  return map;
}
let subjectsMap = buildSubjectsMap();

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
  // Removed loading animation
  clearSubjects();
  // Removed loading timeout and animation
  const program = programSelect.value;
  if (!program) {
    alert('Choose PUC or BTECH first.');
    return;
  }
  console.log('Selected program:', program);

  if (program === 'puc') {
    // ...existing code for PUC...
    const year = pucYear.value;
    const sem = pucSem.value;
    if (!year || !sem) { alert('Select PUC year and semester'); return; }
    console.log('PUC year:', year, 'PUC sem:', sem);
    let stream = prompt('Enter your stream: Type "MPC" or "MBiPC"').trim().toUpperCase();
    if (stream !== 'MPC' && stream !== 'MBIPC') return alert('Please enter either "MPC" or "MBiPC"');
    const key = `${year}-${sem}`;
    let subjects = (subjectsMap['puc'] && subjectsMap['puc'][key]) ? subjectsMap['puc'][key] : null;
    if (!subjects) {
  subjectsContainer.innerHTML = `<p class="text-sm text-rose-500">Subjects not found for ${key}. Make sure your all_subjects_combined.js includes PUC keys.</p>`;
  return;
    }
    if (stream === 'MPC') {
      subjects = subjects.filter(sub => !/biology/i.test(sub.name) && !/biology/i.test(sub.subcode));
    }
    populateSubjects(subjects, 'puc', key);
    showLoading(false);
  } else {
    // Dynamic branch data loading
    const branch = branchSelect.value;
    const year = yearSelect.value;
    const sem = btechSem.value;
    if (!branch || !year || !sem) { alert('Select branch, year and semester'); return; }
    const key = `${year}-${sem}`;
    // If branch data not loaded, load it dynamically
    if (!subjectsMap[branch]) {
      let branchFile = `${branch}Subjects.js`;
      let script = document.createElement('script');
      script.src = branchFile;
      script.onload = function() {
        subjectsMap[branch] = window[`${branch}Subjects`];
        finishBranchLoad();
      };
      script.onerror = function() {
  subjectsContainer.innerHTML = `<p class="text-sm text-rose-500">Failed to load ${branchFile}. Please check your internet connection or contact admin.</p>`;
      };
      document.body.appendChild(script);
    } else {
      finishBranchLoad();
    }
    function finishBranchLoad() {
      const subjects = (subjectsMap[branch] && subjectsMap[branch][key]) ? subjectsMap[branch][key] : null;
      if (!subjects) {
    subjectsContainer.innerHTML = `<p class="text-sm text-rose-500">Subjects not found for ${branch} ${key}. Make sure ${branch}Subjects.js supports this branch/semester.</p>`;
    return;
      }
  populateSubjects(subjects, branch, key);
    }
  }
});

/* -------------------------
   Populate subjects & grade dropdowns
   ------------------------- */
function populateSubjects(subjects, branch, key) {
  // Add 'Modify Subjects' button at the bottom
  let modifyBtn = document.getElementById('modifySubjectsBtn');
  let rkLabel = document.getElementById('rkLabel');
  if (!modifyBtn) {
    // Create container for button and label
    let container = document.createElement('div');
    container.id = 'modifyBtnContainer';
  container.className = 'fixed bottom-4 right-4 z-50 flex flex-row items-center gap-2 sm:gap-3';
    // Create RK label
    rkLabel = document.createElement('span');
    rkLabel.id = 'rkLabel';
    rkLabel.textContent = 'Developed by RK';
    rkLabel.className = 'px-4 py-2 rounded-xl bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold shadow-lg text-base';
    // Create button
    modifyBtn = document.createElement('button');
    modifyBtn.id = 'modifySubjectsBtn';
    modifyBtn.textContent = 'Modify Subjects';
    modifyBtn.className = 'px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-green-500 text-white text-lg font-bold shadow-lg';
    // Add to container
    container.appendChild(rkLabel);
    container.appendChild(modifyBtn);
    document.body.appendChild(container);
  }
  // Ensure both are visible
  modifyBtn.style.display = 'inline-block';
  if (rkLabel) rkLabel.style.display = 'inline-block';
    modifyBtn.addEventListener('click', () => {
    // Remove all subjects from view and show modal for selection
    subjectsContainer.innerHTML = '';
    let modal = document.getElementById('modifyModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modifyModal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40';
      modal.innerHTML = `<div class="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 class="text-xl font-bold mb-4">Modify Subjects</h2>
        <div id="subjectList" class="mb-4"></div>
        <button id="addSubjectBtn" class="w-full py-2 rounded-lg bg-green-600 text-white font-bold mb-2">Add New Subject</button>
        <button id="closeModifyBtn" class="w-full py-2 rounded-lg bg-gray-400 text-white font-bold">Done</button>
      </div>`;
      document.body.appendChild(modal);
    } else {
      modal.style.display = 'flex';
    }
    // Render subjects as removable items
    function renderSubjectList() {
      const subjectList = modal.querySelector('#subjectList');
      subjectList.innerHTML = '';
      subjects.forEach((sub, idx) => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center mb-2 p-2 rounded bg-gray-100 dark:bg-slate-800';
        item.innerHTML = `<span class="font-medium">${sub.name} <span class="text-xs text-gray-500">(${sub.code})</span></span><button class="px-2 py-1 rounded bg-red-500 text-white text-xs font-bold">Remove</button>`;
        item.querySelector('button').onclick = function() {
          subjects.splice(idx, 1);
          renderSubjectList();
          populateSubjects(subjects, branch, key);
        };
        subjectList.appendChild(item);
      });
    }
    renderSubjectList();
    // Removed creation and display of floating 'Developed by RK' and 'Modify Subjects' buttons. Only footer button remains and is functional.
      const row = document.createElement('div');
      let branchBg = {
        cse: 'bg-red-50 dark:bg-red-900',
        ece: 'bg-blue-50 dark:bg-blue-900',
        eee: 'bg-orange-50 dark:bg-orange-900',
        civil: 'bg-yellow-50 dark:bg-yellow-900',
        mech: 'bg-violet-50 dark:bg-violet-900',
        mme: 'bg-pink-50 dark:bg-pink-900',
        chem: 'bg-teal-50 dark:bg-teal-900',
        puc: 'bg-green-50 dark:bg-green-900',
        default: 'bg-white dark:bg-slate-900'
      };
      row.className = `flex flex-col gap-2 p-4 rounded-xl border border-gray-300 dark:border-slate-700 card-${branch} ${branchBg[branch] || branchBg.default} mb-4 shadow-md`;
      // Improve dark mode contrast
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches || document.documentElement.classList.contains('dark')) {
        row.style.backgroundColor = 'rgba(30,41,59,0.98)'; // dark slate
        row.style.borderColor = '#334155';
      } else {
        row.style.backgroundColor = '';
        row.style.borderColor = '';
      }
      // Branch theme colors for dropdown
      const branchSelectBg = {
        cse: 'bg-red-600',
        ece: 'bg-blue-600',
        eee: 'bg-orange-500',
        civil: 'bg-yellow-400',
        mech: 'bg-violet-600',
        mme: 'bg-pink-500',
        chem: 'bg-teal-600',
        puc: 'bg-green-600',
        default: 'bg-blue-600'
      };
      row.innerHTML = `
        <div class="mb-1">
          <div class="font-bold text-lg ${document.documentElement.classList.contains('dark') ? 'text-blue-200' : 'text-blue-900'}">${escapeHtml(s.name || s.name)}</div>
          <div class="text-xs ${document.documentElement.classList.contains('dark') ? 'text-gray-300' : 'text-gray-700'}">${s.code || ''}</div>
        </div>
        <div class="mb-1 text-base ${document.documentElement.classList.contains('dark') ? 'text-gray-200' : 'text-gray-900'}">Credits: <span class="font-semibold">${s.credits ?? 0}</span></div>
        <div class="w-full">
          <label class="sr-only">Grade</label>
          <select data-credits="${s.credits ?? 0}" class="gradeSelect w-full rounded-md border p-2 ${branchSelectBg[branch] || branchSelectBg.default} text-white text-center font-bold" style="${document.documentElement.classList.contains('dark') ? 'background-color:#334155;' : ''}">
            ${gradeList.map(g => `<option value="${g}">${g}</option>`).join('')}
          </select>
        </div>
      `;
      subjectsContainer.appendChild(row);
    }
    // show hint
    const help = document.createElement('div');
    help.className = 'mt-3 text-sm text-slate-500';
    help.textContent = "Default grade is EX. Change grades for each subject. If any subject gets 'F', SGPA will show as Fail.";
    subjectsContainer.appendChild(help);
    // Update pagination controls
    if (totalPages > 1) {
      paginationControls.classList.remove('hidden');
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
      prevPageBtn.disabled = currentPage === 1;
      nextPageBtn.disabled = currentPage === totalPages;
    } else {
      paginationControls.classList.add('hidden');
    }
  // Ensure modify button is visible
  let modifyBtn = document.getElementById('modifySubjectsBtn');
  if (modifyBtn) modifyBtn.style.display = 'block';
    // Ensure subjectsContainer is always visible and not covered by overlays
    subjectsContainer.style.display = 'block';
    subjectsContainer.style.visibility = 'visible';
  }

  // Event listeners for pagination
  if (prevPageBtn && nextPageBtn) {
    prevPageBtn.onclick = function() {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    };
    nextPageBtn.onclick = function() {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
      }
    };
  }
  // Initial render
  renderPage(currentPage);
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

  // Removed prompts for student name and ID

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
