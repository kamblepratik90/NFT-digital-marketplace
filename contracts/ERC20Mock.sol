//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {

    uint8 private tokenDecimals;
    constructor(
        address _address,
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        uint8 _decimals
    ) ERC20(_name, _symbol) {
        tokenDecimals = _decimals;
        _mint(_address, _totalSupply);
    }

	function decimals() public view override returns (uint8) {
		return tokenDecimals;
	}
}
