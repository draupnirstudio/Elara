import * as moment from 'moment';

export function generateAuctionId(): string {
  return moment().format('YYYY_MM_DD_HH_mm_ss');
}