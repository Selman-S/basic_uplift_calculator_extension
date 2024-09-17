document.addEventListener('DOMContentLoaded', function() {
    let variationCount = 1;
  
    function calculateCRAndUplift() {
      const rows = document.querySelectorAll('tbody tr');
      let originalCR = null;
  
      rows.forEach(function(row) {
        const visitorsInput = row.querySelector('.visitors');
        const conversionsInput = row.querySelector('.conversions');
        const crCell = row.querySelector('.cr');
        const upliftCell = row.querySelector('.uplift');
  
        const visitors = parseFloat(visitorsInput.value);
        const conversions = parseFloat(conversionsInput.value);
  
        if (isNaN(visitors) || visitors === 0 || isNaN(conversions)) {
          crCell.textContent = '';
          crCell.style.color = '';
          upliftCell.textContent = '';
          upliftCell.style.color = '';
          return;
        }
  
        const cr = (conversions / visitors) * 100;
        crCell.textContent = cr.toFixed(2) + '%';
  
        if (cr > 0) {
          crCell.style.color = 'green';
        } else {
          crCell.style.color = 'red';
        }
  
        if (row.getAttribute('data-type') === 'original') {
          originalCR = cr;
          upliftCell.textContent = '—';
        } else if (originalCR !== null) {
          const uplift = ((cr - originalCR) / originalCR) * 100;
          upliftCell.textContent = uplift.toFixed(2) + '%';
  
          if (uplift > 0) {
            upliftCell.style.color = 'green';
          } else {
            upliftCell.style.color = 'red';
          }
        } else {
          upliftCell.textContent = 'Orijinal CR eksik';
          upliftCell.style.color = 'red';
        }
      });
    }
  
    function addEventListeners() {
      const inputs = document.querySelectorAll('.visitors, .conversions');
      inputs.forEach(function(input) {
        input.addEventListener('input', calculateCRAndUplift);
      });
    }
  
    document.getElementById('addVariation').addEventListener('click', function() {
      variationCount++;
      const tbody = document.querySelector('#dataTable tbody');
      const row = document.createElement('tr');
      row.setAttribute('data-type', 'variation');
      row.innerHTML = `
        <td>Varyasyon ${variationCount}</td>
        <td><input type="number" class="visitors" placeholder="Session"></td>
        <td><input type="number" class="conversions" placeholder="Conversion"></td>
        <td class="cr"></td>
        <td class="uplift"></td>
      `;
      tbody.appendChild(row);
      addEventListeners();
    });
  
    addEventListeners();
  });
  