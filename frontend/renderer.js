let mainFolder = '';
let duplicateFolder = '';

function selectMainFolder() {
  window.api.selectFolder().then((folder) => {
    if (folder) {
      mainFolder = folder;
      document.getElementById('mainPath').textContent = folder.split(/[/\\]/).pop();
    }
  });
}

function selectDuplicateFolder() {
  window.api.selectFolder().then((folder) => {
    if (folder) {
      duplicateFolder = folder;
      document.getElementById('dupPath').textContent = folder.split(/[/\\]/).pop();
    }
  });
}

function copyBox(boxName) {
  navigator.clipboard.writeText(boxName).then(() => {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    loader.style.color = 'green';
    loader.textContent = `📋 Copied ${boxName} to clipboard`;
  });
}

function checkReadiness() {
  if (!mainFolder || !duplicateFolder) {
    alert('Please select both folders before checking.');
    return;
  }

  document.getElementById('loader').style.display = 'block';
  document.getElementById('tableContainer').innerHTML = '';
  document.getElementById('filterGroup').innerHTML = ''; // Очищаем фильтры перед созданием
  document.getElementById('analyzeResultContainer').style.display = 'flex';

  window.api.checkBoxes(mainFolder, duplicateFolder).then((resultHTML) => {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('tableContainer').innerHTML = resultHTML;

    // ВСТАВКА ФИЛЬТРОВ!!!
    const filterOptions = [
      'All',
      'Converted',
      'Not Converted',
      'Partially Converted',
      'Duplication Missing',
      "Doesn't Ready"
    ];

    const filterGroup = document.getElementById('filterGroup');
    filterOptions.forEach(option => {
      const label = document.createElement('label');
      label.className = 'toggle-switch';
      label.innerHTML = `
        <input type="radio" name="statusFilter" value="${option}" ${option === 'All' ? 'checked' : ''}>
        <span class="slider"></span>
        ${option}
      `;
      filterGroup.appendChild(label);
    });
  });
}


document.addEventListener('change', function (e) {
    if (e.target.name === 'statusFilter') {
      filterTableByStatus(e.target.value);
    }
  });
  
  function filterTableByStatus(status) {
    const rows = document.querySelectorAll('#tableContainer .grid-body-container .grid-row');
    let visibleCount = 0;
  
    rows.forEach(row => {
      const statusCell = row.children[4]; // 5-я ячейка (Status)
      const rowStatus = statusCell?.textContent.trim();
  
      if (status === 'All' || rowStatus === status) {
        row.style.display = ''; 
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
  
    const container = document.getElementById('bulkActionContainer');
    const btn = document.getElementById('bulkActionBtn');
  
    // Если вообще нет строк, всё скрыть:
    if (visibleCount === 0) {
      btn.style.visibility = 'hidden';
      container.style.display = 'block'; // Держим место
      return;
    }
  
    container.style.display = 'block'; // Всегда держим блок для выравнивания
    btn.style.visibility = 'visible';
  
    if (status === 'Not Converted') {
      btn.textContent = 'Convert All';
      btn.onclick = () => bulkConvert();
    } else if (status === 'Partially Converted') {
      btn.textContent = 'Reconvert All';
      btn.onclick = () => bulkConvert();
    } else if (status === 'Converted' || status === "Doesn't Ready") {
      btn.textContent = 'Copy All';
      btn.onclick = () => {
        const visible = Array.from(rows).filter(r => r.style.display !== 'none');
        const names = visible.map(r => r.children[0].textContent.trim());
        navigator.clipboard.writeText(names.join('\n')).then(() => {
          const loader = document.getElementById('loader');
          loader.style.display = 'block';
          loader.style.color = 'green';
          loader.textContent = `📋 Copied ${names.length} box numbers to clipboard`;
        });
      };
    } else if (status === 'Duplication Missing') {
      btn.textContent = 'Duplicate All';
      btn.onclick = () => {
        const visible = Array.from(rows).filter(r => r.style.display !== 'none');
        const names = visible.map(r => r.children[0].textContent.trim());
        navigator.clipboard.writeText(names.join('\n')).then(() => {
          const loader = document.getElementById('loader');
          loader.style.display = 'block';
          loader.style.color = 'green';
          loader.textContent = `📋 Duplicates queued for ${names.length} boxes`;
        });
      };
    } else {
      btn.style.visibility = 'hidden';
    }
  }
  
  
  
  function duplicateBox(boxName) {
    navigator.clipboard.writeText(boxName).then(() => {
      alert(` Box "${boxName}" added to duplication queue.`);
    }).catch(err => {
      console.error(' Failed to copy for duplication:', err);
    });
  }
  

  function convertBox(boxName, silent = false) {
    if (!mainFolder || !duplicateFolder) return;
  
    const loader = document.getElementById('loader');
    const quality = document.getElementById('qualitySelect')?.value || 75;
  
    loader.style.display = 'block';
    loader.style.color = 'green';
    loader.textContent = ` Conversion of ${boxName} is in progress...`;
  
    const rows = document.querySelectorAll('#tableContainer .grid-body-container .grid-row');
    const row = Array.from(rows).find(r => {
      const cellText = r.children[0]?.textContent.trim();
      const normalized = 'Box' + cellText.split('-').slice(1).join('-');
      return normalized === boxName;
    });
  
    const cells = row.querySelectorAll('.grid-item');
    const statusCell = cells[4];
    const actionCell = cells[5];

  
    if (statusCell && actionCell) {
      statusCell.textContent = '🔄 Converting...';
      actionCell.innerHTML = '';
    }
  
    window.api.convertBox({
      boxName,
      mainFolder,
      duplicateFolder,
      quality
    }).then(result => {
      if (statusCell && actionCell) {
        statusCell.textContent = 'Converted';
        actionCell.innerHTML = '';
      }
  
      loader.textContent = `✅ Conversion of ${boxName} completed`;
    }).catch(err => {
      console.error(err);
  
      if (statusCell && actionCell) {
        statusCell.textContent = 'Not Converted';
        actionCell.innerHTML = `<button onclick="convertBox('${boxName}')">Convert</button>`;
      }
  
      loader.style.color = 'red';
      loader.textContent = `❌ Error converting ${boxName}: ${err}`;
    });
  }
  

  function reconvertBox(boxName) {
    if (!mainFolder || !duplicateFolder) return;
  
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    loader.style.color = 'green';
    loader.textContent = `🔁 Reconversion of ${boxName} in progress...`;
  
    const quality = document.getElementById('qualitySelect')?.value || 75;
    const boxPath = `${mainFolder}\\${boxName}`;
    const convertedPath = `${boxPath}\\3 Converted`;
  
    try {
      const fs = require('fs');
      const path = require('path');
  
      const filesToDelete = [];
  
      if (fs.existsSync(convertedPath)) {
        fs.readdirSync(convertedPath).forEach(file => {
          if (file.endsWith('.pdf')) {
            const fullPath = path.join(convertedPath, file);
            fs.unlinkSync(fullPath);
            filesToDelete.push(file);
          }
        });
      }
  
      if (fs.existsSync(duplicateFolder)) {
        filesToDelete.forEach(file => {
          const dupPath = path.join(duplicateFolder, file);
          if (fs.existsSync(dupPath)) {
            fs.unlinkSync(dupPath);
          }
        });
      }
  
    } catch (err) {
      console.error('❌ Error cleaning old PDFs:', err);
      loader.style.color = 'red';
      loader.textContent = `❌ Error cleaning before reconversion: ${err.message}`;
      return;
    }
  
    const rows = document.querySelectorAll('#tableContainer .grid-body-container .grid-row');
    const row = Array.from(rows).find(r => {
      const cellText = r.children[0]?.textContent.trim();
      const normalized = 'Box' + cellText.split('-').slice(1).join('-');
      return normalized === boxName;
    });
  
    const cells = row.querySelectorAll('.grid-item');
    const statusCell = cells[4];
    const actionCell = cells[5];

  
    if (statusCell && actionCell) {
      statusCell.textContent = '🔁 Re-converting...';
      actionCell.innerHTML = '';
    }
  
    window.api.convertBox({
      boxName,
      mainFolder,
      duplicateFolder,
      quality
    }).then(result => {
      if (statusCell && actionCell) {
        statusCell.textContent = 'Converted';
        actionCell.innerHTML = '';
      }
  
      loader.textContent = `✅ Re-conversion of ${boxName} completed`;
    }).catch(err => {
      console.error(err);
  
      if (statusCell && actionCell) {
        statusCell.textContent = 'Not Converted';
        actionCell.innerHTML = `<button onclick="reconvertBox('${boxName}')">Reconvert</button>`;
      }
  
      loader.style.color = 'red';
      loader.textContent = `❌ Error reconverting ${boxName}: ${err}`;
    });
  }
  

  
  function bulkConvert() {
    const rows = document.querySelectorAll('#tableContainer .grid-body-container .grid-row');
    const statusFilter = document.querySelector('input[name="statusFilter"]:checked').value;
    const action = statusFilter === 'Not Converted' ? 'convertBox' : 'reconvertBox';
  
    const boxesToProcess = [];
  
    rows.forEach(row => {
      if (row.style.display === '') {
        const btn = row.querySelector('button');
        if (btn && btn.getAttribute('onclick')?.includes(action)) {
          const match = btn.getAttribute('onclick').match(/'(.*?)'/);
          if (match) boxesToProcess.push(match[1]);
        }
      }
    });
  
    boxesToProcess.forEach((boxName, index) => {
      setTimeout(() => {
        if (action === 'convertBox') {
          convertBox(boxName);
        } else if (action === 'reconvertBox') {
          reconvertBox(boxName);
        }
      }, index * 500);
    });

    setTimeout(() => {
        document.getElementById('loader').textContent = '✅ All conversions completed';
      }, boxesToProcess.length * 500 + 500);
      
  }
  