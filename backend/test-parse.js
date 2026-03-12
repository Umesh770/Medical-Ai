const text = 'HEMOGLOBIN Hemoglobin (Hb) 12.5 Low 13.0 - 17.0 g/dL RBC COUNT Total RBC count 5.2  4.5 - 5.5 mill/cumm BLOOD INDICES Packed Cell Volume (PCV) 57.5 High 40 - 50 % Mean Corpuscular Volume (MCV) 87.75 83-101 fL WBC COUNT Total WBC count 9000 4000-11000 cumm Platelet Count 150000 Borderline 150000-410000 cumm';

const normalized = text
    .toLowerCase()
    .replace(/[|:;,\n\r]/g, ' ')
    .replace(/(\d)\s+(\d)/g, '$1.$2')
    .replace(/\s+/g, ' ');

const keys = ['packed cell volume', 'pcv', 'hemoglobin', 'hb', 'wbc count', 'platelet count'];

for (const k of keys) {
    const idx = normalized.indexOf(k);
    if (idx !== -1) {
        const snippet = normalized.substring(idx + k.length, idx + k.length + 50);
        const numbers = snippet.match(/(\d+\.?\d*)/g);
        console.log(`Key '${k}' found. Snippet: '${snippet}'. Numbers:`, numbers);

        let bestVal = null;
        if (numbers) {
            for (const n of numbers) {
                const v = parseFloat(n);
                if (isNaN(v)) continue;
                if (v > 100000 && !k.includes('platelet')) continue; // skip huge numbers unless platelets
                if (v >= 1900 && v <= 2100) continue; // skip years

                bestVal = v;
                break;
            }
        }
        console.log(`-> Best Value: ${bestVal}`);
    }
}
