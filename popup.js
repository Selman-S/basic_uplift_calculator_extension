document.addEventListener('DOMContentLoaded', function() {
  let variationCount = 1;

  function calculateCRAndUplift() {
    const rows = document.querySelectorAll('#calculator tbody tr');
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
          upliftCell.style.color = 'red';

          // Uplift sıfır veya negatif ise güvenilirlik %0 olarak ayarlanır
          confidenceCell.textContent = '0%';
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
    const inputs = document.querySelectorAll('#calculator .visitors, #calculator .conversions');
    inputs.forEach(function(input) {
      input.addEventListener('input', calculateCRAndUplift);
    });
  }

  document.getElementById('addVariation').addEventListener('click', function() {
    variationCount++;
    const tbody = document.querySelector('#calculator #dataTable tbody');
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

  /* Örneklem Büyüklüğü Hesaplama */

  document.getElementById('calculateSampleSize').addEventListener('click', function() {
    const baselineCR = parseFloat(document.getElementById('baselineCR').value) / 100;
    const mde = parseFloat(document.getElementById('minimumDetectableEffect').value) / 100;
    const confidenceLevel = parseFloat(document.getElementById('desiredConfidenceLevel').value) / 100;
    const power = parseFloat(document.getElementById('desiredPower').value) / 100;

    if (isNaN(baselineCR) || isNaN(mde) || isNaN(confidenceLevel) || isNaN(power)) {
      document.getElementById('sampleSizeResult').textContent = 'Lütfen tüm değerleri girin.';
      return;
    }

    const zAlpha = zScore(confidenceLevel);
    const zBeta = zScore(power);

    const p1 = baselineCR;
    const p2 = baselineCR * (1 + mde);

    const pooledP = (p1 + p2) / 2;
    const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * 2);

    const sampleSize = Math.pow((zAlpha + zBeta) * pooledSE / (p2 - p1), 2);

    document.getElementById('sampleSizeResult').textContent = `Gerekli örneklem büyüklüğü (her grup için): ${Math.ceil(sampleSize)}`;
  });

  function zScore(probability) {
    // Z skorunu hesaplar
    return Math.sqrt(2) * inverseErf(2 * probability - 1);
  }

  function inverseErf(x) {
    // Inverse hata fonksiyonu
    const a = 0.147;
    const ln = Math.log(1 - x * x);
    const part1 = (2 / (Math.PI * a)) + (ln / 2);
    const part2 = ln / a;
    return (x < 0 ? -1 : 1) * Math.sqrt(-part1 + Math.sqrt(part1 * part1 - part2));
  }

  /* Test Süresi Tahmini */

  document.getElementById('calculateTestDuration').addEventListener('click', function() {
    const dailyVisitors = parseFloat(document.getElementById('dailyVisitors').value);
    const neededSampleSize = parseFloat(document.getElementById('neededSampleSize').value);

    if (isNaN(dailyVisitors) || isNaN(neededSampleSize) || dailyVisitors === 0) {
      document.getElementById('testDurationResult').textContent = 'Lütfen tüm değerleri girin.';
      return;
    }

    const daysNeeded = neededSampleSize / (dailyVisitors / 2); // 2 grup olduğu varsayımıyla

    document.getElementById('testDurationResult').textContent = `Tahmini test süresi: ${Math.ceil(daysNeeded)} gün`;
  });

 /* Sekme Geçişlerini Manuel Olarak Sağlamak */
  const tabLinks = document.querySelectorAll('.nav-link');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const infoText = document.getElementById('infoText');

  const infoContents = {
    'calculator': `
      <strong>Bu araç, orijinal ve varyasyonlar için Dönüşüm Oranı (CR), Uplift ve Güvenilirlik oranlarını hesaplamak için kullanılır.</strong><br><br>
      <u>Dönüşüm Oranı (CR):</u><br>
      <em>Hesaplama:</em> CR = (Dönüşüm Sayısı / Ziyaretçi Sayısı) × 100<br>
      Bir sayfayı ziyaret eden kullanıcıların ne kadarının istenen eylemi gerçekleştirdiğini gösterir.<br><br>
      <u>Uplift:</u><br>
      <em>Hesaplama:</em> Uplift = ((Varyasyon CR - Orijinal CR) / Orijinal CR) × 100<br>
      Varyasyonun performansının orijinale göre yüzde olarak ne kadar arttığını veya azaldığını gösterir.<br><br>
      <u>Güvenilirlik Oranı:</u><br>
      <em>Hesaplama:</em> İki oran arasındaki farkın istatistiksel anlamlılığını hesaplamak için Z-testi kullanılır.<br>
      Varyasyonun orijinale göre istatistiksel olarak anlamlı bir fark yaratıp yaratmadığını gösterir. %95 ve üzeri güvenilirlik oranı genellikle sonucun anlamlı olduğunu gösterir.
    `,
    'sample-size': `
      <strong>Örneklem Büyüklüğü Hesaplama Aracı</strong><br><br>
      Bu araç, A/B testiniz için gerekli olan minimum örneklem büyüklüğünü hesaplamanıza yardımcı olur.<br><br>
      <u>Kullanım:</u><br>
      - <strong>Mevcut CR (%):</strong> Şu anki dönüşüm oranınız.<br>
      - <strong>Minimum Algılanabilir Etki (%):</strong> Tespit etmek istediğiniz en küçük dönüşüm oranı artışı.<br>
      - <strong>Güvenilirlik Seviyesi (%):</strong> İstediğiniz güven düzeyi (genellikle %95).<br>
      - <strong>Güç (%):</strong> Testin bir farkı tespit etme olasılığı (genellikle %80).<br><br>
      Gerekli değerleri girdikten sonra "Örneklem Büyüklüğünü Hesapla" butonuna basın.
    `,
    'test-duration': `
      <strong>Test Süresi Tahmin Aracı</strong><br><br>
      Bu araç, A/B testinizin tahmini süresini hesaplamanıza yardımcı olur.<br><br>
      <u>Kullanım:</u><br>
      - <strong>Günlük Ziyaretçi Sayısı:</strong> Web sitenizin veya test sayfanızın günlük ortalama ziyaretçi sayısı.<br>
      - <strong>Gerekli Örneklem Büyüklüğü:</strong> Örneklem büyüklüğü hesaplama aracından elde ettiğiniz değer.<br><br>
      Gerekli değerleri girdikten sonra "Test Süresini Hesapla" butonuna basın.
    `
  };

  tabLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();

      // Aktif sekme ve içerikleri kaldır
      tabLinks.forEach(function(item) {
        item.classList.remove('active');
      });
      tabPanes.forEach(function(pane) {
        pane.classList.remove('active');
      });

      // Seçilen sekme ve içeriği aktif yap
      const targetTab = link.getAttribute('data-tab');
      link.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      // Info text içeriğini güncelle
      infoText.innerHTML = infoContents[targetTab];
    });
  });

});



