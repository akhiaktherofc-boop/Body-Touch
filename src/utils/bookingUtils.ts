import { Companion } from '../types';

export const calculateBookingCost = (hourlyRate: number, service: string, timeFrame: string, companion?: Companion): number => {
  if (companion) {
    if (service === 'REAL') {
      if (timeFrame.startsWith('CUSTOM_') && companion.customRealRates) {
        const idx = parseInt(timeFrame.split('_')[1]);
        if (companion.customRealRates[idx]) {
          return companion.customRealRates[idx].rate;
        }
      }
      if (timeFrame === '1_HOUR' && companion.rateReal_1h && companion.rateReal_1h > 0) return companion.rateReal_1h;
      if (timeFrame === '2_HOURS' && companion.rateReal_2h && companion.rateReal_2h > 0) return companion.rateReal_2h;
      if (timeFrame === '3_HOURS' && companion.rateReal_3h && companion.rateReal_3h > 0) return companion.rateReal_3h;
      if (timeFrame === 'FULL_NIGHT' && companion.rateReal_fn && companion.rateReal_fn > 0) return companion.rateReal_fn;
      if (timeFrame === '2_DAYS' && companion.rateReal_2d && companion.rateReal_2d > 0) return companion.rateReal_2d;
    } else if (service === 'CAM') {
      if (timeFrame.startsWith('CUSTOM_') && companion.customCamRates) {
        const idx = parseInt(timeFrame.split('_')[1]);
        if (companion.customCamRates[idx]) {
          return companion.customCamRates[idx].rate;
        }
      }
      if (timeFrame === '30_MIN' && companion.rateCam_30m && companion.rateCam_30m > 0) return companion.rateCam_30m;
      if (timeFrame === '1_HOUR' && companion.rateCam_1h && companion.rateCam_1h > 0) return companion.rateCam_1h;
      if (timeFrame === '2_HOURS' && companion.rateCam_2h && companion.rateCam_2h > 0) return companion.rateCam_2h;
    } else if (service === 'MAKE_OUT') {
      if (timeFrame === '2_HOURS' && companion.rateMakeOut_2h && companion.rateMakeOut_2h > 0) return companion.rateMakeOut_2h;
      if (timeFrame === '3_HOURS' && companion.rateMakeOut_3h && companion.rateMakeOut_3h > 0) return companion.rateMakeOut_3h;
      if (timeFrame === 'FULL_NIGHT' && companion.rateMakeOut_fn && companion.rateMakeOut_fn > 0) return companion.rateMakeOut_fn;
    } else if (service === 'LIVE_TOGETHER') {
      if (timeFrame.startsWith('CUSTOM_') && companion.customLiveTogetherRates) {
        const idx = parseInt(timeFrame.split('_')[1]);
        if (companion.customLiveTogetherRates[idx]) {
          return companion.customLiveTogetherRates[idx].rate;
        }
      }
      if (timeFrame === '2_DAYS' && companion.rateLiveTogether_2d && companion.rateLiveTogether_2d > 0) return companion.rateLiveTogether_2d;
      if (timeFrame === '7_DAYS' && companion.rateLiveTogether_7d && companion.rateLiveTogether_7d > 0) return companion.rateLiveTogether_7d;
      if (timeFrame === '15_DAYS' && companion.rateLiveTogether_15d && companion.rateLiveTogether_15d > 0) return companion.rateLiveTogether_15d;
      if (timeFrame === '1_MONTH' && companion.rateLiveTogether_1m && companion.rateLiveTogether_1m > 0) return companion.rateLiveTogether_1m;
    }
  }

  let baseRate = hourlyRate || 10000;
  
  if (service === 'REAL') {
    if (companion && companion.rateReal && companion.rateReal > 0) {
      baseRate = companion.rateReal;
    }
  } else if (service === 'CAM') {
    if (companion && companion.rateCam && companion.rateCam > 0) {
      baseRate = companion.rateCam;
    } else {
      baseRate = baseRate * 0.55; // 45% off
    }
  } else if (service === 'MAKE_OUT') {
    if (companion && companion.rateMakeOut && companion.rateMakeOut > 0) {
      baseRate = companion.rateMakeOut;
    } else {
      baseRate = baseRate * 0.65; // 35% off
    }
  } else if (service === 'LIVE_TOGETHER') {
    if (companion && companion.rateLiveTogether && companion.rateLiveTogether > 0) {
      baseRate = companion.rateLiveTogether;
    }
  }
  
  // Calculate multiplier based on duration timeFrame
  let multiplier = 2; // default: 2 hours
  switch (timeFrame) {
    case '30_MIN':
      multiplier = 0.5;
      break;
    case '1_HOUR':
      multiplier = 1;
      break;
    case '2_HOURS':
      multiplier = 2;
      break;
    case '3_HOURS':
      multiplier = 3;
      break;
    case 'FULL_NIGHT':
      multiplier = 6; // 8 hours for the price of 6
      break;
    case '2_DAYS':
      multiplier = 12; // 2 days discounted
      break;
    case '7_DAYS':
      multiplier = 25; // 7 days discounted
      break;
    case '15_DAYS':
      multiplier = 45; // 15 days discounted
      break;
    case '1_MONTH':
      multiplier = 80; // 1 month discounted
      break;
  }
  
  return Math.round(baseRate * multiplier);
};
