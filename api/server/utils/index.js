const streamResponse = require('./streamResponse');
const removePorts = require('./removePorts');
const countTokens = require('./countTokens');
const handleText = require('./handleText');
const sendEmail = require('./sendEmail');
const cryptoUtils = require('./crypto');
const queue = require('./queue');
const files = require('./files');
const math = require('./math');

/**
 * Check if email configuration is set
 * @returns {Boolean}
 */
function checkEmailConfig() {
  const serviceCheck = !!process.env.EMAIL_SERVICE && process.env.EMAIL_SERVICE !== 'none';
  const hostCheck = !!process.env.EMAIL_HOST;
  const usernameCheck = !!process.env.EMAIL_USERNAME;
  const passwordCheck = !!process.env.EMAIL_PASSWORD;
  const fromCheck = !!process.env.EMAIL_FROM;
  
  const result = (serviceCheck || hostCheck) && usernameCheck && passwordCheck && fromCheck;
  
  const logger = require('~/config/winston');
  logger.info(`[checkEmailConfig] SERVICE=${process.env.EMAIL_SERVICE}, serviceCheck=${serviceCheck}, hostCheck=${hostCheck}, usernameCheck=${usernameCheck}, passwordCheck=${passwordCheck}, fromCheck=${fromCheck}, RESULT=${result}`);
  
  return result;
}

module.exports = {
  ...streamResponse,
  checkEmailConfig,
  ...cryptoUtils,
  ...handleText,
  countTokens,
  removePorts,
  sendEmail,
  ...files,
  ...queue,
  math,
};
