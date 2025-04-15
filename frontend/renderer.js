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

function checkReadiness() {
  if (!mainFolder || !duplicateFolder) {
    alert('Please select both folders before checking.');
    return;
  }

  document.getElementById('loader').style.display = 'block';
  document.getElementById('tableContainer').innerHTML = '';

  window.api.checkBoxes(mainFolder).then((resultHTML) => {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('tableContainer').innerHTML = resultHTML;
  });
}

document.addEventListener('change', function (e) {
    if (e.target.name === 'statusFilter') {
      filterTableByStatus(e.target.value);
    }
  });
  
  function filterTableByStatus(status) {
    const rows = document.querySelectorAll('#tableContainer table tbody tr');
    let visibleCount = 0;
  
    rows.forEach(row => {
      const rowStatus = row.children[3].textContent;
      if (status === 'All' || rowStatus === status) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
  
    const container = document.getElementById('bulkActionContainer');
    const btn = document.getElementById('bulkActionBtn');
  
    if (status === 'Not Converted') {
      btn.textContent = 'Convert All';
      container.style.display = visibleCount ? 'block' : 'none';
    } else if (status === 'Partially Converted') {
      btn.textContent = 'Reconvert All';
      container.style.display = visibleCount ? 'block' : 'none';
    } else {
      container.style.display = 'none';
    }
  }
  

  function convertBox(boxName, silent = false) {
    if (!mainFolder || !duplicateFolder) return;
  
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    loader.style.color = 'green';
    loader.textContent = `🔄 Conversion of ${boxName} is in progress...`;
  
    const rows = document.querySelectorAll('#tableContainer table tbody tr');
    const row = Array.from(rows).find(r => {
        const cellText = r.children[0]?.textContent.trim();
        const normalized = 'Box' + cellText.split('-').slice(1).join('-');
        return normalized === boxName;
      });
  
    const statusCell = row?.children[3];
    const actionCell = row?.children[4];
  
    if (statusCell && actionCell) {
      statusCell.textContent = '🔄 Converting...';
      actionCell.innerHTML = '';
    }
  
    window.api.convertBox({
      boxName,
      mainFolder,
      duplicateFolder
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

  
  function bulkConvert() {
    const rows = document.querySelectorAll('#tableContainer table tbody tr');
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
  