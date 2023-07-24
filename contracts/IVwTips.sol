// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IVwTips {
    /**
     * A withdraw funds function for contract owner.
     * @dev Make sure to add `onlyRole(DEFAULT_ADMIN_ROLE` in the implementation function.
     */
    function withdraw() external;

    /**
     * A public function to calculate tips.
     */
    function calculateTips(uint256 qty) external view returns (uint256);

    /**
     * A function to send tips
     */
    function tip(address to, uint256 qty) external payable;

    function getPriceFeedAddress() external view returns (address);

    function getFeeRate() external view returns (uint256);

    function getBalance() external view returns (uint256);
}
