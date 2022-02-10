//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol

contract NFT1155 is ERC1155, Ownable{

    // uint256 public constant ARTWORK = 0;
    // uint256 public constant PHOTO = 1;
    // uint256 public constant AUDIO = 2;
    // uint256 public constant VIDEO = 3;

    mapping (uint256 => string) private _uris;
    address contractAddress;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor(address marketplaceAddress) ERC1155("") {
        contractAddress = marketplaceAddress;
    }

    function mintNFT(string memory _uri) public {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

         _mint(msg.sender, newItemId, 1, "");
         setTokenURI(newItemId, _uri);
        //Approve or remove operator as an operator for the caller.
        // Operators can call transferFrom or safeTransferFrom for any token owned by the caller.
        // Requirements:
        // The operator cannot be the caller.
        setApprovalForAll(contractAddress, true);
    }

    function uri(uint256 tokenId) override public view returns(string memory) {
        return(_uris[tokenId]);
    }

    function setTokenURI(uint256 tokenId, string memory _uri) internal {
        require(bytes(_uris[tokenId]).length == 0, "Cannnot set uri twice");
        _uris[tokenId] = _uri;
    }

    function burn(address account, uint256 id, uint256 amount) public {
        require(msg.sender == account);
         _burn(account, id, amount);
    }

} 