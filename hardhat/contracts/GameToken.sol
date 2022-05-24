// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GameToken is Context, Ownable, ERC20 {
    // admin address
    address private admin;
    // set max circulation of tokens: 100000000000000000000
    uint256 private _maxSupply = 1000000 * (10**uint256(decimals()));
    uint256 private _unit = 10**uint256(decimals());

    // only admin account can unlock escrow
    modifier onlyAdmin() {
        require(msg.sender == admin, "GameToken: Only admin can mint tokens.");
        _;
    }

    /**
     * @dev Returns max supply of the token.
     */
    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    /**
     * @dev Returns single unit of account.
     */
    function unit() public view returns (uint256) {
        return _unit;
    }

    /**
     * @dev Constructor that gives _msgSender() all of existing tokens.
     */
    constructor() ERC20("Cool", "COOL") {
        admin = msg.sender;
        // init circulation
        mint();
    }

    function mint() public onlyAdmin {
        _mint(msg.sender, _maxSupply);
    }

    // player must approve allowance for escrow/P2EGame contract to use (spender)
    function approve(address spender, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }
}