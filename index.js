import feeCalculator from "./src/feeCalculator.js";

const calculator = feeCalculator();

calculator.initData();
calculator.calculateTotals();
calculator.printOrderDetails();
calculator.printFundsDetails();