document.addEventListener('DOMContentLoaded', function() {
  let variationCount = 1;

  function calculateCRAndUplift() {
    const rows = document.querySelectorAll('tbody tr');
    let originalVisitors = null;
    let originalConversions = null;
    let originalCR = null;

    rows.forEach(function(row) {
      const visitorsInput = row.querySelector('.visitors');
      const conversionsInput = row.querySelector('.conversions');
      const crCell = row.querySelector('.cr');
      const upliftCell = row.querySelector('.uplift');
      const confidenceCell = row.querySelector('.confidence');

      const visitors = parseFloat(visitorsInput.value);
      const conversions = parseFloat(conversionsInput.value);

      if (isNaN(visitors) || visitors === 0 || isNaN(conversions)) {
        crCell.textContent = '';
        crCell.style.color = '';
        upliftCell.textContent = '';
        upliftCell.style.color = '';
        confidenceCell.textContent = '';
        confidenceCell.style.color = '';
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
        originalVisitors = visitors;
        originalConversions = conversions;
        originalCR = cr;
        upliftCell.textContent = '—';
        upliftCell.style.color = '';
        confidenceCell.textContent = '—';
        confidenceCell.style.color = '';
      } else if (originalCR !== null) {
        const uplift = ((cr - originalCR) / originalCR) * 100;
        upliftCell.textContent = uplift.toFixed(2) + '%';

        if (uplift > 0) {
          upliftCell.style.color = 'green';
        } else {
          upliftCell.style.color = 'red';
        }

        // Güvenilirlik hesaplaması
        const pValue = calculatePValue(
          originalVisitors,
          originalConversions,
          visitors,
          conversions
        );
        const confidence = (1 - pValue) * 100;

        confidenceCell.textContent = confidence.toFixed(2) + '%';

        if (confidence >= 95) {
          confidenceCell.style.color = 'green';
        } else {
          confidenceCell.style.color = 'red';
        }
      } else {
        upliftCell.textContent = 'Orijinal CR eksik';
        upliftCell.style.color = 'red';
        confidenceCell.textContent = '';
        confidenceCell.style.color = '';
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
      <td><input type="number" class="form-control form-control-sm visitors" placeholder="Session"></td>
      <td><input type="number" class="form-control form-control-sm conversions" placeholder="Conversion"></td>
      <td class="cr align-middle"></td>
      <td class="uplift align-middle"></td>
      <td class="confidence align-middle"></td>
    `;
    tbody.appendChild(row);
    addEventListeners();
  });

  function calculatePValue(n1, c1, n2, c2) {
    // İki oran arasındaki Z-testini uygular
    const p1 = c1 / n1;
    const p2 = c2 / n2;
    const pPool = (c1 + c2) / (n1 + n2);
    const zNumerator = p2 - p1;
    const zDenominator = Math.sqrt(
      pPool * (1 - pPool) * (1 / n1 + 1 / n2)
    );
    const z = zNumerator / zDenominator;

    // Z skorundan p-değerini hesapla
    const pValue = 1 - cumulativeStandardNormalDistribution(Math.abs(z));
    return pValue;
  }

  function cumulativeStandardNormalDistribution(z) {
    // Standart normal dağılımın birikimli dağılım fonksiyonu
    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);
    const t = 1 / (1 + 0.3275911 * z);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const erf = 1 - (
      ((
        ((a5 * t + a4) * t + a3) * t + a2
      ) * t + a1
    ) * t * Math.exp(-z * z));
    return 0.5 * (1 + sign * erf);
  }

 

  addEventListeners();
});
