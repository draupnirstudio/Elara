export enum AuctionAlgorithm {
  NormalDistribution = 'normal-distribution',
  UniformDistribution = 'uniform-distribution',
  WeibullDistribution = 'weibull-distribution'
}

function normalDistribution(mean: number, dev: number) {
  let s;
  let u;
  let v;
  let norm;
  
  do {
    // U and V are from the uniform distribution on (-1, 1)
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    
    s = u * u + v * v;
  } while (s >= 1);
  
  // Compute the standard normal variate
  norm = u * Math.sqrt(-2 * Math.log(s) / s);
  
  // Shape and scale
  return dev * norm + mean;
}


export function generateAuctionPrice(mean: number, dev: number, algorithm: AuctionAlgorithm) {
  switch (algorithm) {
    case AuctionAlgorithm.NormalDistribution:
      return normalDistribution(mean, dev);
    default:
      return 100;
  }
}