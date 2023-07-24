// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "./IVwTips.sol";

contract VwTips is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IVwTips
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Chainlink ETH/USD price feed contract address for use to calculate tips.
    AggregatorV3Interface internal priceFeed;

    // The percentage to be deducted from the tips (as a commission to the contract owner) before transfering the tips to the receiver, need to store it as a whole number and do division when using it.
    uint256 public feeRate;

    event Withdrawal(address to, uint256 amount, uint256 timestamp);

    event TipsTransferred(
        address from,
        address to,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * Initialize function
     * @param priceFeedAddress - An address of ChainLink price feed contract
     */
    function initialize(address priceFeedAddress) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        priceFeed = AggregatorV3Interface(priceFeedAddress);
        feeRate = 10; // 10% fee rate
    }

    /**
     * @inheritdoc IVwTips
     */
    function withdraw() external override onlyRole(DEFAULT_ADMIN_ROLE) {
        emit Withdrawal(msg.sender, address(this).balance, block.timestamp);
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * A private function to calculate 1 USD in Wei.
     * @dev Price feed price is a usd amount with decimals and the decimals, for exmaple if the returned value is (118735000000, 8) it means 1 eth = 1187.35000000 usd.
     */
    function _usdToWei() private view returns (uint256) {
        // Get ETH/USD price from Chainlink price feed.
        (, int price, , uint256 updatedAt, ) = priceFeed.latestRoundData();

        // Check if the price feed is stale (1 hour passed).
        require(block.timestamp - updatedAt <= 3600, "Stale price");

        uint8 decimals = priceFeed.decimals();
        // Calculate 1 usd in wei.
        return (1e18 * (10 ** uint256(decimals))) / uint256(price);
    }

    /**
     * @inheritdoc IVwTips
     */
    /**
     * Convert USD to wei
     * @param qty - number of USD to be sent as a tips
     */
    function calculateTips(uint256 qty) public view override returns (uint256) {
        return _usdToWei() * qty;
    }

    /**
     * A private function to validate if the submitted tips valid.
     * Accept maximum 10% different between the submitted tips and the calculated tips.
     */
    /**
     * @param submitted - submitted tips amount in wei
     * @param qty - number of USD to be sent as a tips
     */
    function _tipsValid(
        uint256 submitted,
        uint256 qty
    ) private view returns (bool) {
        uint256 calculated = calculateTips(qty);

        uint256 multiplier = 100;
        uint256 diff = (submitted * multiplier) / calculated;

        return
            submitted >= calculated
                ? diff - multiplier <= 10
                : multiplier - diff <= 10;
    }

    /**
     * @inheritdoc IVwTips
     */
    function tip(address to, uint256 qty) external payable override {
        uint tips = msg.value;

        // Validate tips
        bool isValid = _tipsValid(tips, qty);
        require(isValid, "Invalid values");

        uint256 fee = (tips * feeRate) / 100;
        uint256 net = tips - fee;

        // Transfer net to receiver.
        payable(to).transfer(net);

        // Emit event
        emit TipsTransferred(msg.sender, to, tips, fee, block.timestamp);
    }

    /**
     * @inheritdoc IVwTips
     */
    function getPriceFeedAddress() external view returns (address) {
        return address(priceFeed);
    }

    /**
     * @inheritdoc IVwTips
     */
    function getFeeRate() external view returns (uint256) {
        return feeRate;
    }

    /**
     * @inheritdoc IVwTips
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}
}
