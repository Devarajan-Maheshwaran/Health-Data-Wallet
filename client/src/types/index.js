/**
 * @typedef {Object} HealthRecord
 * @property {number} id
 * @property {string} recordType
 * @property {string} title
 * @property {string} ipfsHash
 * @property {number} timestamp
 */

/**
 * @typedef {Object} Provider
 * @property {string} address
 * @property {string} name
 * @property {boolean} hasAccess
 */

/**
 * @typedef {Object} TransactionStatus
 * @property {boolean} isLoading
 * @property {boolean} isSuccess
 * @property {boolean} isError
 * @property {string|null} errorMessage
 */

// In JavaScript we don't need to extend the Window interface,
// but we can add a comment to document the expected structure

/**
 * Window.ethereum object provided by MetaMask
 * @typedef {Object} EthereumProvider
 * @property {boolean} [isMetaMask]
 * @property {function} request - Method to request actions from the provider
 * @property {function} on - Method to register event listeners
 * @property {function} removeListener - Method to remove event listeners
 * @property {string} [selectedAddress] - Currently selected address
 */