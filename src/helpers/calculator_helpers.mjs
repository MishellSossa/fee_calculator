/**
 * Fills a fee map with data from parsedData.
 *
 * @param {Array} parsedData - The parsed data containing fee information.
 * @param {Object} map - The fee map to be filled.
 */
export function fillFeeMap(parsedData, map) {
    parsedData.map((fee) => {
      map[fee.order_item_type] = fee.fees.map((fee) => {
        const propertyName = fee.type === 'flat' ? 'flat_fee' : 'per_page_fee';
        return {
          [propertyName]: {amount: fee.amount},
        };
      });
    });
  }
/**
 * Fills a distribution object with data from parsedData.
 *
 * @param {Array} parsedData - The parsed data to extract distributions from.
 * @param {Object} map - The map to fill with distribution objects.
 */
export function fillDistributionObject(parsedData, map) {
    parsedData.forEach((fee) => {
    let total = 0;
      const distributionObject = {};
  
      fee.distributions.forEach((distribution) => {
        total += parseFloat(distribution.amount);
        distributionObject[distribution.name] = parseFloat(distribution.amount);
      });
  
      distributionObject.fund_grand_total = total;
      map[fee.order_item_type] = distributionObject;
    });
  }
/**
 * Retrieves a distribution object from the given copyOfDistributionsObject based on the specified type.
 *
 * @param {Object} copyOfDistributionsObject - The object containing the distributions.
 * @param {string} type - The type of distribution to retrieve.
 * @return {Object} The distribution object matching the specified type, or undefined if not found.
 */
export function getDistributionByType(copyOfDistributionsObject, type) {
    for (const distributions in copyOfDistributionsObject) {
        if(distributions === type){
            return copyOfDistributionsObject[distributions];
        }
    }  
  }
/**
 * Finds the grand total in the given fees detail array.
 *
 * @param {Array} feesDetail - The array containing the fees detail.
 * @return {number|null} The grand total if found, otherwise null.
 */
  export function findGrandTotal(feesDetail){
    if(feesDetail.length > 0){
        const lastObject = feesDetail[feesDetail.length - 1];
        
        if(lastObject && 'grand_total' in lastObject){
            return lastObject['grand_total'];
        }
    }
    return null;
  }