import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { fillFeeMap, fillDistributionObject, findGrandTotal, getDistributionByType } from './helpers/calculator_helpers.mjs';
function feeCalculator() {
    let parsedFeeData = null;
    let parsedOrderData = null;
    const feesMap = {};
    const distributionsObject = {};
    
    let orderFeesDetails = [];
    /**
     * Initializes the data by reading the fees and orders from JSON files and populating the fee map and distribution object.
     *
     * @throws {Error} If there is an error reading the JSON files.
     */
    const initData = () => {
        try{
            const pathToFees = path.resolve('data/fees.json');
            const pathToOrders = path.resolve('data/orders.json');
            parsedFeeData = JSON.parse(fs.readFileSync(pathToFees, 'utf8'));
            parsedOrderData = JSON.parse(fs.readFileSync(pathToOrders, 'utf8'));
        }catch(err){
            throw new Error(err);
        }
        fillFeeMap(parsedFeeData, feesMap);
        fillDistributionObject(parsedFeeData, distributionsObject);
    }
    /**
     * Calculates the fees detail for a given list of order items.
     *
     * @param {Array} orderItems - The list of order items.
     * @return {Array} - The fees detail for the order items.
     */
    const getFeesDetail = (orderItems) => {
        const detail = [];
        let grandTotal = 0;
        for(const item of orderItems){
            const { type, pages } = item;
            const feeData = feesMap[type];
            
            if (feeData) {
                const flatPrice = (feeData[0] && feeData[0].flat_fee) ? parseFloat(feeData[0].flat_fee.amount) : 0;
                const perPagePrice = (feeData[1] && feeData[1].per_page_fee) ? parseFloat(feeData[1].per_page_fee.amount) : 0;
                if (pages > 1) {
                    const total = ( (pages - 1) * perPagePrice ) + flatPrice;
                    grandTotal += total;
                    detail.push({ [type]: total });
                } else {
                    grandTotal += flatPrice;
                    detail.push({ [type]: flatPrice });
                }
            }
        }
        detail.push({ grand_total: grandTotal });
        return detail;
    }
    /**
     * Generates a funds detail object based on the given order items and fees detail.
     *
     * @param {Array} orderItems - The array of order items.
     * @param {Object} feesDetail - The fees detail object.
     * @return {Object} The funds detail object.
     */
    const getFundsDetail = (orderItems, feesDetail) => {
        const orderGrandTotal = findGrandTotal(feesDetail);
        let fundDistribution = {};
        let returnObject = {};
        let copyOfDistributionsObject = _.cloneDeep(distributionsObject);
        for(const items of orderItems){
            const { type } = items
            fundDistribution = getDistributionByType(copyOfDistributionsObject, type);
            if(!returnObject[type]){
                returnObject[type] = fundDistribution;
            }else{
                for (const key in fundDistribution) {
                    returnObject[type][key] += fundDistribution[key];
                }
            }
            returnObject[type].other = parseFloat(orderGrandTotal - returnObject[type].fund_grand_total);
        }
        return returnObject;
    }
    /**
     * Calculates the totals for each order in the parsed order data.
     *
     */
    const calculateTotals = () => {
        parsedOrderData.map((order)=>{
            const {order_items, order_number} = order;
            const summary = {};
            summary.order_id = order_number;
            
            const feesDetail = getFeesDetail(order_items);
            summary.order_details = feesDetail;
            const fundsDetails = getFundsDetail(order_items, feesDetail);
            summary.order_funds_details = fundsDetails;
            
            orderFeesDetails.push(summary);
        });
    }
    /**
     * Prints the details of each order in the orderFeesDetails array.
     *
     */
    const printOrderDetails = () => {
        orderFeesDetails.forEach((order) => {
            const order_items = order.order_details;
            console.log(`Order ID: ${order.order_id}`);
            
            const formattedItems = order_items.map((item) => {
                return Object.entries(item).map(([key, value]) => {
                    if (key === 'grand_total') {
                        return `Order Total: $${value}`;
                    }
                    return `${key}: $${value}`;
                });
            });
            
            formattedItems.forEach((item) => {
                item.forEach((line) => {
                    console.log(`\t${line}`);
                });
            });
            
        });
    }
    /**
     * Prints the details of the funds.
     *
     */
    const printFundsDetails = () => {
        console.log(`\n*** Funds Details ***\n`);

        // Initialize an object to store the totals for each type and fund
        const totals = {};
      
        orderFeesDetails.forEach((order) => {
          const order_funds_details = order.order_funds_details;
          console.log(`Order ID: ${order.order_id}`);
      
          for (const type in order_funds_details) {
            for (const fund in order_funds_details[type]) {
              if (fund !== 'fund_grand_total') {
                // Initialize the type in totals object if not already done
                if (!totals[type]) {
                  totals[type] = {};
                }
      
                // Initialize the fund in totals[type] object if not already done
                if (!totals[type][fund]) {
                  totals[type][fund] = 0;
                }
      
                // Accumulate the values for each type and fund
                totals[type][fund] += order_funds_details[type][fund];
      
                if (fund === 'other') {
                  console.log(`\tFund - Other: $${order_funds_details[type][fund]}`);
                } else {
                  console.log(`\tFund - ${fund}: $${order_funds_details[type][fund]}`);
                }
              }
            }
          }
        });
      
        // Print the totals
        console.log('\n*** Totals ***\n');
        console.log(`Total distributions: `);
        for (const type in totals) {
          for (const fund in totals[type]) {
            if (fund === 'other') {
              console.log(`\tFund - Other: $${totals[type][fund]}`);
            } else {
              console.log(`\tFund - ${fund}: $${totals[type][fund]}`);
            }
          }
        }
        }
        
        return {
            initData,
            calculateTotals,
            printOrderDetails,
            printFundsDetails
        }
    }
    
    export default feeCalculator;