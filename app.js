/********************************************************
 * منصة اكتشاف الأنماط الفنية للعملات الرقمية
 * جميع النماذج الكلاسيكية المطلوبة + الأهداف + نافذة التفاصيل
 * يدعم الفلاتر - بيانات حية من منصة Binance
 * نسخة متكاملة احترافية
 ********************************************************/

// عناصر الواجهة
const grid = document.getElementById('cardsGrid');
const modal = document.getElementById('patternModal');
const modalDetails = document.getElementById('modalDetails');
const closeModal = document.getElementById('closeModal');
const timeframeSelect = document.getElementById('timeframe');
const patternFilterSelect = document.getElementById('patternFilter');

// قائمة الأنماط الفنية المطلوبة
const patternsList = [
  { name: "Double Bottom", ar: "القاع الثنائي" },
  { name: "Triple Top", ar: "القمة الثلاثية" },
  { name: "Triple Bottom", ar: "القاع الثلاثي" },
  { name: "Head & Shoulders", ar: "الرأس والكتفين" },
  { name: "Inverted Head & Shoulders", ar: "الرأس والكتفين المقلوب" },
  { name: "Symmetrical Triangle", ar: "المثلث المتماثل" },
  { name: "Ascending Triangle", ar: "المثلث الصاعد" },
  { name: "Descending Triangle", ar: "المثلث الهابط" },
  { name: "Boarding Pattern", ar: "النموذج المتباعد" },
  { name: "Rectangle", ar: "المستطيل" },
  { name: "Flags & Pennants", ar: "الأعلام والأعلام المثلثة" },
  { name: "Rising Wedge", ar: "الوتد الصاعد" },
  { name: "Falling Wedge", ar: "الوتد الهابط" },
  { name: "Rounding Tops", ar: "القمم المستديرة" },
  { name: "Rounding Bottoms", ar: "القيعان المستديرة" },
  { name: "V Top Pattern", ar: "القمة V" },
  { name: "V Bottom Pattern", ar: "القاع V" }
];

// قائمة العملات المستقرة
const stableCoins = [
  "USDT","BUSD","USDC","TUSD","DAI","USDP","EUR","FDUSD","TRY",
  "GBP","BRL","IDRT","UAH","RUB","NGN","ZAR","VAI","SUSD","WBTC",
  "PAX","PAXG","TRXUP","TRXDOWN"
];

let coinDataCache = {}; // { symbol: { ... } }
let cardsPatterns = {}; // { symbol: { type, breakoutConfirmed, ... } }


// ========== دوال المساعدة العامة ==========
async function fetchSpotSymbols() {
  const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
  const data = await res.json();
  return data.symbols.filter(s =>
      s.quoteAsset === "USDT" &&
      s.status === "TRADING" &&
      !stableCoins.includes(s.baseAsset)
  );
}
async function fetchPrices() {
  const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
  return await res.json();
}
async function fetchKlines(symbol, interval, limit=100) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  return await res.json();
}
function timeframeToBinance(tf) {
  switch(tf) {
    case '1d': return '1d';
    case '1h': return '1h';
    case '3h': return '3h';
    case '4h': return '4h';
    default: return '1d';
  }
}
function formatNumber(val, fixed=2) {
  return Number(val).toLocaleString('ar-EG', {maximumFractionDigits: fixed});
}
function getCoinLetter(name) {
  return name?.[0] ?? '';
}
function liquidityBar(val, max) {
  let percent = max ? Math.min((val/max)*100, 100) : 0;
  return `<div class="liquidity-bar-bg"><div class="liquidity-bar" style="width:${percent}%"></div></div>`;
}

// ========== جميع دوال اكتشاف النماذج الفنية المطلوبة ==========

// 1. Double Bottom
function detectDoubleBottom(klines) {
  if (!klines || klines.length < 30) return null;
  let lows = klines.map(k => parseFloat(k[3]));
  let highs = klines.map(k => parseFloat(k[2]));
  let closes = klines.map(k => parseFloat(k[4]));
  let found = null;
  for (let i = lows.length - 10; i > 10; i--) {
    let low2 = lows[i];
    let windowStart = Math.max(3, i - 15);
    let windowEnd = i - 5;
    for (let j = windowEnd; j >= windowStart; j--) {
      let low1 = lows[j];
      if (Math.abs(low1 - low2) / ((low1 + low2) / 2) < 0.015) {
        let peakHigh = Math.max(...highs.slice(j, i+1));
        if (peakHigh > Math.max(low1, low2) * 1.04) {
          let breakoutConfirmed = closes[closes.length-1] > peakHigh * 1.004;
          let priceNow = closes[closes.length-1];
          let target1 = priceNow * 1.05;
          let target2 = priceNow * 1.08;
          found = {
            type: 'Double Bottom',
            breakoutConfirmed,
            peakHigh,
            low1, low2,
            priceNow,
            target1, target2,
            patternStart: j,
            patternEnd: i
          };
          break;
        }
      }
    }
    if (found) break;
  }
  return found;
}

// 2. Triple Top
function detectTripleTop(klines) {
  if (!klines || klines.length < 30) return null;
  let highs = klines.map(k => parseFloat(k[2]));
  let closes = klines.map(k => parseFloat(k[4]));
  for (let i = highs.length - 12; i > 12; i--) {
    let h3 = highs[i];
    let wStart = Math.max(5, i-18), wEnd = i-4;
    for (let j=wEnd; j>=wStart; j--) {
      let h1 = highs[j];
      if (Math.abs(h1-h3)/((h1+h3)/2)<0.015) {
        for (let m=j+2; m<i-2; m++) {
          let h2 = highs[m];
          if (Math.abs(h2-h1)/((h2+h1)/2)<0.015) {
            let minLow = Math.min(...klines.slice(j,i+1).map(k=>parseFloat(k[3])));
            let breakoutConfirmed = closes[closes.length-1] < minLow*0.996;
            let priceNow = closes[closes.length-1];
            let target1 = priceNow * 0.95;
            let target2 = priceNow * 0.92;
            return {
              type: 'Triple Top',
              breakoutConfirmed, h1, h2, h3, priceNow,
              target1, target2,
              patternStart: j, patternEnd: i
            };
          }
        }
      }
    }
  }
  return null;
}

// 3. Triple Bottom
function detectTripleBottom(klines) {
  if (!klines || klines.length < 30) return null;
  let lows = klines.map(k => parseFloat(k[3]));
  let closes = klines.map(k => parseFloat(k[4]));
  for (let i = lows.length - 12; i > 12; i--) {
    let l3 = lows[i];
    let wStart = Math.max(5, i-18), wEnd = i-4;
    for (let j=wEnd; j>=wStart; j--) {
      let l1 = lows[j];
      if (Math.abs(l1-l3)/((l1+l3)/2)<0.015) {
        for (let m=j+2; m<i-2; m++) {
          let l2 = lows[m];
          if (Math.abs(l2-l1)/((l2+l1)/2)<0.015) {
            let maxHigh = Math.max(...klines.slice(j,i+1).map(k=>parseFloat(k[2])));
            let breakoutConfirmed = closes[closes.length-1] > maxHigh*1.004;
            let priceNow = closes[closes.length-1];
            let target1 = priceNow * 1.05;
            let target2 = priceNow * 1.08;
            return {
              type: 'Triple Bottom',
              breakoutConfirmed, l1, l2, l3, priceNow,
              target1, target2,
              patternStart: j, patternEnd: i
            };
          }
        }
      }
    }
  }
  return null;
}

// 4. Head & Shoulders
function detectHeadShoulders(klines) {
  if (!klines || klines.length < 35) return null;
  let highs = klines.map(k => parseFloat(k[2]));
  let closes = klines.map(k => parseFloat(k[4]));
  for (let i = highs.length - 10; i > 16; i--) {
    let ls = highs[i-6], h = highs[i-3], rs = highs[i];
    if (h > ls*1.06 && h > rs*1.06 && Math.abs(ls-rs)/((ls+rs)/2)<0.03) {
      let nl1 = Math.min(...klines.slice(i-6,i-3).map(k=>parseFloat(k[3])));
      let nl2 = Math.min(...klines.slice(i-3,i+1).map(k=>parseFloat(k[3])));
      let neckline = Math.max(nl1, nl2);
      let breakoutConfirmed = closes[closes.length-1] < neckline*0.997;
      let priceNow = closes[closes.length-1];
      let target1 = neckline - (h-neckline)*0.5;
      let target2 = neckline - (h-neckline)*0.8;
      return {
        type: 'Head & Shoulders',
        breakoutConfirmed, priceNow,
        target1, target2
      };
    }
  }
  return null;
}

// 5. Inverted Head & Shoulders
function detectInvHeadShoulders(klines) {
  if (!klines || klines.length < 35) return null;
  let lows = klines.map(k => parseFloat(k[3]));
  let closes = klines.map(k => parseFloat(k[4]));
  for (let i = lows.length - 10; i > 16; i--) {
    let ls = lows[i-6], h = lows[i-3], rs = lows[i];
    if (h < ls*0.94 && h < rs*0.94 && Math.abs(ls-rs)/((ls+rs)/2)<0.03) {
      let nh1 = Math.max(...klines.slice(i-6,i-3).map(k=>parseFloat(k[2])));
      let nh2 = Math.max(...klines.slice(i-3,i+1).map(k=>parseFloat(k[2])));
      let neckline = Math.min(nh1, nh2);
      let breakoutConfirmed = closes[closes.length-1] > neckline*1.002;
      let priceNow = closes[closes.length-1];
      let target1 = neckline + (neckline-h)*0.5;
      let target2 = neckline + (neckline-h)*0.8;
      return {
        type: 'Inverted Head & Shoulders',
        breakoutConfirmed, priceNow,
        target1, target2
      };
    }
  }
  return null;
}

// 6. Symmetrical Triangle
function detectSymTriangle(klines) {
  if (!klines || klines.length < 30) return null;
  let highs = klines.slice(-20).map(k=>parseFloat(k[2]));
  let lows = klines.slice(-20).map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let upperSlope = (highs[highs.length-1]-highs[0])/highs.length;
  let lowerSlope = (lows[lows.length-1]-lows[0])/lows.length;
  if (upperSlope<0 && lowerSlope>0) {
    let maxHigh = Math.max(...highs), minLow = Math.min(...lows);
    let breakoutConfirmed = closes[closes.length-1] > maxHigh*1.002 || closes[closes.length-1] < minLow*0.998;
    let priceNow = closes[closes.length-1];
    let target1 = priceNow * (breakoutConfirmed ? (closes[closes.length-1]>maxHigh?1.05:0.95) : 1);
    let target2 = priceNow * (breakoutConfirmed ? (closes[closes.length-1]>maxHigh?1.08:0.92) : 1);
    return {
      type: 'Symmetrical Triangle',
      breakoutConfirmed, priceNow,
      target1, target2
    };
  }
  return null;
}

// 7. Ascending Triangle
function detectAscTriangle(klines) {
  if (!klines || klines.length < 25) return null;
  let highs = klines.slice(-15).map(k=>parseFloat(k[2]));
  let lows = klines.slice(-15).map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let flatHigh = Math.max(...highs);
  let risingLows = lows[0]<lows[7] && lows[7]<lows[14];
  if (risingLows && highs.every(h=>Math.abs(h-flatHigh)/flatHigh<0.012)) {
    let breakoutConfirmed = closes[closes.length-1] > flatHigh*1.002;
    let priceNow = closes[closes.length-1];
    let target1 = priceNow * 1.05;
    let target2 = priceNow * 1.08;
    return {
      type: 'Ascending Triangle', breakoutConfirmed,
      priceNow, target1, target2
    };
  }
  return null;
}

// 8. Descending Triangle
function detectDescTriangle(klines) {
  if (!klines || klines.length < 25) return null;
  let highs = klines.slice(-15).map(k=>parseFloat(k[2]));
  let lows = klines.slice(-15).map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let flatLow = Math.min(...lows);
  let fallingHighs = highs[0]>highs[7] && highs[7]>highs[14];
  if (fallingHighs && lows.every(l=>Math.abs(l-flatLow)/flatLow<0.012)) {
    let breakoutConfirmed = closes[closes.length-1] < flatLow*0.998;
    let priceNow = closes[closes.length-1];
    let target1 = priceNow * 0.95;
    let target2 = priceNow * 0.92;
    return {
      type: 'Descending Triangle', breakoutConfirmed,
      priceNow, target1, target2
    };
  }
  return null;
}

// 9. Boarding Pattern (Broadening Pattern)
function detectBoardingPattern(klines) {
  if (!klines || klines.length < 35) return null;
  let highs = klines.slice(-20).map(k=>parseFloat(k[2]));
  let lows = klines.slice(-20).map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let upperSlope = (highs[highs.length-1]-highs[0])/highs.length;
  let lowerSlope = (lows[lows.length-1]-lows[0])/lows.length;
  if (upperSlope>0.02 && lowerSlope<-0.02) {
    let priceNow = closes[closes.length-1];
    let target1 = priceNow * 1.05;
    let target2 = priceNow * 1.08;
    return {
      type: 'Boarding Pattern',
      breakoutConfirmed: false,
      priceNow, target1, target2
    };
  }
  return null;
}

// 10. Rectangle
function detectRectangle(klines) {
  if (!klines || klines.length < 25) return null;
  let highs = klines.slice(-15).map(k=>parseFloat(k[2]));
  let lows = klines.slice(-15).map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let maxHigh = Math.max(...highs), minLow = Math.min(...lows);
  if (highs.every(h=>Math.abs(h-maxHigh)/maxHigh<0.01) && lows.every(l=>Math.abs(l-minLow)/minLow<0.01)) {
    let priceNow = closes[closes.length-1];
    let breakoutConfirmed = priceNow > maxHigh*1.002 || priceNow < minLow*0.998;
    let target1 = priceNow * (breakoutConfirmed ? (priceNow>maxHigh?1.05:0.95) : 1);
    let target2 = priceNow * (breakoutConfirmed ? (priceNow>maxHigh?1.08:0.92) : 1);
    return {
      type: 'Rectangle', breakoutConfirmed,
      priceNow, target1, target2
    };
  }
  return null;
}

// 11. Flags & Pennants (مبسطة)
function detectFlagsPennants(klines) {
  if (!klines || klines.length < 25) return null;
  let closes = klines.map(k=>parseFloat(k[4]));
  let movement = closes[closes.length-15] / closes[closes.length-25];
  if (movement>1.12 || movement<0.88) {
    let flagRange = Math.max(...closes.slice(-10)) - Math.min(...closes.slice(-10));
    let flagCenter = (Math.max(...closes.slice(-10)) + Math.min(...closes.slice(-10))) / 2;
    if (flagRange/flagCenter < 0.03) {
      let priceNow = closes[closes.length-1];
      let target1 = priceNow * (movement>1?1.05:0.95);
      let target2 = priceNow * (movement>1?1.08:0.92);
      return {
        type: 'Flags & Pennants',
        breakoutConfirmed: false,
        priceNow, target1, target2
      };
    }
  }
  return null;
}

// 12. Rising Wedge
function detectRisingWedge(klines) {
  if (!klines || klines.length < 20) return null;
  let highs = klines.slice(-12).map(k=>parseFloat(k[2]));
  let lows = klines.slice(-12).map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let risingHighs = highs[0]<highs[5] && highs[5]<highs[11];
  let risingLows = lows[0]<lows[5] && lows[5]<lows[11];
  let priceNow = closes[closes.length-1];
  if (risingHighs && risingLows &&
    (highs[11]-highs[0])/(lows[11]-lows[0]) < 1.1) {
    let breakoutConfirmed = priceNow < lows[0]*0.998;
    let target1 = priceNow * 0.95;
    let target2 = priceNow * 0.92;
    return {
      type: 'Rising Wedge', breakoutConfirmed,
      priceNow, target1, target2
    };
  }
  return null;
}

// 13. Falling Wedge
function detectFallingWedge(klines) {
  if (!klines || klines.length < 20) return null;
  let highs = klines.slice(-12).map(k=>parseFloat(k[2]));
  let lows = klines.slice(-12).map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let fallingHighs = highs[0]>highs[5] && highs[5]>highs[11];
  let fallingLows = lows[0]>lows[5] && lows[5]>lows[11];
  let priceNow = closes[closes.length-1];
  if (fallingHighs && fallingLows &&
    (highs[0]-highs[11])/(lows[0]-lows[11]) < 1.1) {
    let breakoutConfirmed = priceNow > highs[0]*1.002;
    let target1 = priceNow * 1.05;
    let target2 = priceNow * 1.08;
    return {
      type: 'Falling Wedge', breakoutConfirmed,
      priceNow, target1, target2
    };
  }
  return null;
}

// 14. Rounding Tops
function detectRoundingTops(klines) {
  if (!klines || klines.length < 25) return null;
  let highs = klines.map(k=>parseFloat(k[2]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let mid = Math.floor(highs.length/2);
  if (highs[0]<highs[mid] && highs[mid]>highs[highs.length-1]) {
    let breakoutConfirmed = closes[closes.length-1] < Math.min(...klines.slice(-5).map(k=>parseFloat(k[3]))) * 0.998;
    let priceNow = closes[closes.length-1];
    let target1 = priceNow * 0.95;
    let target2 = priceNow * 0.92;
    return {
      type: 'Rounding Tops', breakoutConfirmed, priceNow, target1, target2
    };
  }
  return null;
}

// 15. Rounding Bottoms
function detectRoundingBottoms(klines) {
  if (!klines || klines.length < 25) return null;
  let lows = klines.map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let mid = Math.floor(lows.length/2);
  if (lows[0]>lows[mid] && lows[mid]<lows[lows.length-1]) {
    let breakoutConfirmed = closes[closes.length-1] > Math.max(...klines.slice(-5).map(k=>parseFloat(k[2]))) * 1.002;
    let priceNow = closes[closes.length-1];
    let target1 = priceNow * 1.05;
    let target2 = priceNow * 1.08;
    return {
      type: 'Rounding Bottoms', breakoutConfirmed, priceNow, target1, target2
    };
  }
  return null;
}

// 16. V Top Pattern
function detectVTop(klines) {
  if (!klines || klines.length < 15) return null;
  let highs = klines.map(k=>parseFloat(k[2]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let idx = highs.length-1;
  if (highs[idx-2]>highs[idx-4]*1.08 && highs[idx-2]>highs[idx]*1.07) {
    let breakoutConfirmed = closes[closes.length-1]<highs[idx-2]*0.96;
    let priceNow = closes[closes.length-1];
    let target1 = priceNow * 0.95;
    let target2 = priceNow * 0.92;
    return {
      type: 'V Top Pattern', breakoutConfirmed, priceNow, target1, target2
    };
  }
  return null;
}

// 17. V Bottom Pattern
function detectVBottom(klines) {
  if (!klines || klines.length < 15) return null;
  let lows = klines.map(k=>parseFloat(k[3]));
  let closes = klines.map(k=>parseFloat(k[4]));
  let idx = lows.length-1;
  if (lows[idx-2]<lows[idx-4]*0.92 && lows[idx-2]<lows[idx]*0.93) {
    let breakoutConfirmed = closes[closes.length-1]>lows[idx-2]*1.04;
    let priceNow = closes[closes.length-1];
    let target1 = priceNow * 1.05;
    let target2 = priceNow * 1.08;
    return {
      type: 'V Bottom Pattern', breakoutConfirmed, priceNow, target1, target2
    };
  }
  return null;
}

// ========== قائمة جميع دوال الاكتشاف ==========

const patternDetectors = [
  detectDoubleBottom,         // 1
  detectTripleTop,            // 2
  detectTripleBottom,         // 3
  detectHeadShoulders,        // 4
  detectInvHeadShoulders,     // 5
  detectSymTriangle,          // 6
  detectAscTriangle,          // 7
  detectDescTriangle,         // 8
  detectBoardingPattern,      // 9
  detectRectangle,            // 10
  detectFlagsPennants,        // 11
  detectRisingWedge,          // 12
  detectFallingWedge,         // 13
  detectRoundingTops,         // 14
  detectRoundingBottoms,      // 15
  detectVTop,                 // 16
  detectVBottom               // 17
];

// ========== المنطق الرئيسي لعرض البطاقات وتحليل كل الأنماط ==========

async function loadData() {
  grid.innerHTML = `<div style='grid-column: 1/-1;text-align:center;color:#f2b705;font-size:1.5rem;padding:80px 0;'>يتم تحميل البيانات الحية من بينانس...</div>`;
  const [symbols, prices] = await Promise.all([fetchSpotSymbols(), fetchPrices()]);
  const priceMap = {};
  for (let p of prices) { priceMap[p.symbol] = p; }
  const maxLiquidity = Math.max(...symbols.map(s => priceMap[s.symbol]?.quoteVolume || 0));
  const timeframe = timeframeToBinance(timeframeSelect.value);
  const filterPattern = patternFilterSelect.value;
  const displaySymbols = symbols.slice(0, 20);

  coinDataCache = {};
  cardsPatterns = {};

  grid.innerHTML = '';
  for (const s of displaySymbols) {
    const coin = {
      name: s.baseAsset,
      symbol: s.symbol,
      logo: getCoinLetter(s.baseAsset),
      price: priceMap[s.symbol]?.lastPrice ?? 0,
      change: priceMap[s.symbol]?.priceChangePercent ?? 0,
      liquidity: priceMap[s.symbol]?.quoteVolume ?? 0,
      volume: priceMap[s.symbol]?.volume ?? 0,
    };
    coinDataCache[s.symbol] = coin;
    let patternObj = null;
    try {
      const klines = await fetchKlines(s.symbol, timeframe, 80);
      for (let detect of patternDetectors) {
        let detected = detect(klines);
        if (detected) {
          patternObj = detected;
          patternObj.type = detected.type;
          cardsPatterns[s.symbol] = detected;
          break;
        }
      }
    } catch(e) { }
    if (filterPattern !== "all" && (!patternObj || patternObj.type !== filterPattern)) {
      renderCard(coin, null);
    } else {
      renderCard(coin, patternObj);
    }
  }
}

// رسم البطاقة
function renderCard(coin, patternObj) {
  const change = parseFloat(coin.change);
  const up = change >= 0;
  const patternRow = patternObj ? `
    <div class="pattern-row">
      ${patternsList.find(p=>p.name===patternObj.type)?.ar || patternObj.type}
      <span class="pattern-status">${patternObj.breakoutConfirmed ? "تم الاختراق" : "بانتظار تحقق الاختراق"}</span>
    </div>
  ` : `
    <div class="pattern-row no-pattern">لا يتوفر نموذج فني حاليا</div>
  `;
  const html = `
    <div class="card" tabindex="0" onclick="showPatternDetails('${coin.symbol}')">
      <div class="coin-logo">${coin.logo}</div>
      <div class="coin-name">${coin.name}</div>
      <div class="price-row">
        <span class="coin-price">${formatNumber(coin.price)}</span>
        <span class="price-change ${up?'price-up':'price-down'}">
          <span class="price-arrow">${up ? '▲' : '▼'}</span>
          ${formatNumber(coin.change,2)}%
        </span>
      </div>
      <div class="liquidity-row">
        ${liquidityBar(coin.liquidity, 50000000)}
        <span class="liquidity-val">السيولة: ${formatNumber(coin.liquidity)}</span>
      </div>
      <div class="volume-row">
        حجم التداول: ${formatNumber(coin.volume)}
      </div>
      ${patternRow}
    </div>
  `;
  grid.innerHTML += html;
}

// نافذة التفاصيل
window.showPatternDetails = function(symbol) {
  const coin = coinDataCache[symbol];
  const patternObj = cardsPatterns[symbol];
  if (!patternObj) {
    modalDetails.innerHTML = `
      <h2>${coin.name}</h2>
      <div class="pattern-info-row"><span>رمز العملة:</span> ${coin.symbol}</div>
      <div class="pattern-info-row"><span>لا يوجد نموذج فني متاح حاليا</span></div>
    `;
  } else {
    modalDetails.innerHTML = `
      <h2>${patternsList.find(p=>p.name===patternObj.type)?.ar || patternObj.type}</h2>
      <div class="pattern-info-row"><span>رمز العملة:</span> ${coin.symbol}</div>
      <div class="pattern-info-row"><span>السعر الحالي:</span> ${formatNumber(coin.price)}</div>
      <div class="pattern-info-row"><span>النموذج:</span> ${patternsList.find(p=>p.name===patternObj.type)?.ar || patternObj.type}</div>
      <div class="pattern-info-row"><span>حالة النموذج:</span> ${patternObj.breakoutConfirmed ? "تم الاختراق" : "بانتظار تحقق الاختراق"}</div>
      <div class="targets">
        <h3>الأهداف:</h3>
        <div class="target-row">هدف أول (5%): <span>${formatNumber(patternObj.target1)}</span></div>
        <div class="target-row">هدف ثاني (8%): <span>${formatNumber(patternObj.target2)}</span></div>
      </div>
      <div style="margin-top:12px; color:#d7d7d7;">تم اكتشاف النموذج باستخدام بيانات منصة Binance الفعلية.</div>
    `;
  }
  modal.classList.add('active');
};
closeModal.onclick = ()=> modal.classList.remove('active');
window.onclick = (e)=>{
  if(e.target===modal) modal.classList.remove('active');
}

timeframeSelect.onchange = loadData;
patternFilterSelect.onchange = loadData;

// تحميل البيانات عند بدء الصفحة
loadData();
