/* Investing Learning Lab - Stage 6 tools (INV-043 to INV-048) - V1.3 (October 2026)
   Namiranian, Babak. Loaded after assets/inv-tools.js. Every tool computes in the browser.
   Embedded data (annual %, January-December):
   - ff, ff5, bm, dp, vol, beta, op: Kenneth R. French Data Library (Tuck School of Business,
     Dartmouth), files created from the 202607 CRSP database, downloaded September 2026.
     mkt = Mkt-RF + RF (value-weight US market). smb, hml, mom, rmw, cma = long-short factors.
     bm = value-weight Lo 30 (growth) and Hi 30 (value) book-to-market portfolios.
     dp = value-weight non-payers, Lo 30 and Hi 30 dividend-yield portfolios.
     vol = value-weight lowest and highest 20% by past return variance; beta likewise by beta.
     op = value-weight Lo 30 (weak) and Hi 30 (robust) operating-profitability portfolios.
   - dy: S&P Composite dividend yield each December (12-month dividends / price), Shiller,
     ie_data.xls (shillerdata.com), downloaded September 2026.
   - spivaYear, spiva: S&P Dow Jones Indices, SPIVA U.S. Scorecard Mid-Year 2026 (data to
     June 30, 2026), Exhibit 1 and Reports 1a, 2, 6a and 11a. u = % of funds underperforming
     at [6 months, 1, 3, 5, 10, 15, 20 years]; s = % of funds that survived the same periods. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;
  var D = INV.s6a = {"ff":{"y0":1927,"mkt":[32.56,39.12,-14.83,-28.73,-43.77,-8.64,56.79,3.25,45.04,32.16,-34.7,28.2,2.52,-7.2,-10.52,16.48,28.36,21.35,38.75,-6.39,3.44,1.85,20.18,30.04,20.69,13.47,0.72,50.31,25.35,8.33,-10.02,44.97,12.72,1.19,26.98,-10.19,20.96,16.09,14.45,-8.79,28.71,14.12,-10.94,0.09,16.17,16.91,-19.32,-27.82,38.35,26.98,-3.13,8.24,23.45,33.2,-3.26,21.47,22.54,3.86,32.63,16.43,1.63,17.98,28.82,-6.05,34.82,9.78,11.16,-0.15,36.85,21.21,31.26,24.25,25.23,-11.59,-11.2,-21.12,31.69,11.95,6.11,15.37,5.73,-36.65,28.65,17.44,0.52,16.36,35.18,11.76,0.22,13.56,22.3,-5.01,30.57,24.03,23.91,-19.9,26.7,25.02,17.55],"rf":[3.12,3.56,4.75,2.41,1.07,0.96,0.3,0.16,0.17,0.18,0.31,-0.02,0.02,0.0,0.06,0.27,0.35,0.33,0.33,0.35,0.5,0.81,1.1,1.2,1.49,1.66,1.82,0.86,1.57,2.46,3.14,1.54,2.95,2.66,2.13,2.73,3.12,3.54,3.93,4.76,4.21,5.21,6.58,6.52,4.39,3.84,6.93,8.0,5.8,5.08,5.12,7.18,10.38,11.24,14.71,10.54,8.8,9.85,7.72,6.16,5.47,6.35,8.37,7.81,5.6,3.51,2.9,3.9,5.6,5.21,5.26,4.86,4.68,5.89,3.83,1.65,1.02,1.2,2.98,4.8,4.66,1.6,0.1,0.12,0.04,0.06,0.02,0.02,0.02,0.2,0.8,1.81,2.14,0.44,0.04,1.42,4.95,5.26,4.25],"smb":[-3.05,3.73,-30.68,-5.53,3.21,5.17,44.61,25.82,10.6,18.03,-14.14,9.33,5.72,1.21,-3.84,4.98,33.44,18.12,25.95,-3.63,-6.98,-9.22,3.81,0.76,-5.26,-6.75,-1.17,-2.2,-6.35,-0.9,-2.72,14.52,5.37,-3.06,1.06,-7.95,-6.02,-1.09,21.81,2.88,50.1,24.25,-13.94,-11.79,5.7,-12.16,-23.36,-0.64,14.99,14.66,22.74,14.3,20.87,5.3,6.72,8.2,13.94,-8.27,-0.02,-9.56,-10.82,5.43,-12.61,-13.92,16.08,7.67,6.55,-0.36,-9.81,-4.64,-7.83,-24.95,13.74,-4.17,17.75,3.97,26.32,4.34,-2.56,0.11,-7.61,2.52,8.83,13.87,-5.72,-1.26,7.61,-7.69,-3.85,6.57,-5.21,-3.13,-6.48,13.48,-3.79,-6.99,-3.53,-11.31,-10.79],"hml":[-3.36,-5.26,11.86,-11.76,-13.92,11.49,31.28,-27.15,10.11,34.57,-3.73,-11.78,-18.73,-1.59,11.19,19.69,38.7,16.24,11.2,3.08,9.72,3.65,-4.21,27.06,-6.11,3.53,-7.71,26.18,5.23,-2.04,-6.24,13.45,1.78,-4.28,5.36,8.78,15.38,9.72,7.42,-1.09,-8.27,18.17,-10.03,21.41,-10.94,1.46,17.5,9.65,9.36,24.26,7.52,0.52,-2.37,-24.14,24.88,12.99,20.43,18.8,0.89,9.55,-1.26,14.65,-4.29,-10.11,-14.64,24.34,17.06,-0.83,5.71,8.65,18.29,-10.71,-28.6,45.37,19.09,8.67,4.64,7.64,9.52,11.72,-16.82,1.19,-8.2,-5.34,-8.31,10.0,2.59,-1.85,-9.48,22.8,-13.42,-9.63,-10.36,-46.94,25.6,25.7,-13.98,-8.43,8.71],"mom":[24.52,26.43,19.76,24.09,23.16,-20.49,18.82,18.71,21.03,6.54,-3.97,-3.37,-0.25,6.21,10.05,-16.55,14.45,9.79,16.16,5.82,14.89,11.48,0.49,15.15,11.07,9.07,16.19,10.23,14.14,19.07,10.04,-9.52,19.47,17.06,11.07,11.95,11.59,4.38,20.05,9.9,21.82,2.81,10.21,-4.07,3.37,15.21,29.5,8.37,-19.17,7.46,18.09,11.73,26.22,36.26,-8.12,34.07,-9.68,9.28,14.63,10.55,-3.87,-5.65,27.35,18.61,14.3,3.34,23.65,3.11,17.83,6.28,11.34,24.06,34.03,14.87,4.95,25.65,-24.62,-0.51,14.99,-7.69,21.81,13.72,-83.48,6.77,7.28,1.07,7.36,0.85,20.21,-21.23,4.8,9.5,-2.09,7.34,-2.32,15.93,-24.31,19.72,-2.27]},"ff5":{"y0":1964,"rmw":[-2.76,-0.8,-0.16,9.54,-13.9,11.69,-3.3,10.4,8.22,-8.92,-4.39,0.96,-6.32,2.22,5.03,-3.19,13.91,-1.18,-4.06,0.67,15.21,11.77,6.67,6.41,3.08,2.81,7.74,12.28,7.34,-7.08,5.91,1.86,15.31,8.99,3.04,-28.93,23.59,18.33,21.0,-20.54,8.45,1.67,3.4,4.54,14.75,2.88,-1.28,13.58,-5.63,-3.61,1.15,0.98,4.6,4.53,-1.33,3.81,-5.21,26.72,6.63,6.19,5.11,-10.85],"cma":[6.49,-3.79,-0.99,-16.22,16.9,-4.82,23.87,-6.17,-3.19,6.82,22.85,0.53,7.54,-0.2,4.18,-1.19,-11.2,10.62,17.55,16.47,3.42,-3.18,10.48,6.81,9.2,7.33,0.92,-15.19,7.11,12.1,3.82,2.61,0.71,5.4,-4.04,-6.93,29.98,13.16,14.19,15.63,-7.36,-4.62,8.46,-7.36,3.19,-1.63,9.92,-0.93,9.06,1.31,-1.62,-8.68,9.5,-11.27,0.15,-2.98,-11.7,11.67,22.53,-20.88,-10.04,-5.33]},"bm":{"y0":1927,"growth":[43.94,45.83,-19.64,-26.24,-36.07,-6.9,44.19,8.75,43.51,26.5,-34.97,33.9,7.78,-10.09,-14.03,14.31,21.15,16.15,33.42,-9.75,2.73,2.77,23.34,23.46,20.33,12.9,2.35,47.47,28.51,7.08,-8.83,41.66,13.05,-2.6,26.23,-11.08,21.58,14.28,13.99,-10.65,30.86,5.56,0.05,-6.78,24.59,20.6,-22.58,-29.46,35.44,18.16,-8.22,7.61,19.6,36.87,-7.96,21.86,15.33,-2.98,32.2,13.03,4.94,12.02,34.1,-0.86,43.78,6.26,2.08,0.62,36.44,20.74,30.36,36.2,27.07,-13.24,-14.11,-23.48,28.06,8.61,4.37,10.99,12.27,-34.27,30.57,15.7,3.67,15.29,33.65,13.2,4.0,9.0,29.14,-0.26,33.74,36.62,24.8,-25.76,37.37,29.52,17.85],"value":[34.23,34.51,-9.65,-44.13,-54.99,1.27,125.03,-14.56,50.22,50.09,-42.28,27.34,-10.92,-7.0,-3.77,34.41,51.03,41.48,52.63,-7.51,8.3,3.75,18.23,55.88,13.44,17.46,-6.64,74.86,28.53,4.01,-20.96,72.92,18.38,-7.63,29.66,-4.51,31.62,19.64,26.33,-9.64,41.2,31.18,-17.91,10.17,13.85,16.99,-8.24,-23.01,54.94,50.18,8.45,9.81,26.17,17.26,14.79,29.18,29.95,14.98,31.56,20.9,-2.53,26.07,28.26,-15.43,29.34,25.93,20.75,-6.52,42.92,23.31,37.83,13.0,6.61,28.96,6.76,-21.46,35.9,20.07,13.37,21.64,-3.3,-37.28,21.29,10.45,-10.02,27.6,40.42,9.88,-8.12,27.26,17.04,-14.49,25.9,-2.66,38.03,3.15,13.34,18.55,29.63]},"dp":{"y0":1928,"none":[51.05,-31.01,-45.96,-50.88,6.35,74.25,-7.33,64.1,51.37,-48.75,37.0,-4.95,-11.89,-16.6,32.96,81.95,42.49,87.18,-16.23,-12.8,-4.95,25.27,40.32,12.13,9.2,-5.59,60.31,16.76,-0.72,-21.17,57.33,13.33,-7.14,20.12,-22.91,13.96,6.97,37.9,-4.0,84.72,20.11,-20.94,-23.05,17.07,3.37,-41.78,-41.19,64.26,35.06,10.99,26.71,58.56,60.73,-16.04,12.86,17.45,-12.43,27.26,3.1,-5.1,14.99,23.46,-17.19,53.69,10.86,16.64,-0.2,34.62,15.48,21.36,31.97,67.61,-30.63,-20.7,-30.75,45.57,11.68,5.71,13.16,9.3,-41.4,49.18,22.74,-4.06,20.99,39.29,9.89,6.08,6.27,28.53,-0.92,28.16,50.17,14.88,-37.34,44.12,28.51,10.11],"low":[46.25,-11.62,-23.6,-38.83,-13.46,55.18,-1.96,45.41,41.36,-31.22,26.43,-2.88,-11.43,-7.64,11.64,21.23,16.47,38.06,-8.07,3.43,0.66,17.47,25.46,22.28,11.61,4.36,47.06,27.66,9.35,-8.08,40.08,14.66,-2.53,22.46,-18.99,20.04,12.06,22.29,-5.46,38.05,5.46,1.28,-9.84,24.07,24.02,-17.87,-32.19,31.55,15.04,-6.99,11.74,34.05,48.78,-11.59,17.69,17.08,-5.16,33.22,14.8,5.63,12.85,27.61,-3.24,44.25,6.86,6.56,-1.36,31.96,26.05,30.88,34.96,19.59,-0.57,-9.88,-23.88,32.18,10.07,9.39,4.26,6.7,-44.24,36.74,11.27,-11.88,20.79,39.26,9.76,-1.16,6.27,28.24,-8.8,35.8,29.82,33.21,-21.94,38.12,35.37,24.46],"high":[31.98,-19.07,-42.98,-53.52,13.67,84.5,5.09,46.04,17.32,-40.78,40.35,-0.92,-0.31,-19.95,36.29,39.24,34.57,43.53,-4.4,-1.02,2.36,22.49,33.22,19.61,15.68,-7.88,64.79,27.18,6.43,-20.0,61.27,12.7,3.34,31.92,-0.25,28.55,22.66,13.71,-16.61,22.86,20.83,-14.96,19.36,7.32,14.82,-12.88,-20.1,48.83,40.11,3.42,3.59,13.17,16.23,13.42,23.65,26.5,16.59,32.13,23.38,1.48,22.85,27.94,-6.98,23.63,12.96,15.12,0.23,39.92,18.76,36.33,19.18,-10.72,27.72,6.18,-7.32,27.2,15.15,3.05,19.15,-1.32,-33.01,13.87,18.54,13.97,11.78,27.69,11.55,-1.14,20.93,10.64,-5.8,21.42,-2.67,32.82,7.71,10.52,15.97,18.34]},"vol":{"y0":1964,"low":[15.7,5.59,-10.86,21.7,13.2,-4.79,7.06,15.72,19.16,-15.9,-24.92,29.55,26.0,-3.74,5.16,10.19,23.05,10.43,27.77,24.41,10.69,36.88,23.16,0.07,18.58,29.02,-1.27,27.77,9.39,12.04,0.26,42.42,18.95,36.8,11.25,1.06,11.58,-6.16,-12.1,19.86,10.12,2.67,16.17,6.79,-24.34,18.35,12.05,10.67,13.27,29.6,14.32,0.51,11.79,24.54,3.82,27.0,21.81,29.08,-1.12,8.06,15.96,8.48],"high":[8.0,49.32,-5.22,75.83,19.44,-32.65,-32.55,11.68,-2.9,-45.5,-35.91,55.95,45.62,8.96,11.44,40.84,39.69,-20.85,1.17,15.28,-16.71,12.97,-4.93,-9.33,13.11,8.12,-25.49,53.61,13.48,15.68,-4.27,32.0,8.63,13.9,21.34,92.78,-37.06,-35.41,-42.61,77.16,10.56,6.5,10.1,-1.75,-59.77,61.63,27.93,-24.64,15.15,45.34,2.94,-13.2,14.96,17.87,-13.45,25.16,49.04,-7.3,-42.83,77.57,34.72,34.48]},"beta":{"y0":1964,"low":[17.14,8.86,-9.55,13.41,15.68,-12.72,8.73,12.49,22.01,-11.02,-24.73,30.59,29.78,-1.7,6.15,24.09,29.61,6.59,32.23,15.91,14.49,37.07,29.55,2.31,18.13,33.1,-1.67,22.08,4.72,12.14,-2.03,35.32,16.51,28.79,20.66,-5.74,27.33,-7.92,-9.65,18.07,10.76,4.68,15.66,3.49,-28.47,9.47,11.85,12.48,11.63,27.14,17.5,4.17,8.33,18.13,-2.23,27.88,5.11,18.45,-7.35,2.08,12.07,12.99],"high":[14.67,48.05,-1.94,49.45,23.66,-22.42,-19.28,22.59,-1.59,-42.71,-32.62,77.07,31.47,7.88,23.9,33.06,45.92,-5.97,9.41,17.83,-13.21,24.49,4.53,-9.58,13.6,24.56,-7.6,54.2,17.61,16.86,2.06,38.38,29.17,27.15,26.05,51.35,-26.56,-25.08,-33.98,54.05,4.14,2.09,8.41,6.82,-49.28,90.8,34.39,-17.9,25.34,44.48,-2.12,-15.41,28.53,24.1,-16.43,32.11,46.87,28.35,-39.48,74.95,95.85,17.83]},"op":{"y0":1964,"weak":[21.86,19.47,-6.15,20.97,22.82,-20.0,4.02,12.23,8.21,-15.07,-27.9,42.9,31.7,-3.16,4.08,25.49,22.94,0.99,31.25,24.36,-7.89,27.86,12.29,-2.97,15.51,27.26,-14.22,31.68,8.49,21.05,-3.49,34.76,9.91,24.19,20.0,43.93,-27.48,-21.65,-34.66,46.84,11.56,5.67,13.57,1.89,-46.16,32.86,20.01,-13.63,21.99,42.3,9.74,-3.41,12.7,17.33,-9.07,24.36,28.35,4.73,-23.33,26.76,15.58,21.36],"robust":[15.95,20.54,-8.85,34.93,6.62,-2.71,-3.6,20.88,24.45,-19.32,-31.29,38.63,24.45,-5.53,9.51,22.1,38.07,-7.73,22.04,22.5,6.84,33.36,16.61,5.35,18.41,30.5,-2.8,43.94,9.6,5.16,1.23,41.79,26.38,34.23,30.77,17.16,-5.2,-5.92,-18.41,23.3,12.06,4.23,15.7,11.65,-28.63,28.43,15.56,5.1,12.9,31.86,14.1,1.54,12.54,25.67,-2.2,34.68,28.97,25.8,-18.07,32.17,26.19,16.53]},"dy":{"y0":1927,"v":[4.41,3.67,4.53,6.32,9.72,7.33,4.41,4.86,3.6,4.22,7.26,4.02,5.01,6.36,8.11,6.2,5.31,4.89,3.81,4.69,5.59,6.12,6.89,7.44,6.02,5.41,5.84,4.4,3.61,3.75,4.44,3.27,3.1,3.43,2.82,3.4,3.07,2.98,2.97,3.53,3.06,2.88,3.47,3.49,3.1,2.68,3.57,5.37,4.15,3.87,4.98,5.28,5.24,4.61,5.36,4.93,4.31,4.58,3.81,3.33,3.66,3.53,3.17,3.68,3.14,2.84,2.7,2.89,2.24,2.0,1.61,1.36,1.17,1.22,1.37,1.79,1.61,1.62,1.76,1.76,1.87,3.24,2.02,1.83,2.13,2.2,1.94,1.92,2.11,2.03,1.84,2.09,1.83,1.58,1.29,1.71,1.5,1.24,1.16]},"spivaYear":{"y0":2001,"v":[65,68,75,69,49,68,45,56,48,66,82,63,55,87,65,66,63,65,71,60,85,51,60,65,79],"h1_2026":67},"spiva":[{"n":"All Domestic Funds","g":"US equity","u":[48.25,60.82,79.31,91.4,88.19,93.25,94.89],"s":[97.98,95.35,87.13,86.14,65.93,52.18,37.85],"n20":2190,"b":"S&P Composite 1500"},{"n":"All Large-Cap Funds","g":"US equity","u":[67.18,78.69,76.63,89.32,83.33,90.49,92.61],"s":[98.81,96.8,84.25,88.74,68.75,53.01,36.52],"n20":690,"b":"S&P 500"},{"n":"All Mid-Cap Funds","g":"US equity","u":[74.39,76.21,72.26,76.95,78.38,87.72,90.53],"s":[97.92,95.52,89.73,84.4,61.26,49.1,37.11],"n20":380,"b":"S&P MidCap 400"},{"n":"All Small-Cap Funds","g":"US equity","u":[68.5,68.5,54.76,55.58,71.08,91.12,91.16],"s":[98.29,96.2,90.1,85.46,65.43,53.43,38.55],"n20":498,"b":"S&P SmallCap 600"},{"n":"All Multi-Cap Funds","g":"US equity","u":[53.44,63.87,76.01,88.03,86.66,92.49,93.57],"s":[96.47,92.47,87.16,84.49,64.7,51.56,39.23],"n20":622,"b":"S&P Composite 1500"},{"n":"Large-Cap Growth Funds","g":"US equity","u":[84.91,91.84,95.44,95.48,93.02,100.0,99.52],"s":[99.3,97.87,91.7,90.5,71.32,51.62,29.81],"n20":208,"b":"S&P 500 Growth"},{"n":"Large-Cap Core Funds","g":"US equity","u":[71.17,79.1,84.05,82.55,90.13,95.53,94.38],"s":[98.93,96.64,72.76,90.57,71.05,52.36,36.7],"n20":267,"b":"S&P 500"},{"n":"Large-Cap Value Funds","g":"US equity","u":[29.45,45.8,41.09,77.69,82.29,92.19,86.05],"s":[98.18,95.8,90.7,85.77,64.86,55.31,42.79],"n20":215,"b":"S&P 500 Value"},{"n":"Mid-Cap Growth Funds","g":"US equity","u":[88.62,93.55,83.72,90.84,70.55,84.0,92.97],"s":[95.93,92.74,88.37,84.73,65.07,52.57,32.43],"n20":185,"b":"S&P MidCap 400 Growth"},{"n":"Mid-Cap Core Funds","g":"US equity","u":[69.44,67.86,70.8,65.91,87.3,90.37,93.46],"s":[99.07,97.32,91.15,80.68,55.56,42.22,37.38],"n20":107,"b":"S&P MidCap 400"},{"n":"Mid-Cap Value Funds","g":"US equity","u":[44.83,55.56,62.0,61.9,83.61,90.12,86.36],"s":[100.0,98.15,90.0,88.89,63.93,53.09,46.59],"n20":88,"b":"S&P MidCap 400 Value"},{"n":"Small-Cap Growth Funds","g":"US equity","u":[77.51,60.92,63.92,75.26,65.98,88.02,92.39],"s":[99.41,97.7,92.27,87.63,69.59,51.61,35.53],"n20":197,"b":"S&P SmallCap 600 Growth"},{"n":"Small-Cap Core Funds","g":"US equity","u":[68.47,69.57,54.24,47.06,75.29,92.4,95.22],"s":[97.97,95.32,88.19,84.03,62.55,53.99,39.71],"n20":209,"b":"S&P SmallCap 600"},{"n":"Small-Cap Value Funds","g":"US equity","u":[57.14,79.63,46.0,30.0,78.95,94.87,95.65],"s":[96.83,96.3,92.0,84.29,64.91,55.56,42.39],"n20":92,"b":"S&P SmallCap 600 Value"},{"n":"Multi-Cap Growth Funds","g":"US equity","u":[63.71,73.39,81.58,93.85,92.24,93.84,96.53],"s":[96.77,92.74,88.16,83.8,68.04,51.66,36.11],"n20":144,"b":"S&P Composite 1500 Growth"},{"n":"Multi-Cap Core Funds","g":"US equity","u":[58.99,65.67,76.71,85.38,93.68,96.0,94.44],"s":[95.85,90.56,86.76,83.96,64.43,54.4,40.2],"n20":306,"b":"S&P Composite 1500"},{"n":"Multi-Cap Value Funds","g":"US equity","u":[28.76,36.12,38.01,69.31,80.0,90.0,90.7],"s":[96.9,94.27,86.88,85.64,59.17,42.5,40.12],"n20":172,"b":"S&P Composite 1500 Value"},{"n":"Real Estate Funds","g":"US equity","u":[92.42,94.12,92.21,97.5,84.95,91.67,94.74],"s":[100.0,97.06,80.52,73.75,59.14,62.5,44.74],"n20":76,"b":"S&P United States REIT"},{"n":"Global Funds","g":"International equity","b":"S&P World","u":[53.04,65.99,80.17,91.19,91.39,94.71,94.39]},{"n":"International Funds","g":"International equity","b":"S&P World Ex-U.S.","u":[49.02,61.58,69.85,78.65,87.1,90.19,90.57]},{"n":"International Small-Cap Funds","g":"International equity","b":"S&P Developed Ex-U.S. SmallCap","u":[34.72,68.57,62.82,61.54,76.47,74.07,80.43]},{"n":"Emerging Markets Funds","g":"International equity","b":"S&P Emerging Plus","u":[38.39,43.06,63.43,71.36,84.9,84.97,90.91]},{"n":"Investment-Grade Intermediate Funds","g":"Bonds","b":"Bloomberg U.S. Aggregate","u":[42.77,54.04,45.33,61.11,54.48,79.26,87.33]},{"n":"High Yield Funds","g":"Bonds","b":"iBoxx USD Liquid High Yield","u":[48.84,58.33,83.24,78.4,86.55,88.12,89.66]},{"n":"Mortgage-Backed Securities Funds","g":"Bonds","b":"Bloomberg U.S. Aggregate Securitized - MBS","u":[34.21,68.06,50.82,62.75,73.21,87.3,90.2]},{"n":"General Municipal Debt Funds","g":"Bonds","b":"S&P National AMT-Free Municipal Bond","u":[29.03,40.66,37.5,77.11,75.86,60.71,84.85]},{"n":"Emerging Market Debt Funds","g":"Bonds","b":"Bloomberg Emerging Markets $ Aggregate","u":[22.64,28.3,39.29,42.19,70.31,95.56,84.21]}]}
;
  function shell(el, title, tag, inputs, out) {
    el.classList.add("tool");
    el.innerHTML = '<div class="tool-h"><b>' + esc(title) + '</b><span class="tag">' + esc(tag || "Calculator") + '</span></div><div class="tool-b"><div class="tool-in">' +
      inputs + '</div><div class="tool-out" aria-live="polite">' + out + "</div></div>";
  }
  function rng(id, label, min, max, step, val, fmt) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + ' <output id="' + id + '-o"></output></label><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-fmt="' + (fmt || "") + '"></div>';
  }
  function numf(id, label, val, step, hint) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><input type="number" id="' + id + '" value="' + val + '" step="' + (step || 1) + '" min="0">' + (hint ? '<span class="hint">' + esc(hint) + "</span>" : "") + "</div>";
  }
  function sel(id, label, opts, val) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) {
      return o.g ? '<optgroup label="' + esc(o.g) + '">' + o.o.map(function (p) { return '<option value="' + esc(p[0]) + '"' + (String(p[0]) === String(val) ? " selected" : "") + ">" + esc(p[1]) + "</option>"; }).join("") + "</optgroup>"
        : '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select></div>";
  }
  function note(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "s" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    var dp = input.step.indexOf(".") > -1 ? input.step.split(".")[1].length : 0;
    o.textContent = f === "pct" ? v.toFixed(dp) + "%" : f === "yr" ? v + (v === 1 ? " year" : " years") : f === "y" ? String(v) : f === "money" ? money(v) : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.tagName === "SELECT") i.addEventListener("change", fn);
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function yearFmt(v) { return String(Math.round(v)); }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) ? v : 0; }
  function cagr(a) { if (!a.length) return 0; var g = 1; a.forEach(function (r) { g *= 1 + r / 100; }); return (Math.pow(Math.max(g, 1e-9), 1 / a.length) - 1) * 100; }
  function mean(a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : 0; }
  function slice(o, k, y0, y1) { return o[k].slice(Math.max(0, y0 - o.y0), y1 - o.y0 + 1); }
  function ncdf(x) { var t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
  INV.s6aStats = { cagr: cagr, mean: mean, slice: slice, ncdf: ncdf };
  var HZ = ["6 months", "1 year", "3 years", "5 years", "10 years", "15 years", "20 years"];

  /* ---------- 1. SPIVA explorer (INV-043, INV-045) ---------- */
  TOOLS.s6aSpiva = function (el) {
    var u = uid(el), groups = {};
    D.spiva.forEach(function (c, i) { (groups[c.g] = groups[c.g] || []).push([i, c.n]); });
    var og = Object.keys(groups).map(function (g) { return { g: g, o: groups[g] }; });
    var start = el.getAttribute("data-cat") || "1";
    shell(el, "How often do active funds trail their benchmark?", "SPIVA data",
      sel(u + "-c", "Fund category", og, start) +
      sel(u + "-h", "Period ending June 30, 2026", HZ.map(function (h, i) { return [i, h]; }), 6) +
      note("Source: S&P Dow Jones Indices, SPIVA U.S. Scorecard, Mid-Year 2026. Each category is compared with its own benchmark. Funds that closed or merged count as underperformers. Survivorship is reported for US equity categories only."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var c = D.spiva[Number(self(el, "c").value)] || D.spiva[1], h = Number(self(el, "h").value);
      var under = c.u[h], surv = c.s ? c.s[h] : null;
      self(el, "k").innerHTML = kpi("Trailed the benchmark", pct(under, 0), "bad") + kpi("Beat the benchmark", pct(100 - under, 0), "good") +
        kpi("Funds still alive at the end", surv == null ? "Not reported" : pct(surv, 0));
      INV.barChart(self(el, "ch"), { label: "Share of funds trailing the benchmark by period", height: 230, allLabels: true, valueLabels: true, yFmt: function (v) { return Math.round(v) + "%"; },
        xTitle: "Length of period ending June 30, 2026", data: c.u.map(function (v, i) { return { label: HZ[i].replace(" years", " yr").replace(" year", " yr").replace(" months", " mo"), tip: HZ[i], y: v, color: i === h ? "var(--s5)" : "var(--s6)" }; }) });
      self(el, "n").innerHTML = "<b>" + esc(c.n) + "</b> versus the <b>" + esc(c.b) + "</b>: over " + HZ[h] + ", " + pct(under, 1) + " of actively managed funds did worse than the index." +
        (surv == null ? "" : " Only " + pct(surv, 1) + " of the funds that existed at the start were still operating at the end; the rest were merged or liquidated, usually after poor results.") +
        " Short periods can favor active managers; the longer the period, the more the costs show.";
    }
    wire(el, run);
  };

  /* ---------- 2. Luck or skill? coin-flip managers (INV-043, INV-045) ---------- */
  TOOLS.s6aLuck = function (el) {
    var u = uid(el);
    shell(el, "How many 'star' managers would luck alone produce?", "Model",
      numf(u + "-n", "Number of funds with zero skill", 1000, 50) +
      rng(u + "-k", "Years in a row", 1, 15, 1, 5, "yr") +
      rng(u + "-p", "Chance a fund beats its benchmark in any one year", 20, 60, 1, 50, "pct") +
      note("Each fund's yearly result is an independent coin flip with the chance you set. Expected counts use the binomial formula; no fund here has any skill."),
      '<div class="kpis" id="' + u + '-k2"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-t"></p>');
    function binom(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
    function run() {
      var N = Math.max(0, Math.round(num(el, "n"))), k = num(el, "k"), p = num(el, "p") / 100;
      var all = N * Math.pow(p, k), atLeast1 = 1 - Math.pow(1 - Math.pow(p, k), N);
      self(el, "k2").innerHTML = kpi("Expected to beat every year", all >= 10 ? Math.round(all).toLocaleString() : all.toFixed(1), "good") +
        kpi("Chance at least one does", pct(atLeast1 * 100, 0)) + kpi("Chance for any single fund", pct(Math.pow(p, k) * 100, k > 8 ? 3 : 1));
      var data = []; for (var j = 0; j <= k; j++) { data.push({ label: String(j), tip: j + " of " + k + " years beaten", y: N * binom(k, j) * Math.pow(p, j) * Math.pow(1 - p, k - j), color: j === k ? "var(--s2)" : "var(--s6)" }); }
      INV.barChart(self(el, "ch"), { label: "Expected number of funds by years beaten", height: 220, allLabels: true, xTitle: "Years beaten (out of " + k + ")", yFmt: function (v) { return v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(v >= 10 ? 0 : 1); }, data: data });
      self(el, "t").innerHTML = "Out of " + N.toLocaleString() + " funds with no skill at all, about <b>" + (all >= 10 ? Math.round(all).toLocaleString() : all.toFixed(1)) + "</b> would beat the benchmark " + k + " year" + (k === 1 ? "" : "s") + " in a row by chance. " +
        "A winning streak is therefore weak evidence of skill unless it is far longer, or far more common, than chance predicts. In S&amp;P's Year-End 2025 Persistence Scorecard, only 4.5% of top-half large-cap funds stayed in the top half four more years, fewer than the 6.25% a coin flip predicts, and no top-quartile large-cap fund stayed in the top quartile.";
    }
    wire(el, run);
  };

  /* ---------- 3. Sharpe's arithmetic (INV-043) ---------- */
  TOOLS.s6aArith = function (el) {
    var u = uid(el);
    shell(el, "Sharpe's arithmetic: the average active dollar", "Model",
      rng(u + "-m", "Market return this year", -20, 30, 1, 8, "pct") +
      rng(u + "-a", "Share of money managed actively", 5, 95, 5, 50, "pct") +
      rng(u + "-ca", "Average cost of active management", 0, 2, 0.05, 0.6, "pct") +
      rng(u + "-cp", "Average cost of index funds", 0, 0.5, 0.01, 0.05, "pct") +
      note("Passive investors hold every stock in market proportions, so before costs they earn exactly the market return. Active investors together hold the rest of the market, so before costs they must earn it too (Sharpe, 1991)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var m = num(el, "m"), a = num(el, "a") / 100, ca = num(el, "ca"), cp = num(el, "cp");
      var act = m - ca, pas = m - cp;
      self(el, "k").innerHTML = kpi("Average passive dollar", pct(pas, 2), "good") + kpi("Average active dollar", pct(act, 2), act < pas ? "bad" : "good") + kpi("Gap each year", pct(pas - act, 2));
      INV.barChart(self(el, "ch"), { label: "Market, passive and active returns", height: 220, allLabels: true, valueLabels: true, yFmt: function (v) { return v.toFixed(1) + "%"; }, tipFmt: function (v) { return pct(v, 2); },
        data: [{ label: "Market, before costs", y: m, color: "var(--s6)" }, { label: "Passive, after costs", y: pas, color: "var(--s2)" }, { label: "Active, after costs", y: act, color: "var(--s5)" }] });
      self(el, "n").innerHTML = "Whether " + pct(a * 100, 0) + " or any other share of money is active, the active group as a whole owns the part of the market that index funds do not, so it earns the market's " + pct(m, 1) + " before costs. " +
        "After costs the average active dollar earns " + pct(act, 2) + ", " + pct(pas - act, 2) + " a year behind the average passive dollar. Some active managers will beat the market, but only by taking the same amount from other active managers.";
    }
    wire(el, run);
  };

  /* ---------- 4. Three-fund portfolio builder (INV-044) ---------- */
  TOOLS.s6aThreeFund = function (el) {
    var u = uid(el);
    shell(el, "Build a three-fund portfolio and price it", "Calculator",
      numf(u + "-v", "Portfolio value ($)", 100000, 1000) +
      rng(u + "-s", "Stocks (the rest in a total US bond fund)", 0, 100, 5, 80, "pct") +
      rng(u + "-i", "International share of the stock part", 0, 60, 5, 30, "pct") +
      rng(u + "-eu", "Expense ratio: total US stock fund", 0, 1, 0.01, 0.03, "pct") +
      rng(u + "-ei", "Expense ratio: total international stock fund", 0, 1, 0.01, 0.05, "pct") +
      rng(u + "-eb", "Expense ratio: total US bond fund", 0, 1, 0.01, 0.03, "pct") +
      rng(u + "-y", "Years", 1, 40, 1, 30, "yr") +
      note("Comparison: the same mix at the Investment Company Institute's 2025 asset-weighted averages for all equity mutual funds (0.40%) and bond mutual funds (0.36%). Growth assumes 6% a year before costs, no additions."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var V = Math.max(0, num(el, "v")), s = num(el, "s") / 100, i = num(el, "i") / 100, eu = num(el, "eu"), ei = num(el, "ei"), eb = num(el, "eb"), n = num(el, "y");
      var wU = s * (1 - i), wI = s * i, wB = 1 - s;
      var er = wU * eu + wI * ei + wB * eb, erC = s * 0.40 + wB * 0.36;
      var a = [[0, V]], b = [[0, V]], va = V, vb = V;
      for (var t = 1; t <= n; t++) { va *= 1.06 * (1 - er / 100); vb *= 1.06 * (1 - erC / 100); a.push([t, va]); b.push([t, vb]); }
      self(el, "k").innerHTML = kpi("Blended expense ratio", pct(er, 3)) + kpi("Cost this year", money(V * er / 100, 0)) + kpi("Average-fund mix costs", money(V * erC / 100, 0), "bad") +
        kpi("Gap after " + n + " years", money(va - vb, 0), "good");
      INV.lineChart(self(el, "ch"), { label: "Growth at two cost levels", height: 240, xTitle: "Years", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Three index funds, " + pct(er, 2), color: "var(--s2)", data: a }, { name: "Average-cost funds, " + pct(erC, 2), color: "var(--s5)", data: b, dash: "5 4" }] });
      self(el, "n").innerHTML = "Mix: <b>" + pct(wU * 100, 0) + "</b> total US stock, <b>" + pct(wI * 100, 0) + "</b> total international stock, <b>" + pct(wB * 100, 0) + "</b> total US bond. " +
        "The blended expense ratio is each fund's cost weighted by its share. Over " + n + " years the cost difference alone leaves the index version about " + money(va - vb, 0) + " ahead, before any difference in returns.";
    }
    wire(el, run);
  };

  /* ---------- 5. Skill, fees and time (INV-045) ---------- */
  TOOLS.s6aSkill = function (el) {
    var u = uid(el);
    shell(el, "Can a skilled manager's edge survive the fee?", "Model",
      rng(u + "-a", "Manager's true edge before fees (alpha)", -2, 4, 0.25, 1, "pct") +
      rng(u + "-f", "Fee above an index fund", 0, 2, 0.05, 0.75, "pct") +
      rng(u + "-te", "Tracking error (how far yearly results stray from the index)", 1, 12, 0.5, 5, "pct") +
      rng(u + "-y", "Years you hold the fund", 1, 40, 1, 10, "yr") +
      note("Yearly excess returns are assumed to be normally distributed around the net edge with the tracking error as their spread. A simplified model: real managers' edges change over time and are unknown."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var a = num(el, "a"), f = num(el, "f"), te = Math.max(0.5, num(el, "te")), y = num(el, "y");
      var net = a - f, ir = net / te, p = ncdf(ir * Math.sqrt(y));
      var need = Math.abs(net) < 0.01 ? null : Math.pow(2 / Math.abs(ir), 2);
      self(el, "k").innerHTML = kpi("Edge after the fee", pct(net, 2), net > 0 ? "good" : "bad") + kpi("Information ratio", ir.toFixed(2)) +
        kpi("Chance of beating the index over " + y + " yr", pct(p * 100, 0), p >= 0.5 ? "good" : "bad") + kpi("Years of data to detect the edge", need == null ? "Never" : need > 9999 ? "9,999+" : Math.round(need).toLocaleString());
      var pts = []; for (var t = 1; t <= 40; t++) pts.push([t, ncdf(ir * Math.sqrt(t)) * 100]);
      INV.lineChart(self(el, "ch"), { label: "Chance of beating the index by holding period", height: 230, yMin: 0, yMax: 100, xTitle: "Years held", yTitle: "Chance of ending ahead (%)", xFmt: yearFmt, yFmt: function (v) { return Math.round(v) + "%"; },
        series: [{ name: "Chance of beating the index", color: net > 0 ? "var(--s2)" : "var(--s5)", data: pts }], dots: [{ x: y, y: p * 100, label: pct(p * 100, 0), color: "var(--s1)" }] });
      self(el, "n").innerHTML = "The information ratio (edge after fees ÷ tracking error) is " + ir.toFixed(2) + ". " +
        (need == null ? "With no edge after fees there is nothing for any number of years of results to detect. " :
          "To show " + (net > 0 ? "a real edge" : "that the fund really trails") + " with the usual statistical test (a t-statistic of 2), you would need about " + Math.round(need).toLocaleString() + " years of results: (2 ÷ " + Math.abs(ir).toFixed(2) + ")². ") +
        (net <= 0 ? "Because the fee is at least as large as the edge, time works <b>against</b> you: the longer you hold, the more likely you trail." : "A positive edge helps more the longer you hold, but noise dominates over any period an investor can wait.");
    }
    wire(el, run);
  };

  /* ---------- 6. Value versus growth explorer (INV-046) ---------- */
  TOOLS.s6aValue = function (el) {
    var u = uid(el), y0 = D.bm.y0, y1 = y0 + D.bm.value.length - 1;
    shell(el, "Value versus growth, any period since 1927", "Historical data",
      rng(u + "-a", "First year", y0, y1 - 1, 1, 2007, "y") + rng(u + "-b", "Last year", y0 + 1, y1, 1, y1, "y") +
      note("Value: the 30% of US stocks with the highest book-to-market ratios; growth: the 30% with the lowest. Value-weighted, rebalanced each June. Kenneth R. French Data Library. Before costs and taxes."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n"></p>');
    var ai = self(el, "a"), bi = self(el, "b");
    function run() {
      var a = Number(ai.value), b = Number(bi.value);
      if (b <= a) { b = Math.min(y1, a + 1); bi.value = b; fmtOut(bi); }
      var v = slice(D.bm, "value", a, b), g = slice(D.bm, "growth", a, b), cv = cagr(v), cg = cagr(g);
      var pv = [[a - 1 + 1, 1]], pg = [[a, 1]], gv = 1, gg = 1, won = 0;
      for (var i = 0; i < v.length; i++) { gv *= 1 + v[i] / 100; gg *= 1 + g[i] / 100; pv.push([a + i + 1, gv]); pg.push([a + i + 1, gg]); if (v[i] > g[i]) won++; }
      self(el, "k").innerHTML = kpi("Value, per year", pct(cv, 1), cv >= cg ? "good" : "bad") + kpi("Growth, per year", pct(cg, 1), cg > cv ? "good" : "bad") +
        kpi("Difference per year", pct(cv - cg, 1)) + kpi("Years value won", won + " of " + v.length);
      INV.lineChart(self(el, "ch"), { label: "Growth of $1, value versus growth", height: 250, log: true, xFmt: yearFmt, yFmt: function (x) { return x >= 100 ? "$" + Math.round(x).toLocaleString() : "$" + (x >= 10 ? x.toFixed(0) : x.toFixed(x >= 1 ? 1 : 2)); }, yTitle: "Growth of $1 (log scale)",
        series: [{ name: "Value stocks", color: "var(--s3)", data: pv }, { name: "Growth stocks", color: "var(--s1)", data: pg }] });
      self(el, "n").innerHTML = "From the start of " + a + " to the end of " + b + ", $1 in value stocks became <b>$" + gv.toFixed(2) + "</b> and $1 in growth stocks became <b>$" + gg.toFixed(2) + "</b>. " +
        (cv >= cg ? "Value led by " + pct(cv - cg, 1) + " a year." : "Growth led by " + pct(cg - cv, 1) + " a year.") + " Try 1927 to 2006, then 2007 to 2020.";
    }
    wire(el, run);
  };

  /* ---------- 7. Dividends-only versus total-return spending (INV-047) ---------- */
  TOOLS.s6aIncome = function (el) {
    var u = uid(el);
    shell(el, "Live on dividends, or on the whole return?", "Model",
      numf(u + "-v", "Portfolio value ($)", 780000, 10000) + numf(u + "-w", "Spending needed from it in year 1 ($)", 31200, 500) +
      rng(u + "-r", "Total return per year (same for both)", 2, 10, 0.5, 6, "pct") +
      rng(u + "-y", "Dividend yield of an income-focused portfolio", 0.5, 6, 0.1, 3.3, "pct") +
      rng(u + "-i", "Inflation (spending rises each year)", 0, 5, 0.5, 2.5, "pct") +
      rng(u + "-n", "Years", 5, 35, 1, 25, "yr") +
      note("Income-only: spend the dividends and never sell; the portfolio grows at total return minus yield, and dividends grow with it. Total-return: withdraw the inflation-adjusted amount you need, selling shares when dividends fall short. Before taxes; both portfolios earn the same total return, as Miller and Modigliani's reasoning implies."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var V = Math.max(0, num(el, "v")), W = Math.max(0, num(el, "w")), r = num(el, "r") / 100, y = num(el, "y") / 100, inf = num(el, "i") / 100, n = num(el, "n");
      var va = V, vb = V, inc = [], need = [], wd = [], short = 0, depleted = null;
      for (var t = 1; t <= n; t++) {
        var nd = W * Math.pow(1 + inf, t - 1), div = va * y;
        inc.push([t, div]); need.push([t, nd]); if (div < nd) short += nd - div;
        va = va * (1 + r - y);
        var take = Math.min(nd, vb); wd.push([t, take]); vb = (vb - take) * (1 + r); if (vb <= 0 && depleted == null) depleted = t; vb = Math.max(0, vb);
      }
      var d1 = V * y;
      self(el, "k").innerHTML = kpi("Year-1 dividends", money(d1, 0), d1 >= W ? "good" : "bad") + kpi("Year-1 need", money(W, 0)) +
        kpi("Total shortfall, income-only", money(short, 0), short > 0 ? "bad" : "good") + kpi("Balance after " + n + " yr: income-only", money(va, 0)) + kpi("Balance: total-return", money(vb, 0), vb > 0 ? "" : "bad");
      INV.lineChart(self(el, "ch"), { label: "Spending each year under two approaches", height: 250, xTitle: "Year of retirement", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Dividends (income-only)", color: "var(--s3)", data: inc }, { name: "Withdrawal (total-return)", color: "var(--s2)", data: wd }, { name: "What you need", color: "var(--s6)", data: need, dash: "5 4", width: 1.6 }] });
      self(el, "n2").innerHTML = "At a " + pct(y * 100, 1) + " yield, dividends cover " + pct(W > 0 ? Math.min(999, d1 / W * 100) : 0, 0) + " of the first year's need. " +
        "Where the withdrawal line and the dashed need line coincide, the total-return portfolio is paying exactly what you need. The income-only approach lets the market decide what you spend; the total-return approach lets you decide and sells shares to fill the gap. " +
        (depleted ? "At this spending level the total-return portfolio runs out in year " + depleted + "; spending, not dividend policy, is the real risk." : "Neither choice changes the total return; it only changes who sets your paycheck.");
    }
    wire(el, run);
  };

  /* ---------- 8. Factor explorer (INV-048, INV-046) ---------- */
  var FACT = {
    mkt: { n: "Market minus T-bills", o: "ff", k: "mkt", sub: "rf", y0: 1927 },
    smb: { n: "Size (SMB)", o: "ff", k: "smb", y0: 1927 },
    hml: { n: "Value (HML)", o: "ff", k: "hml", y0: 1927 },
    mom: { n: "Momentum", o: "ff", k: "mom", y0: 1927 },
    rmw: { n: "Profitability (RMW)", o: "ff5", k: "rmw", y0: 1964 },
    cma: { n: "Investment (CMA)", o: "ff5", k: "cma", y0: 1964 }
  };
  function factorSeries(key, a, b) {
    var f = FACT[key], o = D[f.o];
    if (f.pair) { var x = slice(o, f.pair[0], a, b), z = slice(o, f.pair[1], a, b); return x.map(function (v, i) { return Math.round((v - z[i]) * 100) / 100; }); }
    if (f.sub) { var m = slice(o, f.k, a, b), rf = slice(o, f.sub, a, b); return m.map(function (v, i) { return Math.round((v - rf[i]) * 100) / 100; }); }
    return slice(o, f.k, a, b);
  }
  INV.s6aFactor = factorSeries;
  TOOLS.s6aFactor = function (el) {
    var u = uid(el), last = D.ff.y0 + D.ff.mkt.length - 1;
    var start = el.getAttribute("data-factor") || "hml";
    shell(el, "Factor explorer: premiums and droughts", "Historical data",
      sel(u + "-f", "Factor", Object.keys(FACT).map(function (k) { return [k, FACT[k].n]; }), start) +
      rng(u + "-a", "First year", 1927, last - 10, 1, 1927, "y") +
      note("SMB: small minus big companies. HML: high minus low book-to-market (value minus growth). Momentum: past winners minus losers. RMW: robust minus weak profitability. CMA: conservative minus aggressive investment. Each factor is the yearly return of a long-short portfolio (the first group minus the second), US stocks, before costs and taxes. Kenneth R. French Data Library. The market factor is stocks minus one-month Treasury bills. The growth line compounds each year's premium, which no one can hold directly without shorting."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><div id="' + u + '-bars"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var key = self(el, "f").value, f = FACT[key] || FACT.hml, ai = self(el, "a"), a = Math.max(Number(ai.value), f.y0), r = factorSeries(key, a, last);
      if (Number(ai.value) < f.y0) { ai.value = a; fmtOut(ai); }
      var g = 1, peak = 1, under = 0, mu = 0, pts = [[a, 1]], worst = Infinity, wy = a, pos = 0;
      r.forEach(function (x, i) { g *= 1 + x / 100; if (g >= peak) { peak = g; under = 0; } else { under++; mu = Math.max(mu, under); } pts.push([a + i + 1, g]); if (x < worst) { worst = x; wy = a + i; } if (x > 0) pos++; });
      var neg = 0, win = 0; for (var i = 0; i + 10 <= r.length; i++) { win++; if (cagr(r.slice(i, i + 10)) < 0) neg++; }
      self(el, "k").innerHTML = kpi("Average premium / yr", pct(mean(r), 1), mean(r) > 0 ? "good" : "bad") + kpi("Years positive", pct(r.length ? pos / r.length * 100 : 0, 0)) +
        kpi("Worst year", pct(worst, 1) + " (" + wy + ")", "bad") + kpi("Longest below a prior peak", mu + " yrs") + kpi("10-year periods that lost", win ? neg + " of " + win : "—");
      INV.lineChart(self(el, "ch"), { label: "Cumulative factor premium", height: 230, log: true, xFmt: yearFmt, yTitle: "Growth of $1 in the premium (log scale)",
        yFmt: function (x) { return x >= 10 ? "$" + Math.round(x) : "$" + x.toFixed(x >= 1 ? 1 : 2); }, series: [{ name: f.n, color: "var(--s4)", data: pts }] });
      INV.barChart(self(el, "bars"), { label: "Premium each year", height: 170, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return pct(v, 1); },
        data: r.map(function (x, i) { return { label: String(a + i), y: x, color: x >= 0 ? "var(--s2)" : "var(--s5)" }; }) });
      self(el, "n").innerHTML = "<b>" + esc(f.n) + "</b>, " + a + "&ndash;" + last + ": an average of " + pct(mean(r), 1) + " a year, positive in " + pos + " of " + r.length + " years. " +
        "The longest stretch below a previous high lasted <b>" + mu + " years</b>. A premium you cannot hold through its droughts is a premium you will not collect.";
    }
    wire(el, run);
  };
})();
